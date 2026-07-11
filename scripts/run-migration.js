const { ConvexClient } = require("convex/browser");
const fs = require("fs");

// Read environment variables manually
let convexUrl;
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      if (key === "NEXT_PUBLIC_CONVEX_URL") {
        convexUrl = val;
      }
    }
  }
} catch (e) {
  console.log("Could not read .env.local, using process.env");
}

if (!convexUrl) {
  convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
}

if (!convexUrl) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL is not defined");
  process.exit(1);
}

const client = new ConvexClient(convexUrl);

async function main() {
  console.log(`Starting image migration for Convex deployment: ${convexUrl}`);
  
  let cursor = null;
  let isDone = false;
  let totalProcessed = 0;
  let totalMigrated = 0;
  let totalErrors = 0;

  while (!isDone) {
    try {
      console.log(`Migrating batch starting with cursor: ${cursor}...`);
      const result = await client.action("products:migrateImagesBatch", {
        cursor: cursor || undefined,
        limit: 25
      });

      totalProcessed += result.processedCount;
      totalMigrated += result.migratedCount;
      totalErrors += result.errorCount;
      cursor = result.continueCursor;
      isDone = result.isDone;

      console.log(`Progress: Processed ${totalProcessed} products | Migrated ${totalMigrated} new images | Errors: ${totalErrors}`);
    } catch (error) {
      console.error("Batch migration failed with error:", error);
      console.log("Retrying batch in 5 seconds...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log("\n================================================");
  console.log("IMAGE MIGRATION COMPLETED SUCCESSFULLY!");
  console.log(`Total Products Evaluated: ${totalProcessed}`);
  console.log(`Total Images Migrated to Convex Storage: ${totalMigrated}`);
  console.log(`Total Migration Errors: ${totalErrors}`);
  console.log("================================================");
  
  process.exit(0);
}

main();
