const { ConvexClient } = require("convex/browser");

const convexUrl = process.env.CONVEX_URL || "https://dutiful-salmon-385.eu-west-1.convex.cloud";
const client = new ConvexClient(convexUrl);

const fmtMB = (b) => (b / 1048576).toFixed(1) + " MB";

async function main() {
  // Pass 1: fresh referenced-URL set (recomputed at delete time, not from a stale audit)
  console.log("Collecting referenced image URLs...");
  const referenced = new Set();
  let cursor = null, done = false;
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
  console.log(`Referenced URLs: ${referenced.size}`);

  // Pass 2: list all files, find sha256 set of referenced files, collect orphan candidates
  console.log("Listing storage files...");
  const files = [];
  cursor = null; done = false;
  while (!done) {
    const res = await client.query("products:getStorageAuditPage", { cursor, limit: 500 });
    files.push(...res.items);
    cursor = res.continueCursor;
    done = res.isDone;
    if (files.length % 50000 < 500) console.log(`  ${files.length} listed...`);
  }
  const shaOfReferenced = new Set();
  for (const f of files) {
    if (f.url && referenced.has(f.url)) shaOfReferenced.add(f.sha256);
  }

  // SAFETY: delete only files that are (a) not referenced AND (b) content-identical to a referenced file
  const toDelete = [];
  let skippedUnique = 0, bytes = 0;
  for (const f of files) {
    const isReferenced = f.url && referenced.has(f.url);
    if (!isReferenced) {
      if (shaOfReferenced.has(f.sha256)) {
        toDelete.push(f.id);
        bytes += f.size;
      } else {
        skippedUnique++;
      }
    }
  }
  console.log(`Files total: ${files.length} | referenced: ${files.length - toDelete.length - skippedUnique} | to delete: ${toDelete.length} (${fmtMB(bytes)}) | skipped (unique content, NOT deleted): ${skippedUnique}`);

  // Pass 3: delete in batches with limited concurrency
  const BATCH = 100, CONCURRENCY = 5;
  let deleted = 0;
  const batches = [];
  for (let i = 0; i < toDelete.length; i += BATCH) batches.push(toDelete.slice(i, i + BATCH));
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const group = batches.slice(i, i + CONCURRENCY);
    const counts = await Promise.all(
      group.map((ids) => client.mutation("products:deleteStorageFiles", { ids }))
    );
    deleted += counts.reduce((a, c) => a + c, 0);
    if (deleted % 5000 < BATCH * CONCURRENCY) console.log(`  deleted ${deleted}/${toDelete.length}...`);
  }

  console.log(`\n=== CLEANUP DONE ===`);
  console.log(`Deleted: ${deleted} files (${fmtMB(bytes)})`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
