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
  // Ignored
}

if (!convexUrl) {
  convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
}

if (!convexUrl) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL is not defined");
  process.exit(1);
}

const client = new ConvexClient(convexUrl);

// Helper function to download locally and upload to Convex Storage
async function downloadAndUploadLocal(url) {
  try {
    // 1. Download image locally
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const buffer = await res.arrayBuffer();

    let contentType = "image/jpeg";
    if (url.toLowerCase().endsWith(".png")) contentType = "image/png";
    if (url.toLowerCase().endsWith(".webp")) contentType = "image/webp";
    if (url.toLowerCase().endsWith(".svg")) contentType = "image/svg+xml";

    // 2. Request Convex upload URL
    const uploadUrl = await client.mutation("products:generateUploadUrl");

    // 3. Upload file directly to Convex
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: Buffer.from(buffer)
    });
    if (!uploadRes.ok) throw new Error(`Upload HTTP error ${uploadRes.status}`);

    const { storageId } = await uploadRes.json();
    if (!storageId) throw new Error("No storageId returned");

    // 4. Get public URL from storageId
    const publicUrl = await client.query("products:getUrlFromStorageId", { storageId });
    return publicUrl;
  } catch (err) {
    console.error(`Failed to transfer image ${url}:`, err.message);
    return null;
  }
}

async function main() {
  console.log(`Starting LOCAL PARALLEL image migration for Convex deployment: ${convexUrl}`);
  
  let cursor = null;
  let isDone = false;
  let totalProcessed = 0;
  let totalMigrated = 0;
  let totalErrors = 0;

  while (!isDone) {
    try {
      console.log(`\nFetching batch starting with cursor: ${cursor}...`);
      const result = await client.query("products:listForMigration", {
        cursor: cursor || null,
        limit: 10
      });

      const promises = result.page.map(async (p) => {
        try {
          let needsUpdate = false;
          let newImage = p.image;
          const newGallery = [...p.gallery];
          
          // Migrate main image if it's on keisove.net
          if (p.image && p.image.includes("keisove.net")) {
            console.log(`Migrating main image for product: ${p.name}`);
            const publicUrl = await downloadAndUploadLocal(p.image);
            if (publicUrl) {
              newImage = publicUrl;
              needsUpdate = true;
            } else {
              totalErrors++;
            }
          }

          // Migrate gallery images in parallel
          const galleryPromises = p.gallery.map(async (imgUrl, i) => {
            if (imgUrl && imgUrl.includes("keisove.net")) {
              console.log(`Migrating gallery image ${i + 1}/${p.gallery.length} for: ${p.name}`);
              const publicUrl = await downloadAndUploadLocal(imgUrl);
              if (publicUrl) {
                newGallery[i] = publicUrl;
                needsUpdate = true;
              } else {
                totalErrors++;
              }
            }
          });
          await Promise.all(galleryPromises);

          if (needsUpdate) {
            await client.mutation("products:updateProductImageUrls", {
              id: p._id,
              image: newImage,
              gallery: newGallery
            });
            totalMigrated++;
            console.log(`  --> Successfully updated product: ${p.name}`);
          }
        } catch (itemErr) {
          console.error(`Error processing product ${p._id}:`, itemErr.message);
          totalErrors++;
        }
      });

      await Promise.all(promises);

      totalProcessed += result.page.length;
      cursor = result.continueCursor;
      isDone = result.isDone;

      console.log(`Progress: Processed ${totalProcessed} products total | Migrated ${totalMigrated} products so far | Errors: ${totalErrors}`);
    } catch (error) {
      console.error("Batch fetching failed:", error.message);
      console.log("Retrying batch in 5 seconds...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log("\n================================================");
  console.log("LOCAL PARALLEL IMAGE MIGRATION COMPLETE!");
  console.log(`Total Products Evaluated: ${totalProcessed}`);
  console.log(`Total Products Migrated: ${totalMigrated}`);
  console.log(`Total Errors/Skipped: ${totalErrors}`);
  console.log("================================================");
  
  process.exit(0);
}

main();
