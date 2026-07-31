// Finds products that share the same slug (which crashes /product/<slug> when
// getBySlug used .unique(), and even with .first() hides all but one of them)
// and renames the newer duplicates by appending -2, -3, ... to their slug.
//
// Dry-run by default: prints a report and writes fix-duplicate-slugs-plan.json.
// Run with --apply to actually patch the database (a backup of the old slugs
// is written to fix-duplicate-slugs-backup.json first).
//
// Usage: node scripts/fix-duplicate-slugs.js [--apply]

const fs = require("fs");
const path = require("path");

// Minimal .env.local loader (dotenv is not a dependency of this project).
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !(m[1] in process.env)) {
    process.env[m[1]] = m[2].replace(/\s*#.*$/, "").trim().replace(/^"(.*)"$/, "$1");
  }
}

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const ADMIN_SECRET = process.env.ADMIN_API_SECRET;
if (!CONVEX_URL || !ADMIN_SECRET) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL or ADMIN_API_SECRET in .env.local");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

async function convexCall(kind, fnPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args, format: "json" }),
  });
  const data = await res.json();
  if (data.status !== "success") {
    throw new Error(`${fnPath} failed: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data.value;
}

async function main() {
  // 1. Page through every product, collecting slugs.
  const yourSlugs = new Map(); // slug -> [{id, name, sourceId, creationTime}]
  let cursor = null;
  let total = 0;
  for (;;) {
    const page = await convexCall("query", "products:listForMigration", {
      adminSecret: ADMIN_SECRET,
      cursor,
      limit: 500,
    });
    for (const p of page.page) {
      total++;
      const entry = { id: p._id, name: p.name, sourceId: p.sourceId ?? null, creationTime: p._creationTime };
      const list = yourSlugs.get(p.slug);
      if (list) list.push(entry);
      else yourSlugs.set(p.slug, [entry]);
    }
    process.stdout.write(`\rscanned ${total} products...`);
    if (page.isDone) break;
    cursor = page.continueCursor;
  }
  console.log();

  // 2. Report duplicates.
  const dupGroups = [...yourSlugs.entries()].filter(([, list]) => list.length > 1);
  console.log(`Total products: ${total}`);
  console.log(`Unique slugs:   ${yourSlugs.size}`);
  console.log(`Duplicated slugs: ${dupGroups.length} (${dupGroups.reduce((n, [, l]) => n + l.length, 0)} products)`);

  const plan = [];
  for (const [slug, list] of dupGroups) {
    // Keep the oldest document on the original slug (matches what .first()
    // serves today), rename the rest.
    list.sort((a, b) => a.creationTime - b.creationTime);
    for (let i = 1; i < list.length; i++) {
      let suffix = i + 1;
      let newSlug = `${slug}-${suffix}`;
      while (yourSlugs.has(newSlug)) {
        suffix++;
        newSlug = `${slug}-${suffix}`;
      }
      yourSlugs.set(newSlug, [list[i]]);
      plan.push({ id: list[i].id, name: list[i].name, sourceId: list[i].sourceId, oldSlug: slug, newSlug });
    }
  }

  fs.writeFileSync(path.join(__dirname, "fix-duplicate-slugs-plan.json"), JSON.stringify(plan, null, 2));
  console.log(`Plan written to scripts/fix-duplicate-slugs-plan.json (${plan.length} renames)`);
  for (const p of plan.slice(0, 10)) {
    console.log(`  ${p.oldSlug}  ->  ${p.newSlug}  (${p.name.slice(0, 60)})`);
  }
  if (plan.length > 10) console.log(`  ... and ${plan.length - 10} more`);

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to patch the database.");
    return;
  }

  // 3. Apply.
  fs.writeFileSync(path.join(__dirname, "fix-duplicate-slugs-backup.json"), JSON.stringify(plan, null, 2));
  let done = 0;
  for (const p of plan) {
    await convexCall("mutation", "products:adminSetSlug", {
      adminSecret: ADMIN_SECRET,
      id: p.id,
      slug: p.newSlug,
    });
    done++;
    process.stdout.write(`\rapplied ${done}/${plan.length}`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
