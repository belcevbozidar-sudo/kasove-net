const { ConvexClient } = require("convex/browser");

const DEV = "https://dutiful-salmon-385.eu-west-1.convex.cloud";
const PROD = "https://enchanted-spaniel-207.eu-west-1.convex.cloud";

async function pullProducts(url, label) {
  const client = new ConvexClient(url);
  const map = new Map();
  let cursor = null, done = false;
  while (!done) {
    const res = await client.query("products:listForMigration", { cursor, limit: 500 });
    for (const p of res.page) {
      map.set(p.sourceId, {
        name: p.name,
        hasImage: !!p.image,
        galleryLen: (p.gallery || []).length,
      });
    }
    cursor = res.continueCursor;
    done = res.isDone;
  }
  console.log(`${label}: ${map.size} products pulled`);
  return map;
}

async function main() {
  const [dev, prod] = await Promise.all([pullProducts(DEV, "DEV"), pullProducts(PROD, "PROD")]);

  const missingInDev = [];
  const missingInProd = [];
  const imageMissingInDev = [];
  const galleryFewerInDev = [];
  let identical = 0;

  for (const [sid, pp] of prod) {
    const dp = dev.get(sid);
    if (!dp) { missingInDev.push({ sid, name: pp.name }); continue; }
    if (pp.hasImage && !dp.hasImage) imageMissingInDev.push({ sid, name: pp.name });
    if (dp.galleryLen < pp.galleryLen) galleryFewerInDev.push({ sid, name: pp.name, prod: pp.galleryLen, dev: dp.galleryLen });
    if (dp.hasImage === pp.hasImage && dp.galleryLen === pp.galleryLen) identical++;
  }
  for (const [sid, dp] of dev) {
    if (!prod.has(sid)) missingInProd.push({ sid, name: dp.name });
  }

  const totalGallery = (m) => [...m.values()].reduce((a, p) => a + p.galleryLen, 0);
  const totalMain = (m) => [...m.values()].filter((p) => p.hasImage).length;

  console.log("\n=== DEPLOYMENT COMPARISON (by sourceId) ===");
  console.log(`PROD: products=${prod.size}, main images=${totalMain(prod)}, gallery images=${totalGallery(prod)}`);
  console.log(`DEV : products=${dev.size}, main images=${totalMain(dev)}, gallery images=${totalGallery(dev)}`);
  console.log(`Products in PROD missing from DEV: ${missingInDev.length}`);
  console.log(`Products in DEV missing from PROD: ${missingInProd.length}`);
  console.log(`Products where PROD has main image but DEV doesn't: ${imageMissingInDev.length}`);
  console.log(`Products where DEV gallery has FEWER images than PROD: ${galleryFewerInDev.length}`);
  console.log(`Products with identical image/gallery counts: ${identical}/${prod.size}`);
  for (const x of missingInDev.slice(0, 20)) console.log(`  MISSING IN DEV: [${x.sid}] ${x.name}`);
  for (const x of imageMissingInDev.slice(0, 20)) console.log(`  NO MAIN IMG IN DEV: [${x.sid}] ${x.name}`);
  for (const x of galleryFewerInDev.slice(0, 20)) console.log(`  FEWER GALLERY IN DEV: [${x.sid}] ${x.name} prod=${x.prod} dev=${x.dev}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
