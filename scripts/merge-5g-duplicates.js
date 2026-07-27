const { ConvexClient } = require("convex/browser");
const fs = require("fs");

try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  }
} catch (e) {
  console.log("Could not read .env.local manually, using process.env");
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL is not defined in .env.local");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const client = new ConvexClient(convexUrl);
const has5gRe = /\b[45]g\b/i;

function stripSuffix(name) {
  return name.replace(/\b[45]g\b/gi, "").replace(/\s+/g, " ").replace(/\s+-/g, " -").trim();
}

async function run() {
  console.log(`Connecting to Convex at: ${convexUrl}`);
  console.log(APPLY ? "Mode: APPLY (will write changes)" : "Mode: DRY RUN (no writes)");

  const groups = JSON.parse(fs.readFileSync("scripts/duplicate-products-audit.json", "utf8"));
  const target = groups.filter((g) => g.items.some((i) => has5gRe.test(i.name)));
  console.log(`Loaded ${target.length} 5G/4G-driven duplicate groups from the audit.`);

  // Fetch all products once, to find bundleWith references that point at a
  // sourceId we're about to delete, so we can redirect them.
  let cursor = null;
  let isDone = false;
  const allProducts = [];
  while (!isDone) {
    const result = await client.query("products:list", {
      paginationOpts: { numItems: 1000, cursor },
    });
    allProducts.push(...result.page);
    cursor = result.continueCursor;
    isDone = result.isDone;
  }
  const bundleWithIndex = new Map(); // targetSourceId -> [referencing sourceIds]
  for (const p of allProducts) {
    if (p.bundleWith) {
      if (!bundleWithIndex.has(p.bundleWith)) bundleWithIndex.set(p.bundleWith, []);
      bundleWithIndex.get(p.bundleWith).push(p.sourceId);
    }
  }

  const plan = [];
  for (const g of target) {
    const items = [...g.items].sort((a, b) => Number(a.sourceId) - Number(b.sourceId));
    const canonical = items[0];
    const toDelete = items.slice(1);
    const canonicalNameAfter = stripSuffix(canonical.name);
    const referrersToFix = [];
    for (const del of toDelete) {
      const refs = bundleWithIndex.get(del.sourceId) || [];
      for (const r of refs) referrersToFix.push({ referrerSourceId: r, oldTarget: del.sourceId, newTarget: canonical.sourceId });
    }
    plan.push({
      groupKey: g.key,
      canonicalSourceId: canonical.sourceId,
      canonicalNameBefore: canonical.name,
      canonicalNameAfter,
      deleted: toDelete.map((d) => ({ sourceId: d.sourceId, name: d.name, price: d.price, image: d.image })),
      referrersToFix,
    });
  }

  const totalDeleted = plan.reduce((s, p) => s + p.deleted.length, 0);
  const totalRenames = plan.filter((p) => p.canonicalNameAfter !== p.canonicalNameBefore).length;
  const totalReferrerFixes = plan.reduce((s, p) => s + p.referrersToFix.length, 0);
  console.log(`\nPlan: delete ${totalDeleted} duplicate products, rename ${totalRenames} surviving canonical records (strip leftover 5G/4G), fix ${totalReferrerFixes} bundleWith references.\n`);

  fs.writeFileSync("scripts/merge-5g-duplicates-backup.json", JSON.stringify(plan, null, 2));
  console.log("Full plan + backup written to scripts/merge-5g-duplicates-backup.json");

  console.log("\nSample (first 10):");
  for (const p of plan.slice(0, 10)) {
    console.log(`\nkeep sourceId=${p.canonicalSourceId} "${p.canonicalNameBefore}"${p.canonicalNameAfter !== p.canonicalNameBefore ? ` -> renamed to "${p.canonicalNameAfter}"` : ""}`);
    for (const d of p.deleted) console.log(`  delete sourceId=${d.sourceId} "${d.name}"`);
    for (const r of p.referrersToFix) console.log(`  fix bundleWith on sourceId=${r.referrerSourceId}: ${r.oldTarget} -> ${r.newTarget}`);
  }

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to write these changes to Convex.");
    return;
  }

  console.log("\nApplying...");
  let renamed = 0, fixedRefs = 0, deleted = 0;
  for (const p of plan) {
    if (p.canonicalNameAfter !== p.canonicalNameBefore) {
      await client.mutation("products:adminMigratePatchNameBundle", {
        sourceId: p.canonicalSourceId,
        name: p.canonicalNameAfter,
      });
      renamed++;
    }
    for (const r of p.referrersToFix) {
      await client.mutation("products:adminMigratePatchNameBundle", {
        sourceId: r.referrerSourceId,
        bundleWith: r.newTarget,
      });
      fixedRefs++;
    }
    for (const d of p.deleted) {
      await client.mutation("products:adminDeleteProduct", { id: d.sourceId });
      deleted++;
    }
  }
  console.log(`\nDone. Renamed ${renamed}, fixed ${fixedRefs} bundleWith refs, deleted ${deleted} duplicate products.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
