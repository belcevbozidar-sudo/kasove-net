const { ConvexClient } = require("convex/browser");
const fs = require("fs");

// Read environment variables manually to avoid dependency on dotenv
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

function normalize(model) {
  return model.replace(/\b[45]g\b/gi, "").replace(/\s+/g, " ").trim();
}

async function run() {
  console.log(`Connecting to Convex at: ${convexUrl}`);
  console.log(APPLY ? "Mode: APPLY (will write changes)" : "Mode: DRY RUN (no writes)");

  let cursor = null;
  let isDone = false;
  let totalProcessed = 0;
  const changes = [];

  while (!isDone) {
    const result = await client.query("products:list", {
      paginationOpts: { numItems: 1000, cursor },
    });

    for (const p of result.page) {
      totalProcessed++;
      if (!p.model) continue;
      const trimmed = p.model.trim();
      const normalized = normalize(trimmed);
      if (normalized && normalized !== trimmed) {
        changes.push({
          sourceId: p.sourceId,
          slug: p.slug,
          brand: p.brand,
          name: p.name,
          before: trimmed,
          after: normalized,
        });
      }
    }

    cursor = result.continueCursor;
    isDone = result.isDone;
  }

  console.log(`\nScanned ${totalProcessed} products.`);
  console.log(`Found ${changes.length} products with a "4G"/"5G" model suffix to normalize.\n`);

  const byBrand = {};
  for (const c of changes) {
    byBrand[c.brand] = (byBrand[c.brand] || 0) + 1;
  }
  console.log("By brand:", byBrand);

  console.log("\nSample changes (first 20):");
  for (const c of changes.slice(0, 20)) {
    console.log(`  [${c.brand}] "${c.before}" -> "${c.after}"  (${c.name})`);
  }

  fs.writeFileSync(
    "scripts/model-5g-normalize-backup.json",
    JSON.stringify(changes, null, 2)
  );
  console.log(`\nFull before/after list (${changes.length} entries) written to scripts/model-5g-normalize-backup.json`);

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to write these changes to Convex.");
    return;
  }

  console.log("\nApplying changes...");
  let applied = 0;
  for (const c of changes) {
    const ok = await client.mutation("products:adminSetModel", {
      sourceId: c.sourceId,
      model: c.after,
    });
    if (ok) applied++;
    if (applied % 200 === 0) console.log(`  ${applied}/${changes.length} applied...`);
  }
  console.log(`\nDone. Applied ${applied}/${changes.length} updates.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
