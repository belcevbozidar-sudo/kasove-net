const { ConvexClient } = require("convex/browser");

const convexUrl = "https://enchanted-spaniel-207.eu-west-1.convex.cloud";
const client = new ConvexClient(convexUrl);

async function run() {
  console.log("Analyzing product image URLs in production...");
  
  let totalProducts = 0;
  
  let keisoveMainImages = 0;
  let convexMainImages = 0;
  let otherMainImages = 0;
  
  let totalKeisoveGallery = 0;
  let totalConvexGallery = 0;
  
  let productCursor = null;
  let productsDone = false;
  
  while (!productsDone) {
    const res = await client.query("products:getProductImageDomains", { cursor: productCursor, limit: 1000 });
    totalProducts += res.items.length;
    
    for (const item of res.items) {
      if (item.isKeisoveMain) keisoveMainImages++;
      else if (item.isConvexMain) convexMainImages++;
      else otherMainImages++;
      
      totalKeisoveGallery += item.keisoveGalleryCount;
      totalConvexGallery += item.convexGalleryCount;
    }
    
    productCursor = res.continueCursor;
    productsDone = res.isDone;
  }
  
  console.log("\n--- PRODUCTION PRODUCT IMAGE ANALYSIS ---");
  console.log(`Total Products: ${totalProducts}`);
  console.log("Main Images:");
  console.log(`  - Points to keisove.net: ${keisoveMainImages}`);
  console.log(`  - Points to Convex Storage: ${convexMainImages}`);
  console.log(`  - Other / Empty: ${otherMainImages}`);
  console.log("Gallery Images:");
  console.log(`  - Points to keisove.net: ${totalKeisoveGallery}`);
  console.log(`  - Points to Convex Storage: ${totalConvexGallery}`);
  console.log("-----------------------------------------");
  
  process.exit(0);
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
