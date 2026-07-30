// Applies the real per-product descriptions scraped from the business's
// original site (see scripts/scrape-descriptions.js) to the Convex catalog.
//
// User-approved scope: ONLY products whose original description is real
// content (more than the product name repeated) are updated — the rest keep
// the current generic template, which reads better than a bare title line.
//
// Converts the scraped Drupal HTML to clean plain text with newlines
// (ProductTabs renders it with whitespace-pre-line). Writes a JSON backup of
// the current descriptions before any mutation.
//
// Usage:
//   node scripts/apply-descriptions.js           (dry run — prints plan)
//   node scripts/apply-descriptions.js --apply   (writes to Convex)

const { ConvexClient } = require("convex/browser");
const fs = require("fs");
const path = require("path");
const os = require("os");

const SCRAPE_FILE = path.join(os.homedir(), "keisove-scrape", "descriptions.ndjson");
const BACKUP_FILE = path.join(__dirname, "descriptions-backup.json");

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

// --- HTML -> clean plain text ----------------------------------------------
function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&hellip;/g, "…");
}

function htmlToPlain(html) {
  let t = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(h[1-6]|p|div|li|ul|ol|article)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "");
  t = decodeEntities(t);
  const lines = t
    .split("\n")
    .map((s) => s.replace(/\s+/g, " ").trim())
    // drop bare "ОПИСАНИЕ" heading — the section already sits in an
    // "Описание" tab on our product page
    .filter((s) => s.toUpperCase() !== "ОПИСАНИЕ");
  // collapse runs of blank lines to a single blank line
  const out = [];
  for (const line of lines) {
    if (line === "" && out[out.length - 1] === "") continue;
    out.push(line);
  }
  while (out[0] === "") out.shift();
  while (out[out.length - 1] === "") out.pop();
  return out.join("\n");
}

function normalize(s) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

// --- build plan --------------------------------------------------------------
const best = new Map();
for (const line of fs.readFileSync(SCRAPE_FILE, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const r = JSON.parse(line);
  const prev = best.get(r.sourceId);
  if (!prev || (r.ok && !prev.ok)) best.set(r.sourceId, r);
}

const plan = [];
for (const r of best.values()) {
  if (!r.ok || !r.descriptionHtml) continue;
  const titlePart = (r.title || "").split("|")[0].trim();
  let plain = htmlToPlain(r.descriptionHtml);
  // user-approved scope filter: skip descriptions that are basically just
  // the product name repeated (the old site has no real text for these)
  if (plain.length < titlePart.length + 40) continue;
  // drop a leading line that merely repeats the product name — our page
  // already shows the title right above
  const lines = plain.split("\n");
  if (lines.length > 1) {
    const first = normalize(lines[0]);
    const title = normalize(titlePart);
    if (first && title && (first === title || title.includes(first) || first.includes(title))) {
      lines.shift();
      while (lines[0] === "") lines.shift();
      plain = lines.join("\n");
    }
  }
  if (plain.length < 60) continue;
  plan.push({ sourceId: r.sourceId, description: plain });
}

console.log(`Connecting to Convex at: ${convexUrl}`);
console.log(APPLY ? "Mode: APPLY (will write changes)" : "Mode: DRY RUN (no writes)");
console.log(`Plan: update ${plan.length} products (real descriptions only).`);

console.log("\nSample (first 2):");
for (const p of plan.slice(0, 2)) {
  console.log(`\n--- ${p.sourceId} ---\n${p.description.slice(0, 400)}\n`);
}

async function run() {
  // backup current descriptions of affected products before touching anything
  console.log("\nFetching current descriptions for backup...");
  let cursor = null;
  let isDone = false;
  const current = new Map();
  while (!isDone) {
    const result = await client.query("products:list", {
      paginationOpts: { numItems: 1000, cursor },
    });
    for (const p of result.page) current.set(p.sourceId, p.description);
    cursor = result.continueCursor;
    isDone = result.isDone;
  }
  const backup = plan.map((p) => ({
    sourceId: p.sourceId,
    oldDescription: current.get(p.sourceId) ?? null,
    newDescription: p.description,
  }));
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
  console.log(`Backup written: ${BACKUP_FILE} (${backup.length} entries)`);

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to write these changes to Convex.");
    return;
  }

  console.log("\nApplying...");
  let applied = 0;
  let missing = 0;
  for (const p of plan) {
    const okRes = await client.mutation("products:adminSetDescription", {
      sourceId: p.sourceId,
      description: p.description,
    });
    if (okRes) applied++;
    else missing++;
    if ((applied + missing) % 500 === 0) {
      console.log(`  ${applied + missing}/${plan.length}...`);
    }
  }
  console.log(`\nDone. Applied ${applied}/${plan.length} (${missing} sourceIds not found in DB).`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
