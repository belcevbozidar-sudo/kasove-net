// Compares, per model (all 1089 brand/model pairs in src/lib/models.json),
// the exact set of product article numbers (sourceId) listed on the
// business's original site (keisove.net) against what exists in our Convex
// catalog — to find genuinely missing products, not just model-field
// tagging differences.
//
// How it works:
//   - Every product card on a keisove.net category page carries a hidden
//     marker in its HTML: `product-teaser-image-slider-<sourceId>`. This is
//     the same sourceId we already store per product (confirmed exact match
//     in this session), so we can diff by ID instead of fuzzy name/model
//     matching — eliminates false positives from cross-tagged universal
//     accessories, combined multi-model products, etc.
//   - Category pages live at /аксесоари/<slug>. The slug isn't uniform
//     across brands (Apple: "iphone-17-pro-max", i.e. just the model,
//     because the model string already contains "iPhone"; Honor:
//     "honor-600-pro", i.e. brand+model). We try a short list of candidate
//     slugs per model and use whichever first returns a page with at least
//     one product marker.
//   - Pagination uses the query string `?page=0,N` (0-indexed, comma
//     syntax confirmed from the site's own pager links) — walked until a
//     page returns no new IDs.
//
// Read-only: never touches Convex. Writes progress to
// scripts/model-coverage-report.json (resumable — already-processed models
// are skipped on restart) and a running log to
// ~/keisove-scrape/model-audit.log.
//
// Usage: node scripts/audit-model-coverage.js

const fs = require("fs");
const path = require("path");
const os = require("os");
const { ConvexClient } = require("convex/browser");

const modelsData = require("../src/lib/models.json");

const REPORT_FILE = path.join(__dirname, "model-coverage-report.json");
const BASE_DELAY_MS = 1200;
const MAX_DELAY_MS = 15000;
const REQUEST_TIMEOUT_MS = 20000;
const MODEL_TIMEOUT_MS = 90000; // hard ceiling in case a fetch's own abort somehow never fires
const USER_AGENT = "KeisoveNet-CatalogAudit/1.0 (owner-authorized coverage check of own legacy catalog)";

