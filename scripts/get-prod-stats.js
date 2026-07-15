const { ConvexClient } = require("convex/browser");

const convexUrl = "https://enchanted-spaniel-207.eu-west-1.convex.cloud";
const client = new ConvexClient(convexUrl);

async function run() {
  console.log("Fetching production storage stats...");
  
  let fileCount = 0;
  let totalSizeB = 0;
  let fileCursor = null;
  let filesDone = false;
  
  while (!filesDone) {
    const res = await client.query("products:getStoragePage", { cursor: fileCursor, limit: 1000 });
    fileCount += res.items.length;
    for (const size of res.items) {
      totalSizeB += size;
    }
    fileCursor = res.continueCursor;
    filesDone = res.isDone;
  }
  
  let productCount = 0;
  let productMainImagesCount = 0;
  let productGalleryImagesCount = 0;
  let productCursor = null;
  let productsDone = false;
  
  while (!productsDone) {
    const res = await client.query("products:getProductsPage", { cursor: productCursor, limit: 1000 });
    productCount += res.items.length;
    for (const p of res.items) {
      if (p.hasImage) productMainImagesCount++;
      productGalleryImagesCount += p.galleryCount;
    }
    productCursor = res.continueCursor;
    productsDone = res.isDone;
  }
  
  console.log("\n--- PRODUCTION STORAGE STATS ---");
  console.log(`Total files in Storage: ${fileCount}`);
  console.log(`Total size: ${(totalSizeB / (1024 * 1024)).toFixed(2)} MB (${(totalSizeB / (1024 * 1024 * 1024)).toFixed(4)} GB)`);
  console.log(`Total products: ${productCount}`);
  console.log(`Products with main images: ${productMainImagesCount}`);
  console.log(`Total gallery images: ${productGalleryImagesCount}`);
  console.log("---------------------------------");
  
  process.exit(0);
}

run().catch(err => {
  console.error("Error fetching stats:", err);
  process.exit(1);
});
