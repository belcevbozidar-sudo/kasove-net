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

// The fixed BGN peg — same constant already used by src/lib/data.ts's
// formatPrice() to derive the BGN display from the (supposedly-EUR) price.
const BGN_PER_EUR = 1.95583;

function round2(n) {
  return Math.round(n * 100) / 100;
}

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

  const plan = all.map((p) => ({
    sourceId: p.sourceId,
    name: p.name,
    oldPriceField: p.price,
    oldOldPriceField: p.oldPrice,
    newPrice: round2(p.price / BGN_PER_EUR),
    newOldPrice: p.oldPrice !== undefined ? round2(p.oldPrice / BGN_PER_EUR) : undefined,
  }));

  console.log("\nSample (first 10):");
  for (const p of plan.slice(0, 10)) {
    console.log(
      `  ${p.name.slice(0, 50)}...  price ${p.oldPriceField} -> ${p.newPrice}` +
        (p.oldOldPriceField !== undefined ? `  oldPrice ${p.oldOldPriceField} -> ${p.newOldPrice}` : "")
    );
  }

  fs.writeFileSync("scripts/price-currency-fix-backup.json", JSON.stringify(plan, null, 2));
  console.log(`\nFull before/after list (${plan.length} entries) written to scripts/price-currency-fix-backup.json`);

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to write these changes to Convex.");
    return;
  }

  console.log("\nApplying...");
  let applied = 0;
  for (const p of plan) {
    const args = { sourceId: p.sourceId, price: p.newPrice };
    if (p.newOldPrice !== undefined) args.oldPrice = p.newOldPrice;
    await client.mutation("products:adminFixPriceUnits", args);
    applied++;
    if (applied % 1000 === 0) console.log(`  ${applied}/${plan.length} applied...`);
  }
  console.log(`\nDone. Applied ${applied}/${plan.length} updates.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
