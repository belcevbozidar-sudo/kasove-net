// Fixes 13 Samsung S23 Ultra products (found via scripts/audit-s23-ultra.js)
// whose `model` field carries leftover name fragments instead of the actual
// phone model ("Samsung Galaxy S23 Ultra Type-C", "телефон Cat с огледалце",
// "карти", "колан", "зареждане и пренос на данни", etc.) — a narrower,
// verified recurrence of the same class of bug fixed site-wide in an earlier
// pass ("repair junk/malformed product model values", 2,273 products).
//
// Two universal accessories (car stand, phone holder) get corrected to
// "Универсален" instead of a phone model, since they aren't S23-Ultra-
// specific at all despite being cross-listed on the old site's S23 Ultra
// category page.
//
// Dry-run by default; --apply to actually patch. Backs up prior values.
// Usage: node scripts/fix-s23-ultra-model-garbage.js [--apply]

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

const FIXES = [
  { sourceId: "153072", model: "Samsung Galaxy S23 Ultra" },
  { sourceId: "153169", model: "Samsung Galaxy S23 Ultra" },
  { sourceId: "153310", model: "Samsung Galaxy S23 Ultra" },
  { sourceId: "153311", model: "Samsung Galaxy S23 Ultra" },
  { sourceId: "153438", model: "Samsung Galaxy S23 Ultra" },
  { sourceId: "153457", model: "Универсален" }, // "Държач за телефон Cat с огледалце" — generic phone holder, not model-specific
  { sourceId: "153498", model: "Samsung Galaxy S23 Ultra" },
  { sourceId: "153591", model: "Универсален" }, // "Стойка за кола Forever MACH-100... MagSafe" — generic car stand
  { sourceId: "153779", model: "Samsung Galaxy S23 Ultra" },
  { sourceId: "153837", model: "Samsung Galaxy S23 Ultra" },
  { sourceId: "153979", model: "Samsung Galaxy S23 Ultra" },
  { sourceId: "153980", model: "Samsung Galaxy S23 Ultra" },
  { sourceId: "153981", model: "Samsung Galaxy S23 Ultra" },
];

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

async function main() {
  const backup = [];
  for (const fix of FIXES) {
    const doc = await convexCall("query", "products:getBySourceId", { sourceId: fix.sourceId });
    if (!doc) {
      console.log(`SKIP ${fix.sourceId}: not found in DB`);
      continue;
    }
    backup.push({ sourceId: fix.sourceId, name: doc.name, oldModel: doc.model, newModel: fix.model });
    console.log(`${fix.sourceId}  "${doc.model}"  ->  "${fix.model}"   (${doc.name.slice(0, 70)})`);
  }

  fs.writeFileSync(
    path.join(__dirname, "fix-s23-ultra-model-garbage-backup.json"),
    JSON.stringify(backup, null, 2)
  );

  if (!APPLY) {
    console.log(`\nDry run only (${backup.length} products would change). Re-run with --apply to patch.`);
    return;
  }

  for (const fix of FIXES) {
    const ok = await convexCall("mutation", "products:adminSetModel", {
      adminSecret: ADMIN_SECRET,
      sourceId: fix.sourceId,
      model: fix.model,
    });
    console.log(`${ok ? "OK" : "SKIP (not found)"}  ${fix.sourceId} -> "${fix.model}"`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
