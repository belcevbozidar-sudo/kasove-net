const { ConvexClient } = require("convex/browser");

const convexUrl = process.env.CONVEX_URL || "https://dutiful-salmon-385.eu-west-1.convex.cloud";
const client = new ConvexClient(convexUrl);
const fmtMB = (b) => (b / 1048576).toFixed(1) + " MB";

async function main() {
  // Referenced URLs
  const referenced = new Set();
  let cursor = null, done = false;
  while (!done) {
    const res = await client.query("products:listForMigration", { cursor, limit: 500 });
    for (const p of res.page) {
      if (p.image) referenced.add(p.image);
      for (const u of p.gallery || []) if (u) referenced.add(u);
    }
    cursor = res.continueCursor;
    done = res.isDone;
  }
  const slides = await client.query("slides:list", {});
  for (const s of slides) if (s.image) referenced.add(s.image);

  // Storage files
  const files = [];
  cursor = null; done = false;
  while (!done) {
    const res = await client.query("products:getStorageAuditPage", { cursor, limit: 500 });
    files.push(...res.items);
    cursor = res.continueCursor;
    done = res.isDone;
  }

  const byType = new Map();
  let zeroSize = 0, tiny = 0, noUrl = 0, orphans = 0, refBytes = 0, refCount = 0;
  let minSize = Infinity, maxSize = 0;
  const urlToFile = new Map();
  for (const f of files) {
    byType.set(f.contentType || "(none)", (byType.get(f.contentType || "(none)") || 0) + 1);
    if (f.size === 0) zeroSize++;
    else if (f.size < 1024) tiny++;
    if (!f.url) noUrl++;
    else urlToFile.set(f.url, f);
    if (f.url && referenced.has(f.url)) { refCount++; refBytes += f.size; if (f.size < minSize) minSize = f.size; if (f.size > maxSize) maxSize = f.size; }
    else orphans++;
  }

  // Every referenced convex URL must have a file
  const brokenRefs = [];
  for (const u of referenced) {
    if (u.includes("convex.cloud") && !urlToFile.has(u)) brokenRefs.push(u);
  }
  // Non-convex references (should be only local /images/ slides)
  const nonConvexRefs = [...referenced].filter((u) => !u.includes("convex.cloud"));

  console.log("=== DEEP STORAGE AUDIT ===");
  console.log(`Storage files: ${files.length} (${fmtMB(files.reduce((a, f) => a + f.size, 0))})`);
  console.log(`Referenced URLs: ${referenced.size} (convex: ${referenced.size - nonConvexRefs.length}, non-convex: ${nonConvexRefs.length})`);
  console.log(`Files matched to references: ${refCount} (${fmtMB(refBytes)})`);
  console.log(`Referenced convex URLs WITHOUT a file (BROKEN): ${brokenRefs.length}`);
  console.log(`Orphan files (not referenced): ${orphans}`);
  console.log(`Zero-size files: ${zeroSize} | files <1KB: ${tiny} | files without URL: ${noUrl}`);
  console.log(`Referenced file sizes: min=${(minSize/1024).toFixed(1)}KB max=${(maxSize/1048576).toFixed(2)}MB avg=${(refBytes/refCount/1024).toFixed(0)}KB`);
  console.log("Content types:");
  for (const [t, c] of [...byType.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${t}: ${c}`);
  console.log("Non-convex referenced URLs:");
  for (const u of nonConvexRefs.slice(0, 10)) console.log(`  ${u}`);
  for (const u of brokenRefs.slice(0, 10)) console.log(`  BROKEN: ${u}`);

  // Emit sample of referenced URLs for external HTTP checking (every Nth)
  const refConvex = [...referenced].filter((u) => u.includes("convex.cloud"));
  const step = Math.floor(refConvex.length / 40) || 1;
  const sample = [];
  for (let i = 0; i < refConvex.length; i += step) sample.push(refConvex[i]);
  require("fs").writeFileSync("/tmp/image-sample-urls.txt", sample.slice(0, 45).join("\n"));
  console.log(`\nWrote ${Math.min(sample.length, 45)} sample URLs to /tmp/image-sample-urls.txt`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
