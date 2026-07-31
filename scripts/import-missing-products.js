// Imports the products that exist on the business's original site
// (keisove.net) but are missing from our Convex catalog — i.e. items added
// to the old site after the original bulk import ran.
//
// Input: scripts/model-coverage-report.json (produced by
// scripts/audit-model-coverage.js), whose `missingIds` are article numbers
// confirmed present on the old site and absent from ours.
//
// Prices are read straight from the old site's EUR figure ("12.50 € /
// 24.45лв."), so this import is not exposed to the BGN-stored-as-EUR bug
// that affected the original migration.
//
// Images are downloaded and re-uploaded into Convex storage, matching how
// every existing product stores its images.
//
// Usage:
//   node scripts/import-missing-products.js           (dry run — prints plan)
//   node scripts/import-missing-products.js --apply   (writes to Convex)

const { ConvexClient } = require("convex/browser");
const fs = require("fs");
const path = require("path");

const REPORT_FILE = path.join(__dirname, "model-coverage-report.json");
const PLAN_FILE = path.join(__dirname, "import-missing-plan.json");
const REQUEST_DELAY_MS = 1200;
const USER_AGENT = "KeisoveNet-CatalogImport/1.0 (owner-authorized import of own legacy catalog)";

const envContent = fs.readFileSync(".env.local", "utf8");
let convexUrl;
let adminSecret;
for (const line of envContent.split("\n")) {
  const parts = line.split("=");
  const key = parts[0].trim();
  const value = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  if (key === "NEXT_PUBLIC_CONVEX_URL") convexUrl = value;
  if (key === "ADMIN_API_SECRET") adminSecret = value;
}
if (!convexUrl) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL is not set in .env.local");
  process.exit(1);
}
// Admin/maintenance Convex functions are gated by a shared secret (see
// convex/adminAuth.ts) so they can't be called from a browser.
if (!adminSecret) {
  console.error("Error: ADMIN_API_SECRET is not set in .env.local");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const client = new ConvexClient(convexUrl);

const STANDARD_FEATURES = [
  "Прецизни изрези за всички портове и бутони",
  "Защита от надраскване, прах и леки удари",
  "Ергономичен дизайн, лесен за поставяне",
  "Приятен на допир материал с добро сцепление",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Our catalog stores models brand-prefixed ("Samsung Galaxy A17",
// "Honor 600 Pro"); models.json keeps them bare.
function dbCanonicalModel(brand, model) {
  const cap = brand.charAt(0).toUpperCase() + brand.slice(1);
  if (brand === "samsung") return `Samsung Galaxy ${model}`;
  return `${cap} ${model}`;
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…");
}

function htmlToPlain(html) {
  let t = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(h[1-6]|p|div|li|ul|ol|article)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "");
  t = decodeEntities(t);
  const lines = t
    .split("\n")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.toUpperCase() !== "ОПИСАНИЕ");
  const out = [];
  for (const line of lines) {
    if (line === "" && out[out.length - 1] === "") continue;
    out.push(line);
  }
  while (out[0] === "") out.shift();
  while (out[out.length - 1] === "") out.pop();
  return out.join("\n");
}

// --- category inference ------------------------------------------------------
const CATEGORY_RULES = [
  [/стойка за кола|магнитна стойка|car (mount|holder)/i, "car-stands"],
  [/слушалк|headphone|earbud|\btws\b|handsfree/i, "bluetooth-headphones"],
  [/външна батерия|power ?bank/i, "powerbanks"],
  [/зарядно|адаптер|charger/i, "chargers-220v"],
  [/usb[^\n]*кабел|кабел[^\n]*usb|data cable|type-c to/i, "usb-cables"],
  [/протектор|tempered glass|screen protector|стъклен|glass|защита за камера/i, "protectors"],
  [/кожен|flip|тефтер|book|wallet/i, "leather-cases"],
  [/силиконов|tpu|silicone|jelly/i, "silicone-cases"],
  [/твърд гръб|твърд калъф|acrylic|armor|hard case|shockproof|удароустойчив/i, "hard-cases"],
  [/калъф|кейс|гръб|case/i, "hard-cases"],
];

function tokenize(name) {
  return new Set(
    name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !/^\d+$/.test(w))
  );
}

// Prefer copying the category of the closest-named existing product from the
// same brand (handles the shop's own quirks better than keywords alone);
// fall back to keyword rules when nothing is similar enough.
function inferCategory(name, brand, catalogByBrand) {
  const target = tokenize(name);
  let best = null;
  let bestScore = 0;
  for (const p of catalogByBrand.get(brand) || []) {
    const other = p.tokens;
    let inter = 0;
    for (const w of target) if (other.has(w)) inter++;
    const union = target.size + other.size - inter;
    const score = union > 0 ? inter / union : 0;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  if (best && bestScore >= 0.55) return { category: best.category, via: `sibling ${bestScore.toFixed(2)}` };
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(name)) return { category: cat, via: "keyword" };
  }
  return { category: "other", via: "fallback" };
}

