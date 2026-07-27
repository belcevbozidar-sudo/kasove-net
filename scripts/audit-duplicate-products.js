const { ConvexClient } = require("convex/browser");
const fs = require("fs");

try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  }
} catch (e) {
  console.log("Could not read .env.local manually, using process.env");
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL is not defined in .env.local");
  process.exit(1);
}

const client = new ConvexClient(convexUrl);

// Only strip the "4G"/"5G" connectivity token and normalize punctuation —
// color/variant suffixes are kept, since those are legitimately separate
// SKUs. This narrowly targets the actual bug: the same listing (same color,
// same everything else) entered twice, once with "5G"/"4G" in the name and
// once without.
function normalizeName(name) {
  let n = name.toLowerCase();
  n = n.replace(/\b[45]g\b/gi, " ");
  n = n.replace(/[^\p{L}\p{N}\s]/gu, " ");
  n = n.replace(/\s+/g, " ").trim();
  return n;
}

function normalizeModel(model) {
  return (model || "")
    .toLowerCase()
    .replace(/\b[45]g\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function run() {
  console.log(`Connecting to Convex at: ${convexUrl}`);

  let cursor = null;
  let isDone = false;
  const all = [];

  while (!isDone) {
    const result = await client.query("products:list", {
      paginationOpts: { numItems: 1000, cursor },
    });
    all.push(...result.page);
    cursor = result.continueCursor;
    isDone = result.isDone;
  }

  console.log(`Scanned ${all.length} products.\n`);

  const groups = new Map();
  for (const p of all) {
    const key = `${p.brand}|${p.category}|${normalizeModel(p.model)}|${normalizeName(p.name)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  const dupGroups = Array.from(groups.entries())
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({ key, items }));

  console.log(`Found ${dupGroups.length} groups with more than one product sharing brand+category+normalized model+normalized name.`);
  const totalDupProducts = dupGroups.reduce((s, g) => s + g.items.length, 0);
  console.log(`(${totalDupProducts} products total inside these groups; ${totalDupProducts - dupGroups.length} would be removable if one canonical record is kept per group.)\n`);

  const byBrand = {};
  for (const g of dupGroups) {
    const b = g.items[0].brand;
    byBrand[b] = (byBrand[b] || 0) + 1;
  }
  console.log("Duplicate groups by brand:", byBrand, "\n");

  console.log("Sample groups (first 25):");
  for (const g of dupGroups.slice(0, 25)) {
    console.log(`\n[${g.items[0].brand} / ${g.items[0].category}] key="${g.key}"`);
    for (const it of g.items) {
      console.log(
        `   - sourceId=${it.sourceId} name="${it.name}" model="${it.model}" price=${it.price} bundleWith=${it.bundleWith ?? "-"} image=${it.image}`
      );
    }
  }

  const outPath = "scripts/duplicate-products-audit.json";
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      dupGroups.map((g) => ({
        key: g.key,
        items: g.items.map((it) => ({
          sourceId: it.sourceId,
          slug: it.slug,
          name: it.name,
          model: it.model,
          brand: it.brand,
          category: it.category,
          price: it.price,
          image: it.image,
          bundleWith: it.bundleWith ?? null,
        })),
      })),
      null,
      2
    )
  );
  console.log(`\nFull report (${dupGroups.length} groups) written to ${outPath}`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
