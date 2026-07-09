const { ConvexClient } = require("convex/browser");
const fs = require("fs");

// Read environment variables manually
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
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

async function main() {
  console.log("Starting Convex products image cleaning...");
  let cursor = undefined;
  let isDone = false;
  let totalProcessed = 0;
  let totalUpdated = 0;

  while (!isDone) {
    try {
      const result = await client.mutation("products:cleanAllProductImages", {
        cursor: cursor || undefined,
        limit: 1000
      });

      totalProcessed += result.processedCount;
      totalUpdated += result.updatedCount;
      cursor = result.continueCursor;
      isDone = result.isDone;

      console.log(`Processed ${totalProcessed} products... (Updated ${totalUpdated} images)`);
    } catch (error) {
      console.error("Error running batch mutation:", error);
      console.log("Retrying in 2 seconds...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\nSuccessfully finished image cleaning!`);
  console.log(`Total processed products: ${totalProcessed}`);
  console.log(`Total updated images: ${totalUpdated}`);
  
  // Close connection
  process.exit(0);
}

main();