// --- old-site scraping -------------------------------------------------------
function parseEurPrice(raw) {
  if (!raw) return undefined;
  const m = raw.match(/([\d.,]+)\s*€/);
  if (!m) return undefined;
  const n = parseFloat(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

async function fetchProduct(sourceId) {
  const res = await fetch(`https://keisove.net/node/${sourceId}`, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "bg" },
    redirect: "follow",
  });
  if (res.status !== 200) return { ok: false, status: res.status };
  const html = await res.text();

  const name = (html.match(/<div class="section-head product-title">([\s\S]*?)<\/div>/) || [])[1];
  const priceRaw = (html.match(/<strong class="product-price">([\s\S]*?)<\/strong>/) || [])[1];
  const oldPriceRaw = (html.match(/<strong class="product-old-price[^"]*">\s*<span>([\s\S]*?)<\/span>/) || [])[1];
  const availability = (html.match(/Наличност:<\/p>[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/) || [])[1];
  const articleOnPage = (html.match(/Артикулен номер<\/p>[\s\S]*?<strong[^>]*>(\d+)<\/strong>/) || [])[1];
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const descriptionHtml = (html.match(/<div class="product-desc">[\s\S]*?<article>([\s\S]*?)<\/article>/) || [])[1];
  const images = [
    ...new Set(
      [...html.matchAll(/<a href="(https:\/\/keisove\.net\/sites\/default\/files\/[^"]+)"[^>]*class="colorbox"/g)].map(
        (m) => m[1]
      )
    ),
  ];

  return {
    ok: true,
    name: name ? decodeEntities(name).trim() : null,
    price: parseEurPrice(priceRaw),
    oldPrice: parseEurPrice(oldPriceRaw),
    inStock: availability ? /в наличност/i.test(decodeEntities(availability)) : true,
    articleOnPage,
    canonical,
    descriptionHtml: descriptionHtml ? descriptionHtml.trim() : null,
    images,
  };
}

async function uploadImage(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  let contentType = "image/jpeg";
  const lower = url.toLowerCase();
  if (lower.includes(".png")) contentType = "image/png";
  else if (lower.includes(".webp")) contentType = "image/webp";

  const uploadUrl = await client.mutation("products:generateUploadUrl", { adminSecret });
  const up = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": contentType }, body: buffer });
  if (!up.ok) throw new Error(`upload HTTP ${up.status}`);
  const { storageId } = await up.json();
  return await client.query("products:getUrlFromStorageId", { storageId });
}

async function run() {
  console.log(`Connecting to Convex at: ${convexUrl}`);
  console.log(APPLY ? "Mode: APPLY (will write changes)" : "Mode: DRY RUN (no writes)");

  // Work list: unique missing article numbers from the coverage audit.
  const report = JSON.parse(fs.readFileSync(REPORT_FILE, "utf8"));
  const wanted = new Map();
  for (const entry of Object.values(report)) {
    if (!entry.resolved || !entry.missingCount) continue;
    for (const id of entry.missingIds) {
      if (!wanted.has(id)) wanted.set(id, { sourceId: id, brand: entry.brand, model: entry.model });
    }
  }
  console.log(`Missing article numbers to import: ${wanted.size}`);

  // Existing catalog: used for sibling category matching, SKU continuation
  // and skipping anything already present.
  console.log("Loading current catalog...");
  let cursor = null;
  let isDone = false;
  const existing = new Set();
  const catalogByBrand = new Map();
  let maxSku = 100000;
  while (!isDone) {
    const r = await client.query("products:list", { paginationOpts: { numItems: 1000, cursor } });
    for (const p of r.page) {
      existing.add(p.sourceId);
      if (!catalogByBrand.has(p.brand)) catalogByBrand.set(p.brand, []);
      catalogByBrand.get(p.brand).push({ category: p.category, tokens: tokenize(p.name) });
      if (p.sku) {
        const n = parseInt(p.sku.replace(/^KP-/, ""), 10);
        if (Number.isFinite(n) && n > maxSku) maxSku = n;
      }
    }
    cursor = r.continueCursor;
    isDone = r.isDone;
  }
  console.log(`Catalog: ${existing.size} products, highest SKU KP-${maxSku}`);

  const todo = [...wanted.values()].filter((w) => !existing.has(w.sourceId));
  console.log(`Still missing (after re-check): ${todo.length}\n`);

  const plan = [];
  const failures = [];
  for (const item of todo) {
    process.stdout.write(`  ${item.sourceId} (${item.brand} ${item.model})... `);
    try {
      const p = await fetchProduct(item.sourceId);
      await sleep(REQUEST_DELAY_MS);
      if (!p.ok) {
        console.log(`SKIP http ${p.status}`);
        failures.push({ ...item, reason: `http ${p.status}` });
        continue;
      }
      if (!p.name || p.price === undefined || !p.canonical) {
        console.log("SKIP unparseable");
        failures.push({ ...item, reason: "unparseable" });
        continue;
      }
      if (p.articleOnPage && p.articleOnPage !== item.sourceId) {
        console.log(`SKIP article mismatch (page says ${p.articleOnPage})`);
        failures.push({ ...item, reason: `article mismatch ${p.articleOnPage}` });
        continue;
      }

      const { category, via } = inferCategory(p.name, item.brand, catalogByBrand);
      const slug = p.canonical.replace(/^\//, "").replace(/\//g, "-");
      const model = dbCanonicalModel(item.brand, item.model);

      let description = p.descriptionHtml ? htmlToPlain(p.descriptionHtml) : "";
      // Match the rest of the catalog: keep the generic template when the old
      // site's "description" is just the product name echoed back.
      if (description.length < p.name.length + 40) {
        description = `${p.name}. Този висококачествен продукт осигурява надеждна защита и стилен дизайн за вашето устройство. Изработен от прецизни материали, съвместими с модела ${model}.`;
      } else {
        const lines = description.split("\n");
        if (lines.length > 1 && tokenize(lines[0]).size > 0) {
          const a = tokenize(lines[0]);
          const b = tokenize(p.name);
          let inter = 0;
          for (const w of a) if (b.has(w)) inter++;
          if (inter / Math.max(1, a.size) > 0.8) {
            lines.shift();
            while (lines[0] === "") lines.shift();
            description = lines.join("\n");
          }
        }
      }

      plan.push({
        sourceId: item.sourceId,
        slug,
        name: p.name,
        brand: item.brand,
        model,
        category,
        categoryVia: via,
        price: p.price,
        oldPrice: p.oldPrice,
        hasOldPrice: p.oldPrice !== undefined && p.oldPrice > p.price,
        inStock: p.inStock,
        description,
        sourceImages: p.images,
      });
      console.log(`OK  ${p.price}€${p.oldPrice ? ` (was ${p.oldPrice}€)` : ""}  ${category} [${via}]  ${p.images.length} img`);
    } catch (err) {
      console.log(`FAIL ${err.message}`);
      failures.push({ ...item, reason: err.message });
    }
  }

  console.log(`\nParsed ${plan.length} products, ${failures.length} failures.`);
  const byCat = {};
  for (const p of plan) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log("By category:", JSON.stringify(byCat));
  fs.writeFileSync(PLAN_FILE, JSON.stringify({ plan, failures }, null, 2));
  console.log(`Plan written: ${PLAN_FILE}`);

  if (!APPLY) {
    console.log("\nSample (first 3):");
    for (const p of plan.slice(0, 3)) {
      console.log(`\n--- ${p.sourceId} ---`);
      console.log(`  name: ${p.name}`);
      console.log(`  model: ${p.model} | category: ${p.category} | price: ${p.price}€ | old: ${p.oldPrice ?? "-"}€`);
      console.log(`  slug: ${decodeURIComponent(p.slug).slice(0, 100)}`);
      console.log(`  desc: ${p.description.slice(0, 120).replace(/\n/g, " ")}...`);
    }
    console.log("\nDry run only — re-run with --apply to upload images and insert into Convex.");
    return;
  }

  console.log("\nUploading images and inserting...");
  let sku = maxSku;
  const toInsert = [];
  for (const p of plan) {
    const gallery = [];
    for (const src of p.sourceImages) {
      try {
        gallery.push(await uploadImage(src));
        await sleep(REQUEST_DELAY_MS);
      } catch (err) {
        console.log(`  image failed for ${p.sourceId}: ${err.message}`);
      }
    }
    if (gallery.length === 0) {
      console.log(`  ${p.sourceId}: no images uploaded — skipping product`);
      failures.push({ sourceId: p.sourceId, reason: "no images" });
      continue;
    }
    sku++;
    toInsert.push({
      sourceId: p.sourceId,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      model: p.model,
      category: p.category,
      price: p.price,
      oldPrice: p.oldPrice,
      hasOldPrice: p.hasOldPrice,
      image: gallery[0],
      gallery,
      rating: 0,
      reviewCount: 0,
      description: p.description,
      features: STANDARD_FEATURES,
      inStock: p.inStock,
      sku: `KP-${sku}`,
    });
    console.log(`  ${p.sourceId}: ${gallery.length} images -> KP-${sku}${p.inStock ? "" : " (OUT OF STOCK)"}`);
  }

  console.log(`\nInserting ${toInsert.length} products...`);
  const res = await client.mutation("products:insertProducts", { adminSecret, products: toInsert });
  console.log("insertProducts:", JSON.stringify(res));
  console.log("\nDone. Run scripts/rebuild-facet-counts.js next so shop counters include these.");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
