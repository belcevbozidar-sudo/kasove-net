// Repairs the `model` field across the catalog. The original import stored
// whatever segment the old site's URL happened to have — part names ("задна
// камера пълна защита"), "Универсален", size suffixes ("Apple iPhone 17 Pro
// (6.3)"), or bare models without the brand prefix — so the shop's
// exact-match model filter misses those products entirely.
//
// Rules (toys category is never touched):
//   1. Strip "(6.3)"-style size suffixes from otherwise-clean models.
//   2. Prefix bare "iPhone ..." models with "Apple ".
//   3. For junk models (Универсален / part names / "кола"), derive the real
//      model from the product NAME via longest match against the canonical
//      per-brand model list (src/lib/models.json). Only patches when a
//      confident match is found — otherwise the product is left as-is.
//
// Backs up before applying. Dry run by default.
//
// Usage:
//   node scripts/fix-product-models.js           (dry run)
//   node scripts/fix-product-models.js --apply   (write via adminSetModel)

const { ConvexClient } = require("convex/browser");
const fs = require("fs");
const path = require("path");

const BACKUP_FILE = path.join(__dirname, "product-models-backup.json");
const modelsJson = require("../src/lib/models.json");

const envContent = fs.readFileSync(".env.local", "utf8");
let convexUrl;
for (const line of envContent.split("\n")) {
  const parts = line.split("=");
  if (parts.length >= 2 && parts[0].trim() === "NEXT_PUBLIC_CONVEX_URL") {
    convexUrl = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}
if (!convexUrl) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL is not defined in .env.local");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const client = new ConvexClient(convexUrl);

// --- canonical model handling ----------------------------------------------
// DB canonical form: "Apple iPhone 17 Pro", "Samsung Galaxy S26 Ultra",
// "Huawei P Smart 2021", ... models.json stores them per-brand WITHOUT the
// brand prefix (and for samsung without "Galaxy").
function dbCanonical(brand, model) {
  const cap = brand.charAt(0).toUpperCase() + brand.slice(1);
  if (brand === "samsung") return `Samsung Galaxy ${model}`;
  return `${cap} ${model}`;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Longest canonical model of `brand` mentioned in `name` (word-boundary
// match, case-insensitive). Returns the DB-canonical string or null.
const matcherCache = new Map();
function deriveModelFromName(brand, name) {
  const models = modelsJson[brand];
  if (!models || models.length === 0) return null;
  let matchers = matcherCache.get(brand);
  if (!matchers) {
    matchers = models
      .map((m) => ({
        model: m,
        // \b doesn't work after non-ASCII, so anchor on start/space and
        // require the match to end at a word edge
        re: new RegExp(`(^|[\\s/(])${escapeRegex(m)}(?=$|[\\s/,).])`, "i"),
      }))
      .sort((a, b) => b.model.length - a.model.length);
    matcherCache.set(brand, matchers);
  }
  for (const { model, re } of matchers) {
    if (re.test(name)) return dbCanonical(brand, model);
  }
  return null;
}

const SIZE_SUFFIX = /\s*\((\d+(?:\.\d+)?)['"”]?\)\s*$/;
const JUNK_MODEL =
  /^универсален$|камера|дисплей|стойка|батерия|зарядно|кабел|^кола$|количка|протектор|защита/i;

async function run() {
  console.log(`Connecting to Convex at: ${convexUrl}`);
  console.log(APPLY ? "Mode: APPLY (will write changes)" : "Mode: DRY RUN (no writes)");

  let cursor = null;
  let isDone = false;
  const all = [];
  while (!isDone) {
    const result = await client.query("products:list", {
      paginationOpts: { numItems: 1000, cursor },
    });
    all.push(...result.page);
    cursor = result.continueCursor;
    isDone = result.isDone;
  }
  console.log(`Scanned ${all.length} products.`);

  const plan = [];
  const buckets = { suffix: 0, prefix: 0, junkDerived: 0 };
  for (const p of all) {
    if (p.category === "toys") continue;
    let newModel = p.model;

    // rule 2: bare iPhone models get the Apple prefix
    if (/^iphone/i.test(newModel)) newModel = `Apple ${newModel}`;

    // rule 1: strip size suffixes like "(6.3)"
    const stripped = newModel.replace(SIZE_SUFFIX, "");

    if (stripped !== p.model && !JUNK_MODEL.test(p.model)) {
      const bucket = /^iphone/i.test(p.model) ? "prefix" : "suffix";
      plan.push({ sourceId: p.sourceId, name: p.name, oldModel: p.model, newModel: stripped, bucket });
      buckets[bucket]++;
      continue;
    }

    // rule 3: junk model -> derive from name
    if (JUNK_MODEL.test(p.model)) {
      const derived = deriveModelFromName(p.brand, p.name);
      if (derived && derived !== p.model) {
        plan.push({ sourceId: p.sourceId, name: p.name, oldModel: p.model, newModel: derived, bucket: "junkDerived" });
        buckets.junkDerived++;
      }
    }
  }

  console.log(`\nPlan: ${plan.length} model fixes`);
  console.log(`  size suffix stripped: ${buckets.suffix}`);
  console.log(`  Apple prefix added (incl. suffix strip): ${buckets.prefix}`);
  console.log(`  junk model derived from name: ${buckets.junkDerived}`);

  for (const bucket of ["suffix", "prefix", "junkDerived"]) {
    console.log(`\n--- samples: ${bucket} ---`);
    for (const e of plan.filter((x) => x.bucket === bucket).slice(0, 6)) {
      console.log(`  "${e.oldModel}" -> "${e.newModel}"   [${e.name.slice(0, 60)}]`);
    }
  }

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(plan, null, 2));
  console.log(`\nBackup/plan written: ${BACKUP_FILE}`);

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to write these changes to Convex.");
    return;
  }

  console.log("\nApplying...");
  let applied = 0;
  for (const e of plan) {
    await client.mutation("products:adminSetModel", { sourceId: e.sourceId, model: e.newModel });
    applied++;
    if (applied % 500 === 0) console.log(`  ${applied}/${plan.length}...`);
  }
  console.log(`\nDone. Applied ${applied}/${plan.length} model fixes.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
