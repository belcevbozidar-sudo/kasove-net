const { ConvexClient } = require("convex/browser");

const convexUrl = process.env.CONVEX_URL || "https://dutiful-salmon-385.eu-west-1.convex.cloud";
const client = new ConvexClient(convexUrl);

async function main() {
  console.log(`Recomputing facet counts on ${convexUrl}...`);
  const counts = new Map();
  const bump = (k) => counts.set(k, (counts.get(k) || 0) + 1);

  let cursor = null, done = false, total = 0;
  while (!done) {
    const res = await client.query("products:listForMigration", { cursor, limit: 500 });
    for (const p of res.page) {
      total++;
      bump("all|all");
      bump(`${p.category}|all`);
      bump(`all|${p.brand}`);
      bump(`${p.category}|${p.brand}`);
    }
    cursor = res.continueCursor;
    done = res.isDone;
  }
  console.log(`Products: ${total}; distinct facet keys: ${counts.size}`);

  // Existing rows not present in recomputed set must go to 0 (stale combos)
  const existing = await client.query("products:listFacetCounts", {});
  for (const row of existing) {
    if (!counts.has(row.key)) counts.set(row.key, 0);
  }

  const entries = [...counts.entries()].map(([key, count]) => ({ key, count }));
  const BATCH = 200;
  let written = 0;
  for (let i = 0; i < entries.length; i += BATCH) {
    written += await client.mutation("products:setFacetCounts", { entries: entries.slice(i, i + BATCH) });
  }
  console.log(`Updated ${written} facet rows. all|all = ${counts.get("all|all")}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
