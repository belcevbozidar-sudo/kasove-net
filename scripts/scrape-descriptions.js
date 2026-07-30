// Scrapes the real per-product descriptions from the business's original site
// (keisove.net, Drupal 7). Product pages are addressable directly as
// /node/<sourceId> — our sourceId field is the old site's node ID / article
// number, so no URL discovery is needed.
//
// Collect-only: writes NDJSON to ~/keisove-scrape/descriptions.ndjson and
// NEVER touches the Convex database. Resumable: already-fetched sourceIds
// (including permanent 404s) are skipped on restart; transient failures are
// retried next run.
//
// Owner-authorized crawl of the business's own legacy site. Single-threaded,
// ~1.2s base delay, adaptive: slows down on slow responses / errors.
//
// Usage:  node scripts/scrape-descriptions.js
// Runs until the full list is done; safe to Ctrl-C and re-run any time.

const fs = require("fs");
const path = require("path");
const os = require("os");

const OUT_DIR = path.join(os.homedir(), "keisove-scrape");
const OUT_FILE = path.join(OUT_DIR, "descriptions.ndjson");
const SOURCE_LIST = path.join(__dirname, "price-currency-fix-backup.json");

const BASE_DELAY_MS = 1200;
const MAX_DELAY_MS = 15000;
const REQUEST_TIMEOUT_MS = 30000;
const USER_AGENT =
  "KeisoveNet-CatalogMigration/1.0 (owner-authorized migration of own legacy catalog)";

fs.mkdirSync(OUT_DIR, { recursive: true });

// --- load work list -------------------------------------------------------
const allProducts = JSON.parse(fs.readFileSync(SOURCE_LIST, "utf8"));
const allIds = [...new Set(allProducts.map((p) => p.sourceId))].filter(Boolean);

// --- load already-done set (resume) ---------------------------------------
const done = new Set();
if (fs.existsSync(OUT_FILE)) {
  for (const line of fs.readFileSync(OUT_FILE, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line);
      // ok records and hard 404s are final; transient errors get retried
      if (rec.ok || rec.status === 404) done.add(rec.sourceId);
    } catch {}
  }
}
const todo = allIds.filter((id) => !done.has(id));
console.log(
  `[${new Date().toISOString()}] total=${allIds.length} done=${done.size} todo=${todo.length}`
);

// --- helpers ---------------------------------------------------------------
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extract(html) {
  const title = (html.match(/<title>(.*?)<\/title>/s) || [])[1]?.trim() ?? null;
  const articleOnPage =
    (html.match(/Артикулен номер<\/p>.*?<strong[^>]*>(\d+)<\/strong>/s) || [])[1] ?? null;
  const descriptionHtml =
    (html.match(/<div class="product-desc">.*?<article>(.*?)<\/article>/s) || [])[1]?.trim() ??
    null;
  const availability =
    (html.match(/Наличност:<\/p>.*?<strong[^>]*>(.*?)<\/strong>/s) || [])[1]?.trim() ?? null;
  return { title, articleOnPage, descriptionHtml, availability };
}

async function fetchPage(sourceId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const started = Date.now();
    const res = await fetch(`https://keisove.net/node/${sourceId}`, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "bg" },
    });
    const elapsed = Date.now() - started;
    const body = res.status === 200 ? await res.text() : "";
    return { status: res.status, body, elapsed };
  } finally {
    clearTimeout(timer);
  }
}

// --- main loop --------------------------------------------------------------
async function run() {
  let delay = BASE_DELAY_MS;
  let doneCount = 0;
  let errorStreak = 0;
  const out = fs.createWriteStream(OUT_FILE, { flags: "a" });

  for (const sourceId of todo) {
    let rec;
    try {
      const { status, body, elapsed } = await fetchPage(sourceId);
      if (status === 200) {
        const parsed = extract(body);
        const verified = parsed.articleOnPage === String(sourceId);
        rec = {
          sourceId,
          ok: true,
          status,
          verified,
          hasDescription: Boolean(parsed.descriptionHtml),
          title: parsed.title,
          availability: parsed.availability,
          descriptionHtml: parsed.descriptionHtml,
          fetchedAt: new Date().toISOString(),
        };
        errorStreak = 0;
      } else {
        rec = { sourceId, ok: false, status, fetchedAt: new Date().toISOString() };
        if (status !== 404) errorStreak++;
      }
      // adaptive pacing: back off when the server slows down, drift back to base
      if (elapsed > 3000) delay = Math.min(MAX_DELAY_MS, delay * 1.5);
      else delay = Math.max(BASE_DELAY_MS, Math.round(delay * 0.9));
    } catch (err) {
      rec = {
        sourceId,
        ok: false,
        status: 0,
        error: String(err?.message || err).slice(0, 200),
        fetchedAt: new Date().toISOString(),
      };
      errorStreak++;
    }

    out.write(JSON.stringify(rec) + "\n");
    doneCount++;

    if (doneCount % 50 === 0) {
      console.log(
        `[${new Date().toISOString()}] ${doneCount}/${todo.length} this run ` +
          `(delay=${delay}ms, errorStreak=${errorStreak})`
      );
    }

    // heavy backoff when the server is repeatedly failing (rate limit / outage)
    if (errorStreak >= 5) {
      const pause = Math.min(10 * 60 * 1000, 30000 * 2 ** Math.min(errorStreak - 5, 5));
      console.log(
        `[${new Date().toISOString()}] ${errorStreak} consecutive errors — pausing ${Math.round(pause / 1000)}s`
      );
      await sleep(pause);
    }

    await sleep(delay);
  }

  out.end();
  console.log(`[${new Date().toISOString()}] RUN COMPLETE: processed ${doneCount} this run.`);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
