const { ConvexClient } = require("convex/browser");

const convexUrl = process.env.CONVEX_URL || "https://dutiful-salmon-385.eu-west-1.convex.cloud";
const client = new ConvexClient(convexUrl);

async function downloadAndUploadLocal(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = await res.arrayBuffer();

  let contentType = "image/jpeg";
  if (url.toLowerCase().endsWith(".png")) contentType = "image/png";
  if (url.toLowerCase().endsWith(".webp")) contentType = "image/webp";
  if (url.toLowerCase().endsWith(".svg")) contentType = "image/svg+xml";

  const uploadUrl = await client.mutation("products:generateUploadUrl");
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: Buffer.from(buffer),
  });
  if (!uploadRes.ok) throw new Error(`Upload HTTP ${uploadRes.status}`);
  const { storageId } = await uploadRes.json();
  if (!storageId) throw new Error("No storageId returned");
  return await client.query("products:getUrlFromStorageId", { storageId });
}

async function main() {
  console.log(`Scanning ${convexUrl} for remaining keisove.net images...`);

  // Pass 1: collect only products that still reference keisove.net
  const targets = [];
  let cursor = null;
  let isDone = false;
  while (!isDone) {
    const result = await client.query("products:listForMigration", { cursor, limit: 500 });
    for (const p of result.page) {
      const mainOld = p.image && p.image.includes("keisove.net");
      const galOld = (p.gallery || []).some((u) => u && u.includes("keisove.net"));
      if (mainOld || galOld) {
        targets.push({ _id: p._id, name: p.name, image: p.image, gallery: p.gallery || [] });
      }
    }
    cursor = result.continueCursor;
    isDone = result.isDone;
  }
  console.log(`Found ${targets.length} products with remaining old-host images.`);

  // Pass 2: migrate with limited concurrency
  const failures = [];
  let migrated = 0;
  let imagesMoved = 0;
  const CONCURRENCY = 15;

  async function processProduct(p) {
    let needsUpdate = false;
    let newImage = p.image;
    const newGallery = [...p.gallery];

    if (p.image && p.image.includes("keisove.net")) {
      try {
        newImage = await downloadAndUploadLocal(p.image);
        needsUpdate = true;
        imagesMoved++;
      } catch (err) {
        failures.push({ product: p.name, url: p.image, error: err.message });
      }
    }
    for (let i = 0; i < p.gallery.length; i++) {
      const u = p.gallery[i];
      if (u && u.includes("keisove.net")) {
        try {
          newGallery[i] = await downloadAndUploadLocal(u);
          needsUpdate = true;
          imagesMoved++;
        } catch (err) {
          failures.push({ product: p.name, url: u, error: err.message });
        }
      }
    }
    if (needsUpdate) {
      await client.mutation("products:updateProductImageUrls", {
        id: p._id,
        image: newImage,
        gallery: newGallery,
      });
      migrated++;
    }
  }

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(processProduct));
    console.log(`Progress: ${Math.min(i + CONCURRENCY, targets.length)}/${targets.length} products | ${imagesMoved} images moved | ${failures.length} failures`);
  }

  console.log("\n=== DONE ===");
  console.log(`Products updated: ${migrated}`);
  console.log(`Images moved to Convex: ${imagesMoved}`);
  console.log(`Failures: ${failures.length}`);
  for (const f of failures.slice(0, 40)) {
    console.log(`  FAIL [${f.error}] ${f.product} -> ${f.url}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
