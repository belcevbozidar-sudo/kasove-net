// Reverts the category reassignment done by fix-orphan-categories.js: puts
// every one of the 1477 products back on its original category value, using
// the backup file that migration wrote. This is the first half of restoring
// the 11 original categories (handsfree, other, batteries, chargers-12v,
// powerbanks, tablet-cases, smart-devices, universal-cases,
// apple-accessories, gsm-accessories, memory-cards) as real, first-class
// site categories instead of merging their products into the 9 broader
// ones — the second half is adding them to `categories` in src/lib/data.ts
// (done separately) so they're reachable through the menu/shop filters
// again, this time correctly wired up.
//
// Dry-run by default; --apply to actually patch.
// Usage: node scripts/revert-orphan-categories.js [--apply]

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
  const backup = JSON.parse(fs.readFileSync(path.join(__dirname, "fix-orphan-categories-backup.json"), "utf8"));
  console.log(`Loaded ${backup.length} products to revert`);

  const byCategory = {};
  for (const p of backup) (byCategory[p.oldCategory] ||= []).push(p);
  for (const cat of Object.keys(byCategory).sort((a, b) => byCategory[b].length - byCategory[a].length)) {
    console.log(`  ${cat}: ${byCategory[cat].length}`);
  }

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to patch the database.");
    return;
  }

  let done = 0;
  for (const p of backup) {
    await convexCall("mutation", "products:adminSetCategory", {
      adminSecret: ADMIN_SECRET,
      sourceId: p.sourceId,
      category: p.oldCategory,
    });
    done++;
    if (done % 50 === 0 || done === backup.length) process.stdout.write(`\rreverted ${done}/${backup.length}`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
