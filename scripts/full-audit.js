// Full read-only audit of the live Convex deployment: where images are hosted,
// whether every referenced image actually loads, and how much space everything
// takes. Makes no writes.
const { ConvexClient } = require("convex/browser");
const fs = require("fs");

try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      process.env[key] = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  }
} catch {}

const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
const client = new ConvexClient(convexUrl);

const fmt = (b) => {
  if (b >= 1073741824) return (b / 1073741824).toFixed(2) + " GB";
  if (b >= 1048576) return (b / 1048576).toFixed(1) + " MB";
  return (b / 1024).toFixed(1) + " KB";
};

const HTTP_SAMPLE = parseInt(process.env.HTTP_SAMPLE || "1500", 10);
const CONCURRENCY = 40;

async function head(url) {
  try {
    const res = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" } });
    return { url, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (e) {
    return { url, status: 0, ok: false, err: String(e.message || e) };
  }
}

async function runPool(items, worker, concurrency) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await worker(items[idx]);
      }
    })
  );
  return out;
}

async function main() {
  console.log("Convex deployment:", convexUrl);

  // ---------- Pass 1: storage inventory ----------
  console.log("\n[1/4] Listing storage files...");
  const files = [];
  let cursor = null, done = false;
  while (!done) {
    const res = await client.query("products:getStorageAuditPage", { cursor, limit: 500 });
    files.push(...res.items);
    cursor = res.continueCursor;
    done = res.isDone;
  }
  const storageBytes = files.reduce((a, f) => a + f.size, 0);
  const bySha = new Map();
  for (const f of files) bySha.set(f.sha256, (bySha.get(f.sha256) || 0) + 1);
  const dupContent = [...bySha.values()].filter((n) => n > 1).length;
  const dupWastedBytes = files.reduce((acc, f) => acc, 0);
  console.log(`  files=${files.length}  total=${fmt(storageBytes)}  distinct-contents=${bySha.size}`);

  // ---------- Pass 2: products + referenced URLs ----------
  console.log("[2/4] Scanning products and referenced image URLs...");
  const referenced = new Set();
  const domainCounts = {};
  let productCount = 0, galleryTotal = 0, docBytes = 0;
  let missingImage = 0, emptyGallery = 0;
  const nonConvex = [];

  cursor = null; done = false;
  while (!done) {
    const res = await client.query("products:listForMigration", { cursor, limit: 500 });
    for (const p of res.page) {
      productCount++;
      docBytes += Buffer.byteLength(JSON.stringify(p), "utf8");
      const urls = [];
      if (p.image) urls.push(p.image); else missingImage++;
      const g = p.gallery || [];
      if (g.length === 0) emptyGallery++;
      galleryTotal += g.length;
      for (const u of g) if (u) urls.push(u);
      for (const u of urls) {
        referenced.add(u);
        let host = "(invalid)";
        try { host = new URL(u).host; } catch { host = "(relative/invalid)"; }
        domainCounts[host] = (domainCounts[host] || 0) + 1;
        if (!host.includes("convex.cloud")) nonConvex.push({ slug: p.slug, url: u });
      }
    }
    cursor = res.continueCursor;
    done = res.isDone;
    if (productCount % 10000 < 500) console.log(`  ${productCount} products...`);
  }

  const slides = await client.query("slides:list", {});
  const slideUrls = [];
  for (const s of slides) if (s.image) { slideUrls.push(s.image); referenced.add(s.image); }

  console.log(`  products=${productCount}  gallery-images=${galleryTotal}  slides=${slides.length}`);

  // ---------- Pass 3: cross-check referenced vs storage ----------
  console.log("[3/4] Cross-checking references against storage...");
  const storageUrls = new Set(files.map((f) => f.url).filter(Boolean));
  const referencedMissing = [...referenced].filter((u) => u.includes("convex.cloud") && !storageUrls.has(u));
  const orphans = files.filter((f) => !f.url || !referenced.has(f.url));
  const orphanBytes = orphans.reduce((a, f) => a + f.size, 0);

  // ---------- Pass 4: real HTTP load test ----------
  const allRefs = [...referenced];
  const sampleSize = Math.min(HTTP_SAMPLE, allRefs.length);
  // deterministic spread across the whole set
  const step = Math.max(1, Math.floor(allRefs.length / sampleSize));
  const sample = [];
  for (let i = 0; i < allRefs.length && sample.length < sampleSize; i += step) sample.push(allRefs[i]);
  console.log(`[4/4] HTTP-testing ${sample.length} of ${allRefs.length} referenced images...`);
  const results = await runPool(sample, head, CONCURRENCY);
  const failed = results.filter((r) => !r.ok);

  // also test every non-convex URL and every slide image explicitly
  const extraTargets = [...new Set([...nonConvex.map((n) => n.url), ...slideUrls])];
  const extraResults = extraTargets.length ? await runPool(extraTargets, head, CONCURRENCY) : [];
  const extraFailed = extraResults.filter((r) => !r.ok);

  // ---------- Report ----------
  console.log("\n=================== ПЪЛЕН ОДИТ ===================");
  console.log("\n-- ХОСТИНГ НА СНИМКИТЕ --");
  const domains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
  for (const [host, n] of domains) {
    const pct = ((n / (galleryTotal + productCount - missingImage)) * 100).toFixed(2);
    console.log(`  ${host.padEnd(45)} ${String(n).padStart(7)} реф.  (${pct}%)`);
  }
  console.log(`  Извън Convex: ${nonConvex.length}`);
  for (const n of nonConvex.slice(0, 20)) console.log(`     ${n.slug} -> ${n.url}`);

  console.log("\n-- РАЗМЕР --");
  console.log(`  Снимки в Convex storage : ${files.length} файла = ${fmt(storageBytes)}`);
  console.log(`  Данни на продуктите (док): ${productCount} записа ≈ ${fmt(docBytes)}`);
  console.log(`  ОБЩО проект (storage+док): ${fmt(storageBytes + docBytes)}`);
  console.log(`  Средно на файл           : ${fmt(storageBytes / Math.max(1, files.length))}`);
  console.log(`  Различно съдържание      : ${bySha.size} (дублирано съдържание в ${files.length - bySha.size} файла)`);

  console.log("\n-- ЦЯЛОСТ --");
  console.log(`  Реферирани уникални URL  : ${referenced.size}`);
  console.log(`  Сираци в storage         : ${orphans.length} (${fmt(orphanBytes)})`);
  console.log(`  Реф. Convex URL без файл : ${referencedMissing.length}`);
  for (const u of referencedMissing.slice(0, 10)) console.log(`     ${u}`);
  console.log(`  Продукти без главна сн.  : ${missingImage}`);
  console.log(`  Продукти с празна галерия: ${emptyGallery}`);

  console.log("\n-- РЕАЛНО ЗАРЕЖДАНЕ (HTTP) --");
  console.log(`  Тествани (извадка)       : ${results.length}`);
  console.log(`  Успешни                  : ${results.length - failed.length}`);
  console.log(`  Неуспешни                : ${failed.length}`);
  for (const f of failed.slice(0, 15)) console.log(`     [${f.status}] ${f.url} ${f.err || ""}`);
  if (extraTargets.length) {
    console.log(`  Слайдове + не-Convex URL : тествани ${extraResults.length}, неуспешни ${extraFailed.length}`);
    for (const f of extraFailed.slice(0, 15)) console.log(`     [${f.status}] ${f.url}`);
  }
  console.log("\n==================================================");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
