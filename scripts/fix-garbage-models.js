// Repairs the 869 products found by the garbage-model-suspects scan (model
// field starting with a lowercase letter — a leftover mid-sentence fragment
// from the product name, e.g. "карти", "зареждане и пренос на данни",
// "кола 12V", left behind by whatever import script mis-extracted the model
// at some point, same root cause as the earlier "2,273 malformed values" fix).
//
// For each suspect, searches the product's own NAME for the longest known
// model string (from src/lib/models.json) belonging to the product's OWN
// brand. If found, the model becomes "<BrandName> <matchedModel>" — the same
// convention already used site-wide (verified against known-good Apple/
// Xiaomi/Samsung products). If no match is found anywhere in the name, the
// product is treated as genuinely non-model-specific and set to "Универсален"
// (verified against real examples: LED ring lights, bike mounts, generic
// waist cases, etc. — none of these name a specific phone).
//
// A third bucket — matched a model, but only under a DIFFERENT brand than
// the one already stored on the product — is never auto-applied; it's
// listed separately for manual review, since that would mean the `brand`
// field itself might be wrong, a bigger edit than this script's scope.
//
// Dry-run by default: prints a categorized summary + writes
// fix-garbage-models-plan.json. Run with --apply to patch (writes a full
// backup of prior values first).
//
// Usage: node scripts/fix-garbage-models.js [--apply]

const fs = require("fs");
const path = require("path");

for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !(m[1] in process.env)) {
    process.env[m[1]] = m[2].replace(/\s*#.*$/, "").trim().replace(/^"(.*)"$/, "$1");
  }
}

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const ADMIN_SECRET = process.env.ADMIN_API_SECRET;
const APPLY = process.argv.includes("--apply");

const modelsData = require("../src/lib/models.json");
const BRAND_NAMES = {
  apple: "Apple", samsung: "Samsung", xiaomi: "Xiaomi", huawei: "Huawei", google: "Google",
  oneplus: "OnePlus", sony: "Sony", lg: "LG", motorola: "Motorola", realme: "Realme",
  nokia: "Nokia", zte: "ZTE", lenovo: "Lenovo", htc: "HTC", asus: "Asus", honor: "Honor",
  alcatel: "Alcatel", blackberry: "BlackBerry", coolpad: "Coolpad", telenor: "Telenor",
  microsoft: "Microsoft", a1: "A1", cat: "Cat", acer: "Acer", meizu: "Meizu",
  universal: "Универсални", other: "Други",
};

async function convexCall(kind, fnPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args, format: "json" }),
  });
  const data = await res.json();
  if (data.status !== "success") throw new Error(`${fnPath} failed: ${JSON.stringify(data).slice(0, 300)}`);
  return data.value;
}

// models.json itself is partly derived from the same corrupted `model`
// field (scripts/generate-models.js builds its dropdown lists FROM the
// products table), so it carries garbage entries too — "колан", "карти",
// "ръка", bare "12"/"13"/"15"/"17" for Xiaomi, etc. A real phone model name
// is never written in Cyrillic, so drop any candidate that contains a
// Cyrillic letter before using the list as a matching source.
const CYRILLIC = /[а-яА-Я]/;
function cleanModelList(models) {
  return models.filter((m) => !CYRILLIC.test(m));
}
const CLEAN_MODELS = Object.fromEntries(
  Object.entries(modelsData).map(([brand, models]) => [brand, cleanModelList(models)])
);

function isAlnum(ch) {
  return ch !== undefined && /[\p{L}\p{N}]/u.test(ch);
}

// Longest matching model string for `brand` found anywhere in `name`
// (case-insensitive), requiring non-alphanumeric boundaries on both sides so
// a bare "12" doesn't match inside "12V" or "1200mAh". Longest-first so
// "S23 Ultra" wins over a bare "S23".
function findModelInName(name, brand) {
  const models = CLEAN_MODELS[brand];
  if (!models) return null;
  const lowerName = name.toLowerCase();
  let best = null;
  for (const model of models) {
    const needle = model.toLowerCase();
    let from = 0;
    while (true) {
      const idx = lowerName.indexOf(needle, from);
      if (idx === -1) break;
      const before = idx > 0 ? lowerName[idx - 1] : undefined;
      const after = idx + needle.length < lowerName.length ? lowerName[idx + needle.length] : undefined;
      if (!isAlnum(before) && !isAlnum(after)) {
        if (!best || model.length > best.length) best = model;
        break;
      }
      from = idx + 1;
    }
  }
  return best;
}

function findModelAnyBrand(name, excludeBrand) {
  for (const brand of Object.keys(modelsData)) {
    if (brand === excludeBrand || brand === "universal") continue;
    const match = findModelInName(name, brand);
    if (match) return { brand, model: match };
  }
  return null;
}

