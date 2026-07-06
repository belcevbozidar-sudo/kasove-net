const { ConvexClient } = require("convex/browser");
const fs = require("fs");
const path = require("path");

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

const client = new ConvexClient(convexUrl);

// Categories where the 'model' field represents an actual phone/tablet model
const PHONE_CASE_CATEGORIES = new Set([
  "leather-cases",
  "silicone-cases",
  "hard-cases",
  "protectors",
  "tablet-cases"
]);

async function run() {
  console.log("Connecting to Convex at:", convexUrl);
  
  const brandModels = {};
  let cursor = null;
  let isDone = false;
  let totalProcessed = 0;

  console.log("Fetching products in chunks...");

  while (!isDone) {
    // Call products:list with category = undefined, brand = undefined, to get all products
    const result = await client.query("products:list", {
      paginationOpts: {
        numItems: 1000,
        cursor: cursor
      }
    });

    for (const p of result.page) {
      totalProcessed++;
      const brand = p.brand;
      const model = p.model;
      const category = p.category;

      // Only collect models from phone case/protector categories, 
      // excluding generic/universal models
      if (
        brand &&
        model &&
        PHONE_CASE_CATEGORIES.has(category) &&
        model !== "Универсален" &&
        model !== "Универсална" &&
        model.trim() !== ""
      ) {
        if (!brandModels[brand]) {
          brandModels[brand] = new Set();
        }
        brandModels[brand].add(model.trim());
      }
    }

    console.log(`Processed ${totalProcessed} products...`);
    cursor = result.continueCursor;
    isDone = result.isDone;
  }

  // Convert sets to sorted arrays
  const output = {};
  for (const brand in brandModels) {
    output[brand] = Array.from(brandModels[brand]).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" })
    );
  }

  // Write to src/lib/models.json
  const outputPath = path.join(__dirname, "../src/lib/models.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`Successfully generated models.json at ${outputPath}!`);
  
  // Print some statistics
  for (const brand in output) {
    console.log(`- ${brand}: ${output[brand].length} unique models`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
