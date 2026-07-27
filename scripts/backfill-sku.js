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
const START = 100001;

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

  const withoutSku = all.filter((p) => !p.sku);
  console.log(`Scanned ${all.length} products; ${withoutSku.length} have no SKU yet.`);

  if (withoutSku.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  // Stable order: oldest-created first, so article numbers roughly track
  // when a product was originally added.
  withoutSku.sort((a, b) => a._creationTime - b._creationTime);

  const plan = withoutSku.map((p, i) => ({
    sourceId: p.sourceId,
    name: p.name,
    sku: `KP-${START + i}`,
  }));

  console.log(`\nWill assign SKUs ${plan[0].sku} .. ${plan[plan.length - 1].sku}`);
  console.log("\nSample (first 10):");
  for (const p of plan.slice(0, 10)) {
    console.log(`  ${p.sku}  ${p.name}`);
  }

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to write these changes to Convex.");
    return;
  }

  console.log("\nApplying...");
  let applied = 0;
  for (const p of plan) {
    await client.mutation("products:adminSetSku", { sourceId: p.sourceId, sku: p.sku });
    applied++;
    if (applied % 500 === 0) console.log(`  ${applied}/${plan.length} applied...`);
  }
  console.log(`\nDone. Applied ${applied}/${plan.length} updates.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