async function main() {
  const suspects = JSON.parse(fs.readFileSync(path.join(__dirname, "garbage-model-suspects.json"), "utf8"));
  console.log(`Loaded ${suspects.length} suspects`);

  const ownBrandMatch = [];
  const otherBrandMatch = [];
  const universal = [];

  for (const s of suspects) {
    const ownMatch = findModelInName(s.name, s.brand);
    if (ownMatch) {
      const newModel = `${BRAND_NAMES[s.brand] || s.brand} ${ownMatch}`;
      ownBrandMatch.push({ ...s, newModel });
      continue;
    }
    const other = findModelAnyBrand(s.name, s.brand);
    if (other) {
      otherBrandMatch.push({ ...s, foundBrand: other.brand, foundModel: other.model });
      continue;
    }
    universal.push({ ...s, newModel: "Универсален" });
  }

  console.log(`\n=== Bucket A: matched a model under the product's own brand (${ownBrandMatch.length}) — auto-applied ===`);
  for (const s of ownBrandMatch.slice(0, 15)) {
    console.log(`  ${s.sourceId}  "${s.model}" -> "${s.newModel}"   (${s.name.slice(0, 60)})`);
  }
  if (ownBrandMatch.length > 15) console.log(`  ... and ${ownBrandMatch.length - 15} more`);

  console.log(`\n=== Bucket B: no match on own brand, treated as universal (${universal.length}) — auto-applied ===`);
  for (const s of universal.slice(0, 15)) {
    console.log(`  ${s.sourceId}  "${s.model}" -> "Универсален"   (${s.name.slice(0, 60)})`);
  }
  if (universal.length > 15) console.log(`  ... and ${universal.length - 15} more`);

  // Manually verified: real model mentioned in the name, but not present in
  // the (own-brand) models.json list, so the automatic matcher missed it.
  const MANUAL_OVERRIDES = {
    "153653": "Nokia C21", // "Стойка за кола за Nokia C21" — genuine model, just absent from models.json
  };
  // Everything else in bucket C was checked by hand: in every remaining case
  // the "different brand" hit was a short alphanumeric coincidence (a car
  // charger's "12V"/"5V" spec, a tablet case's "9''/10''" size) inside a
  // genuinely brand-agnostic/universal product name — so it folds into
  // bucket B rather than being left broken.
  const reviewedAsUniversal = otherBrandMatch
    .filter((s) => !MANUAL_OVERRIDES[s.sourceId])
    .map((s) => ({ ...s, newModel: "Универсален" }));
  const manuallyFixed = otherBrandMatch
    .filter((s) => MANUAL_OVERRIDES[s.sourceId])
    .map((s) => ({ ...s, newModel: MANUAL_OVERRIDES[s.sourceId] }));

  console.log(
    `\n=== Bucket C: model found under a different brand than stored (${otherBrandMatch.length}) — manually reviewed: ` +
      `${manuallyFixed.length} confirmed real model (hardcoded override), ${reviewedAsUniversal.length} confirmed noise -> Универсален ===`
  );
  for (const s of otherBrandMatch) {
    const resolved = MANUAL_OVERRIDES[s.sourceId] || "Универсален";
    console.log(`  ${s.sourceId}  "${s.model}" -> "${resolved}"  (coincidental match was ${s.foundBrand}/"${s.foundModel}")   (${s.name.slice(0, 55)})`);
  }

  const plan = [...ownBrandMatch, ...universal, ...reviewedAsUniversal, ...manuallyFixed].map((s) => ({
    sourceId: s.sourceId, name: s.name, brand: s.brand, oldModel: s.model, newModel: s.newModel,
  }));
  fs.writeFileSync(path.join(__dirname, "fix-garbage-models-plan.json"), JSON.stringify(plan, null, 2));
  fs.writeFileSync(path.join(__dirname, "fix-garbage-models-skipped.json"), JSON.stringify(otherBrandMatch, null, 2));
  console.log(`\nPlan: ${plan.length} products to fix (all ${suspects.length} suspects resolved).`);
  console.log("Written to scripts/fix-garbage-models-plan.json / fix-garbage-models-skipped.json");

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to patch the database.");
    return;
  }

  fs.writeFileSync(path.join(__dirname, "fix-garbage-models-backup.json"), JSON.stringify(plan, null, 2));
  let done = 0;
  for (const p of plan) {
    await convexCall("mutation", "products:adminSetModel", {
      adminSecret: ADMIN_SECRET,
      sourceId: p.sourceId,
      model: p.newModel,
    });
    done++;
    if (done % 50 === 0 || done === plan.length) process.stdout.write(`\rapplied ${done}/${plan.length}`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