const envContent = fs.readFileSync(".env.local", "utf8");
let convexUrl;
for (const line of envContent.split("\n")) {
  const parts = line.split("=");
  if (parts.length >= 2 && parts[0].trim() === "NEXT_PUBLIC_CONVEX_URL") {
    convexUrl = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}
if (!convexUrl) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL is not set in .env.local");
  process.exit(1);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Older iPhones (pre-15 series) get a screen-size suffix in their old-site
// slug, e.g. "apple-iphone-13-pro-max-67" (confirmed via live search — the
// plain/brand-prefixed guesses both 404 for these). Newer models (15/16/17
// series) resolve fine without it. Best-effort table from public Apple
// specs; not exhaustive — models missing here just fall back to the
// no-suffix candidates.
const IPHONE_SCREEN_SIZE = {
  "iphone-16-plus": "67", "iphone-16": "61", "iphone-16e": "61",
  "iphone-15-pro-max": "67", "iphone-15-pro": "61", "iphone-15-plus": "67", "iphone-15": "61",
  "iphone-14-pro-max": "67", "iphone-14-pro": "61", "iphone-14-plus": "67", "iphone-14": "61",
  "iphone-13-pro-max": "67", "iphone-13-pro": "61", "iphone-13-mini": "54", "iphone-13": "61",
  "iphone-12-pro-max": "67", "iphone-12-pro": "61", "iphone-12-mini": "54", "iphone-12": "61",
  "iphone-11-pro-max": "65", "iphone-11-pro": "58", "iphone-11": "61",
  "iphone-xs-max": "65", "iphone-xs": "58", "iphone-xr": "61", "iphone-x": "58",
  "iphone-8-plus": "55", "iphone-8": "47", "iphone-7-plus": "55", "iphone-7": "47",
  "iphone-6-plus": "55", "iphone-6s": "47", "iphone-6": "47",
  "iphone-se2": "47", "iphone-se2-2020": "47",
};

function candidateSlugs(brand, model) {
  const brandSlug = slugify(brand);
  const modelSlug = slugify(model);
  const set = new Set([
    modelSlug,
    `${brandSlug}-${modelSlug}`,
  ]);
  if (brand === "samsung") {
    set.add(`${brandSlug}-galaxy-${modelSlug}`);
    set.add(`galaxy-${modelSlug}`);
  }
  if (brand === "apple") {
    const size = IPHONE_SCREEN_SIZE[modelSlug];
    if (size) set.add(`${brandSlug}-${modelSlug}-${size}`);
  }
  return [...set].filter(Boolean);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(slug, pageIdx) {
  const url =
    `https://keisove.net/%D0%B0%D0%BA%D1%81%D0%B5%D1%81%D0%BE%D0%B0%D1%80%D0%B8/${encodeURIComponent(slug)}` +
    (pageIdx > 0 ? `?page=0%2C${pageIdx}` : "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "bg" },
    });
    if (res.status !== 200) return { status: res.status, ids: [], latencyMs: Date.now() - started };
    const html = await res.text();
    const ids = [...new Set([...html.matchAll(/product-teaser-image-slider-(\d+)/g)].map((m) => m[1]))];
    return { status: 200, ids, html, latencyMs: Date.now() - started };
  } catch (err) {
    // Network hiccup (reset connection, timeout, DNS blip) — treat as a
    // retryable non-200 rather than crashing the whole multi-hundred-model
    // run; pace()'s error-streak backoff handles sustained outages.
    return { status: 0, ids: [], error: String(err?.message || err).slice(0, 200), latencyMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

// Finds a working slug for this model and returns the full ID set across
// all its pages (or null if no candidate slug resolved to a real listing).
async function collectIdsForModel(brand, model, state) {
  for (const slug of candidateSlugs(brand, model)) {
    const first = await fetchPage(slug, 0);
    state.requests++;
    await pace(state, first);
    if (first.status !== 200 || first.ids.length === 0) continue;

    const allIds = new Set(first.ids);
    let pageIdx = 1;
    while (true) {
      const page = await fetchPage(slug, pageIdx);
      state.requests++;
      await pace(state, page);
      if (page.status !== 200 || page.ids.length === 0) break;
      const before = allIds.size;
      for (const id of page.ids) allIds.add(id);
      if (allIds.size === before) break; // no new ids -> past the end
      pageIdx++;
      if (pageIdx > 30) break; // sanity cap
    }
    return { slug, ids: [...allIds] };
  }
  return null;
}

async function pace(state, result) {
  // A 404 while trying candidate slugs is a NORMAL, expected outcome of the
  // guess-the-right-slug algorithm (most models need 2+ tries) — it says
  // nothing about the server's health and must not trip the circuit
  // breaker. Only count genuine trouble: network failures (status 0) or
  // server-side rate-limit/error responses (429, 5xx).
  const isRealError = result.status === 0 || result.status === 429 || result.status >= 500;
  if (isRealError) state.errorStreak++;
  else state.errorStreak = 0;
  if (state.errorStreak >= 5) {
    const pause = Math.min(10 * 60 * 1000, 30000 * 2 ** Math.min(state.errorStreak - 5, 5));
    console.log(`[${new Date().toISOString()}] ${state.errorStreak} consecutive real errors (network/5xx/429) — pausing ${Math.round(pause / 1000)}s`);
    await sleep(pause);
  }
  // Adapt on THIS single request's own latency, not on how many sequential
  // candidate/page requests a given model happened to need — otherwise
  // models needing several guesses look "slow" and ratchet the delay up
  // for everyone, even though the server answered every request quickly.
  if (result.latencyMs > 4000) state.delay = Math.min(MAX_DELAY_MS, Math.round(state.delay * 1.2));
  else state.delay = Math.max(BASE_DELAY_MS, Math.round(state.delay * 0.97));
  await sleep(state.delay);
}

async function run() {
  const client = new ConvexClient(convexUrl);
  console.log(`[${new Date().toISOString()}] Loading full catalog from Convex...`);
  let cursor = null;
  let isDone = false;
  const ourSourceIds = new Set();
  while (!isDone) {
    const r = await client.query("products:list", { paginationOpts: { numItems: 1000, cursor } });
    for (const p of r.page) ourSourceIds.add(p.sourceId);
    cursor = r.continueCursor;
    isDone = r.isDone;
  }
  console.log(`[${new Date().toISOString()}] Loaded ${ourSourceIds.size} products.`);

  const allModels = [];
  for (const brand of Object.keys(modelsData)) {
    for (const model of modelsData[brand]) {
      allModels.push({ brand, model });
    }
  }
  console.log(`Total models to audit: ${allModels.length}`);

  let report = {};
  if (fs.existsSync(REPORT_FILE)) {
    report = JSON.parse(fs.readFileSync(REPORT_FILE, "utf8"));
    console.log(`Resuming — ${Object.keys(report).length} models already done.`);
  }

  const state = { delay: BASE_DELAY_MS, errorStreak: 0, requests: 0 };
  let done = Object.keys(report).length;

  for (const { brand, model } of allModels) {
    const key = `${brand}|${model}`;
    if (report[key]) continue;

    try {
      // Hard ceiling per model: a fetch's AbortController occasionally
      // fails to unstick a connection left half-open by a network blip
      // (observed: the run sat idle for over an hour on one model with zero
      // CPU activity and no error logged). This guarantees the outer loop
      // always moves on to the next model no matter what happens below.
      const result = await Promise.race([
        collectIdsForModel(brand, model, state),
        sleep(MODEL_TIMEOUT_MS).then(() => "TIMEOUT"),
      ]);

      if (result === "TIMEOUT") {
        report[key] = { brand, model, resolved: false, error: "model-level timeout" };
        state.errorStreak++; // a hung fetch is a real-world symptom worth backing off for
      } else if (!result) {
        report[key] = { brand, model, resolved: false };
      } else {
        const missing = result.ids.filter((id) => !ourSourceIds.has(id));
        report[key] = {
          brand,
          model,
          resolved: true,
          slug: result.slug,
          oldSiteCount: result.ids.length,
          missingCount: missing.length,
          missingIds: missing,
        };
      }
    } catch (err) {
      // Defense in depth: an unexpected error for one model must not lose
      // progress on the other ~1000. Mark it unresolved and move on.
      report[key] = { brand, model, resolved: false, error: String(err?.message || err).slice(0, 200) };
    }

    done++;
    if (done % 5 === 0) {
      fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
      console.log(
        `[${new Date().toISOString()}] ${done}/${allModels.length} (delay=${state.delay}ms, requests=${state.requests})`
      );
    }
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  const resolved = Object.values(report).filter((r) => r.resolved);
  const unresolved = Object.values(report).filter((r) => !r.resolved);
  const withGaps = resolved.filter((r) => r.missingCount > 0);
  const totalMissing = withGaps.reduce((sum, r) => sum + r.missingCount, 0);

  console.log(`\n=== DONE ===`);
  console.log(`Resolved: ${resolved.length}/${allModels.length}`);
  console.log(`Unresolved (couldn't find old-site page): ${unresolved.length}`);
  console.log(`Models with real gaps: ${withGaps.length}`);
  console.log(`Total missing products: ${totalMissing}`);
  console.log(`\nTop 20 models by gap size:`);
  withGaps
    .sort((a, b) => b.missingCount - a.missingCount)
    .slice(0, 20)
    .forEach((r) => console.log(`  ${r.brand}: ${r.model} — missing ${r.missingCount}/${r.oldSiteCount}`));
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
