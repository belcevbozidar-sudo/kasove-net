// Moves the ~1,477 products living in category values that don't exist in
// the site's own category menu (src/lib/data.ts `categories`) — "handsfree",
// "batteries", "powerbanks", "chargers-12v", "tablet-cases", "smart-devices",
// "universal-cases", "apple-accessories", "other", "gsm-accessories",
// "memory-cards" — into the closest official category. These products were
// otherwise unreachable through any category-based browsing (sidebar
// filters, header menu, brand/model wizard), only findable via direct search.
//
// Classification is by product NAME content (not by the old orphan category
// label), since the orphan buckets themselves were mixed — e.g. "other"
// contained Bluetooth speakers, leather belt cases, and USB flash drives all
// mixed together. Rules are ordered most-specific-first; first match wins.
//
// Dry-run by default: prints a report grouped by target category + writes
// fix-orphan-categories-plan.json. Run with --apply to patch (writes a
// before-state backup first).
//
// Usage: node scripts/fix-orphan-categories.js [--apply]

const fs = require("fs");
const path = require("path");

for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !(m[1] in process.env)) {
    process.env[m[1]] = m[2].replace(/\s*#.*$/, "").trim().replace(/^"(.*)"$/, "$1");
  }
}

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const ADMIN_SECRET = process.env.ADMIN_API_SECRET;
const APPLY = process.argv.includes("--apply");

const OFFICIAL_CATEGORIES = new Set([
  "silicone-cases", "hard-cases", "leather-cases", "protectors",
  "chargers-220v", "usb-cables", "car-stands", "bluetooth-headphones", "toys",
]);

// Ordered, most-specific-first. Each rule: [regex, targetCategory].
const RULES = [
  // Screen/camera-lens protectors
  [/протектор.*(дисплей|скрийн|камера)|скрийн.*протектор|tempered glass|screen protector/i, "protectors"],
  // Leather cases (incl. flip/tefter/kobur/waist-belt holsters)
  [/кожен|кобур|тефтер/i, "leather-cases"],
  // Silicone / TPU cases — incl. AirPods/Earbuds silicone cases and silicone watch straps
  [/силикон|tpu\b/i, "silicone-cases"],
  // Hard cases / bumpers ("върд" not "твърд" — some listings use a Latin "T"
  // homoglyph, e.g. "Tвърд", so anchor on the common suffix instead)
  [/върд.*(гръб|калъф|кейс|капак)|hard case|бъмпер/i, "hard-cases"],
  // Chargers (wall/car/wireless power adapters, power banks, batteries, 12V cigarette-lighter splitters)
  [/зарядно|адаптер.*(захранван|charger)|charger|power ?bank|батерия(?!та)|запалка/i, "chargers-220v"],
  // Cables, OTG, flash drives, memory cards, data adapters
  [/кабел|otg|флаш памет|flash памет|flash drive|usb flash|карта памет|sd card|micro\s?sd|адаптер.*(данни|трансфер)/i, "usb-cables"],
  // Car stands / holders / mounts / grips / tripods / selfie sticks
  [/стойка|държач|тринога|трипод|popsocket|селфи стик|велосипед|ароматизатор.*кола/i, "car-stands"],
  // Audio: earphones (singular/plural stem "слушалк"), handsfree, speakers,
  // AUX, FM transmitters, mics, gaming headsets, jack/audio adapters
  [/слушалк|handsfree|тонколон|bluetooth speaker|aux\b|fm трансмитер|микрофон|наушник|аудио.*(адаптер|преходник)|jack adapter/i, "bluetooth-headphones"],
  // A generic "калъф/гръб/кейс/case" with no material called out defaults to
  // the site's most common case type rather than falling all the way through.
  // (No trailing \b on the Cyrillic words: JS regex word-boundaries are only
  // ASCII-aware, so \b right after a Cyrillic letter never matches — "case"
  // is Latin, so \b works correctly there.)
  [/калъф|гръб|кейс|\bcase\b/i, "silicone-cases"],
  // Everything left (collectible figures, retro consoles, popit, ring lights,
  // aroma diffusers, standalone gadgets like action cameras/game consoles) —
  // no phone/car/audio category fits, so it lands in the site's only
  // non-phone-accessory bucket.
];

const FALLBACK_CATEGORY = "toys";

function classify(name) {
  for (const [re, cat] of RULES) {
    if (re.test(name)) return cat;
  }
  return FALLBACK_CATEGORY;
}

async function convexCall(kind, fnPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args, format: "json" }),
  });
  const data = await res.json();
  if (data.status !== "success") throw new Error(`${fnPath} failed: ${JSON.stringify(data).slice(0, 300)}`);
  return data.value;
}

async function main() {
  console.log("Scanning all products for orphan categories...");
  let cursor = null;
  let total = 0;
  const orphans = [];
  for (;;) {
    const r = await convexCall("query", "products:list", { sort: "featured", paginationOpts: { numItems: 500, cursor } });
    for (const p of r.page) {
      total++;
      if (!OFFICIAL_CATEGORIES.has(p.category)) {
        orphans.push({ sourceId: p.sourceId, name: p.name, brand: p.brand, oldCategory: p.category });
      }
    }
    process.stdout.write(`\rscanned ${total}, orphans ${orphans.length}`);
    if (r.isDone) break;
    cursor = r.continueCursor;
  }
  console.log(`\nTotal orphan-category products: ${orphans.length}`);

  const byTarget = {};
  for (const o of orphans) {
    o.newCategory = classify(o.name);
    (byTarget[o.newCategory] ||= []).push(o);
  }

  console.log("\n=== Classification summary ===");
  for (const cat of Object.keys(byTarget).sort((a, b) => byTarget[b].length - byTarget[a].length)) {
    console.log(`\n-- ${cat}: ${byTarget[cat].length} --`);
    for (const o of byTarget[cat].slice(0, 8)) {
      console.log(`  ${o.sourceId}  [${o.oldCategory}] ${o.name.slice(0, 75)}`);
    }
    if (byTarget[cat].length > 8) console.log(`  ... and ${byTarget[cat].length - 8} more`);
  }

  fs.writeFileSync(path.join(__dirname, "fix-orphan-categories-plan.json"), JSON.stringify(orphans, null, 2));
  console.log(`\nPlan written to scripts/fix-orphan-categories-plan.json (${orphans.length} products)`);

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to patch the database.");
    return;
  }

  fs.writeFileSync(path.join(__dirname, "fix-orphan-categories-backup.json"), JSON.stringify(orphans, null, 2));
  let done = 0;
  for (const o of orphans) {
    await convexCall("mutation", "products:adminSetCategory", {
      adminSecret: ADMIN_SECRET,
      sourceId: o.sourceId,
      category: o.newCategory,
    });
    done++;
    if (done % 50 === 0 || done === orphans.length) process.stdout.write(`\rapplied ${done}/${orphans.length}`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
