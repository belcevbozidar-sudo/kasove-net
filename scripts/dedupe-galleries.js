// Fixes the doubled product galleries left by the original catalog import
// (each product's gallery was written twice: [A,B,C,A,B,C]). Backs up all
// current galleries to scripts/galleries-backup.json, then runs the batched
// server-side dedupe mutation (products:adminDedupeGalleries). No storage
// files are touched — duplicates reference the same URLs.
//
// Usage:
//   node scripts/dedupe-galleries.js           (dry run — backup + stats only)
//   node scripts/dedupe-galleries.js --apply   (dedupe in Convex)

const { ConvexClient } = require("convex/browser");
const fs = require("fs");
const path = require("path");

const BACKUP_FILE = path.join(__dirname, "galleries-backup.json");

const envContent = fs.readFileSync(".env.local", "utf8");
let convexUrl;
for (const line of envContent.split("\n")) {
  const parts = line.split("=");
  if (parts.length >= 2 && parts[0].trim() === "NEXT_PUBLIC_CONVEX_URL") {
    convexUrl = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}
if (!convexUrl) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL is not defined in .env.local");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const client = new ConvexClient(convexUrl);

async function run() {
  console.log(`Connecting to Convex at: ${convexUrl}`);
  console.log(APPLY ? "Mode: APPLY (will write changes)" : "Mode: DRY RUN (no writes)");

  // backup all current galleries first
  console.log("Backing up current galleries...");
  let cursor = null;
  let isDone = false;
  const backup = [];
  let withDupes = 0;
  while (!isDone) {
    const result = await client.query("products:list", {
      paginationOpts: { numItems: 1000, cursor },
    });
    for (const p of result.page) {
      const gallery = p.gallery || [];
      backup.push({ sourceId: p.sourceId, gallery });
      if (new Set(gallery).size < gallery.length) withDupes++;
    }
    cursor = result.continueCursor;
    isDone = result.isDone;
  }
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup));
  console.log(`Backup written: ${BACKUP_FILE} (${backup.length} products, ${withDupes} with duplicated galleries)`);

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to dedupe in Convex.");
    return;
  }

  console.log("\nDeduping in batches...");
  let mCursor = null;
  let mDone = false;
  let totalPatched = 0;
  let totalScanned = 0;
  while (!mDone) {
    const res = await client.mutation("products:adminDedupeGalleries", {
      cursor: mCursor,
      limit: 500,
    });
    totalPatched += res.patched;
    totalScanned += res.scanned;
    mCursor = res.cursor;
    mDone = res.isDone;
    console.log(`  scanned ${totalScanned}, patched ${totalPatched}...`);
  }
  console.log(`\nDone. Deduped ${totalPatched} product galleries (${totalScanned} scanned).`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
