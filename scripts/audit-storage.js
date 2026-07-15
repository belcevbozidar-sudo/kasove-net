const { ConvexClient } = require("convex/browser");

const convexUrl = process.env.CONVEX_URL || "https://dutiful-salmon-385.eu-west-1.convex.cloud";
const client = new ConvexClient(convexUrl);

const fmtMB = (b) => (b / 1048576).toFixed(1) + " MB";

async function main() {
  // 1. All storage files: url -> {sha256, size}
  console.log("Pass 1: listing all storage files...");
  const files = [];
  let cursor = null, done = false;
  while (!done) {
    const res = await client.query("products:getStorageAuditPage", { cursor, limit: 500 });
    files.push(...res.items);
    cursor = res.continueCursor;
    done = res.isDone;
    if (files.length % 25000 < 500) console.log(`  ${files.length} files listed...`);
  }
  console.log(`Total storage files: ${files.length}`);

  // 2. All referenced URLs from products + slides
  console.log("Pass 2: collecting referenced image URLs...");
  const referenced = new Set();
  cursor = null; done = false;
  while (!done) {
    const res = await client.query("products:listForMigration", { cursor, limit: 500 });
    for (const p of res.page) {
      if (p.image) referenced.add(p.image);
      for (const u of p.gallery || []) if (u) referenced.add(u);
    }
    cursor = res.continueCursor;
    done = res.isDone;
  }
  const slides = await client.query("slides:list", {});
  for (const s of slides) if (s.image) referenced.add(s.image);
  console.log(`Unique referenced URLs: ${referenced.size}`);

  // 3. Classify
  const shaOfReferenced = new Set();
  let refCount = 0, refBytes = 0;
  for (const f of files) {
    if (f.url && referenced.has(f.url)) {
      refCount++;
      refBytes += f.size;
      shaOfReferenced.add(f.sha256);
    }
  }

  let orphanDupCount = 0, orphanDupBytes = 0;   // orphan whose content exists in a referenced file
  let orphanUniqueCount = 0, orphanUniqueBytes = 0; // orphan with content NOT present in any referenced file
  const orphanShaGroups = new Map();
  for (const f of files) {
    if (!f.url || !referenced.has(f.url)) {
      if (shaOfReferenced.has(f.sha256)) {
        orphanDupCount++;
        orphanDupBytes += f.size;
      } else {
        orphanUniqueCount++;
        orphanUniqueBytes += f.size;
        orphanShaGroups.set(f.sha256, (orphanShaGroups.get(f.sha256) || 0) + 1);
      }
    }
  }

  // Among orphan-unique: how many are internal copies of each other?
  let uniqueContentCount = orphanShaGroups.size;

  console.log("\n=== STORAGE AUDIT ===");
  console.log(`Files in storage:           ${files.length} (${fmtMB(files.reduce((a, f) => a + f.size, 0))})`);
  console.log(`Referenced by site:         ${refCount} (${fmtMB(refBytes)})`);
  console.log(`Orphans, duplicate content: ${orphanDupCount} (${fmtMB(orphanDupBytes)}) — identical sha256 to a referenced file`);
  console.log(`Orphans, unique content:    ${orphanUniqueCount} (${fmtMB(orphanUniqueBytes)}) across ${uniqueContentCount} distinct contents`);
  const missing = [...referenced].filter((u) => u.includes("convex.cloud")).length - refCount;
  console.log(`Referenced convex URLs with NO storage file: ${missing < 0 ? 0 : missing}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
