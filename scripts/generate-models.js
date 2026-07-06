const { ConvexClient } = require("convex/browser");
const fs = require("fs");
const path = require("path");

// Read environment variables manually to avoid dependency on dotenv
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

// Categories where the 'model' field represents an actual phone/tablet model
const PHONE_CASE_CATEGORIES = new Set([
  "leather-cases",
  "silicone-cases",
  "hard-cases",
  "protectors",
  "tablet-cases"
]);

function cleanModelName(model, brand) {
  let cleaned = model;

  // 1. Strip attached mixed-script prefixes first (e.g. "наXiaomi" -> "Xiaomi")
  cleaned = cleaned.replace(/^[нн][аa](?=[A-ZА-Я])/i, "");
  cleaned = cleaned.replace(/\b[нн][аa](?=[A-ZА-Я])/gi, "");

  // 2. Remove parenthesized dimensions (e.g. "(6.9)", "(6.3)")
  cleaned = cleaned.replace(/\(\d+(\.\d+)?\)/g, "");

  // 3. Remove quote/inch dimensions (e.g. "6.5\"", "5.4\"", "6.7''")
  cleaned = cleaned.replace(/\b\d+(\.\d+)?\s*(?:"|''|'|инча)\b/g, "");
  cleaned = cleaned.replace(/\d+(\.\d+)?\s*(?:"|''|'|инча)/g, "");

  // 4. Remove common dirty prefixes (handling Cyrillic / Latin variations)
  const prefixesToRemove = [
    /^(задна\s+)?камера\s+(?:на|нa)\s+/i,
    /^задна\s+камера\s+/i,
    /^камера\s+/i,
    /^дисплей\s+(?:на|нa)\s+/i,
    /^дисплей\s+/i,
    /^стъклен\s+протектор\s+за\s+/i,
    /^протектор\s+за\s+/i,
    /^калъф\s+за\s+/i,
    /^кейс\s+за\s+/i,
    /^гръб\s+(?:на|нa|за)\s+/i,
    /^гръб\s+/i,
    /^аксесоари\s+за\s+/i,
    /^батерия\s+за\s+/i,
  ];

  for (const regex of prefixesToRemove) {
    cleaned = cleaned.replace(regex, "");
  }

  // 5. Normalize typos and mixed-script brand/sub-brand names
  cleaned = cleaned.replace(/^xioami\s+/i, "Xiaomi ");
  cleaned = cleaned.replace(/^xiomi\s+/i, "Xiaomi ");
  cleaned = cleaned.replace(/^appe\s+/i, "Apple ");
  cleaned = cleaned.replace(/^apple\s+/i, "Apple ");
  cleaned = cleaned.replace(/red[мm]i/gi, "Redmi");
  cleaned = cleaned.replace(/p[оo]c[оo]/gi, "Poco");

  // 6. Strip any leftover "на" / "нa" at the start of string
  cleaned = cleaned.replace(/^[нн][аa]\s*/i, "");

  // 7. Split by slash '/' to strip description text or secondary models
  cleaned = cleaned.split(/\s*\/\s*/)[0];

  // 8. Split by dashes to strip color/design variations, keeping 5G/4G
  const parts = cleaned.split(/\s*[-–—]\s*/);
  if (parts.length > 1) {
    const suffix = parts[1].trim();
    if (suffix.toLowerCase() === "5g" || suffix.toLowerCase() === "4g") {
      cleaned = `${parts[0]} ${suffix}`;
    } else {
      cleaned = parts[0];
    }
  }

  // 9. Remove brand prefix for cleaner look
  const brandRegex = new RegExp(`^${brand}\\s+`, "i");
  cleaned = cleaned.replace(brandRegex, "");
  cleaned = cleaned.replace(/^apple\s+/i, ""); // extra fallback for Apple

  // 10. Split by "серия", "series", "usb-c", etc. (no \b for Cyrillic compatibility)
  cleaned = cleaned.split(/\s+(?:серия|series|usb-c|cable|charger|w\s+woven|woven)/i)[0];

  cleaned = cleaned.trim();

  // Normalize Cyrillic 'T'/'Т' suffix (e.g. "Redmi Note 8Т" -> "Redmi Note 8T")
  cleaned = cleaned.replace(/([0-9]+)[тТ]\b/g, "$1T");

  // 7. Generic blacklist
  const lowercase = cleaned.toLowerCase();
  const blacklistedWords = [
    "задна камера", "камера", "дисплей", "пълна защита", "черна", "прозрачен", 
    "протектор", "аксесоар", "калъф", "кейс", "5d full cover", "3d", "5d", "9d", "watch series", "watch"
  ];
  for (const word of blacklistedWords) {
    if (lowercase === word || lowercase.startsWith(word + " ")) {
      return null;
    }
  }

  // Blacklist exact generic brand/device name matches
  const genericTerms = new Set([
    "iphone", "ipad", "galaxy", "samsung", "huawei", "xiaomi", "redmi", 
    "lg", "sony", "nokia", "oneplus", "google", "pixel", "watch", 
    "motorola", "realme", "honor", "lenovo"
  ]);
  if (genericTerms.has(lowercase)) {
    return null;
  }

  // 8. Cross-brand filtration
  const otherBrands = {
    apple: ["samsung", "galaxy", "huawei", "xiaomi", "redmi", "lg", "sony", "motorola", "nokia", "lenovo"],
    samsung: ["iphone", "ipad", "apple", "huawei", "xiaomi", "redmi", "sony", "nokia"],
    xiaomi: ["iphone", "ipad", "apple", "samsung", "galaxy", "huawei", "sony", "nokia"],
    huawei: ["iphone", "ipad", "apple", "samsung", "galaxy", "xiaomi", "redmi", "sony", "nokia"],
    google: ["iphone", "ipad", "apple", "samsung", "galaxy", "xiaomi", "huawei"],
    oneplus: ["iphone", "ipad", "apple", "samsung", "galaxy"],
  };

  const blacklist = otherBrands[brand.toLowerCase()];
  if (blacklist) {
    for (const forbidden of blacklist) {
      if (lowercase.includes(forbidden)) {
        return null;
      }
    }
  }

  // Apple specific: must contain iPhone or iPad or Watch or iPod
  if (brand.toLowerCase() === "apple") {
    const isAppleDevice = ["iphone", "ipad", "watch", "ipod"].some(dev => lowercase.includes(dev));
    if (!isAppleDevice) return null;
  }

  if (cleaned.length < 2) return null;

  // Normalize casing of commonly known suffixes
  cleaned = cleaned.replace(/\bmax\b/i, "Max");
  cleaned = cleaned.replace(/\bmini\b/i, "Mini");
  cleaned = cleaned.replace(/\bpro\b/i, "Pro");
  cleaned = cleaned.replace(/\bplus\b/i, "Plus");
  cleaned = cleaned.replace(/\bseries\b/i, "Series");

  // Clean trailing dimensions and quotes
  cleaned = cleaned.replace(/\s+6\.5\s*$/g, "");
  cleaned = cleaned.replace(/\s+5\.8\s*$/g, "");
  cleaned = cleaned.replace(/\s+6\.1\s*$/g, "");
  cleaned = cleaned.replace(/\s+6\.7\s*$/g, "");
  cleaned = cleaned.replace(/\s+6\.9\s*$/g, "");
  cleaned = cleaned.replace(/\s+6\.3\s*$/g, "");
  cleaned = cleaned.replace(/\s+['"`‘’“”′″]+$/g, ""); // trailing quotes
  cleaned = cleaned.replace(/\s+\/\s*\d+\s*$/g, ""); // trailing slash dimensions
  cleaned = cleaned.replace(/\s*\/12\s*$/g, ""); // trailing /12
  cleaned = cleaned.trim();

  // Capitalize "iphone" as "iPhone", "ipad" as "iPad"
  if (cleaned.toLowerCase().startsWith("iphone")) {
    cleaned = "iPhone" + cleaned.substring(6);
  } else if (cleaned.toLowerCase().startsWith("ipad")) {
    cleaned = "iPad" + cleaned.substring(4);
  }

  return cleaned;
}

async function run() {
  console.log("Connecting to Convex at:", convexUrl);
  
  const brandModels = {};
  let cursor = null;
  let isDone = false;
  let totalProcessed = 0;

  console.log("Fetching products in chunks...");

  while (!isDone) {
    const result = await client.query("products:list", {
      paginationOpts: {
        numItems: 1000,
        cursor: cursor
      }
    });

    for (const p of result.page) {
      totalProcessed++;
      const brand = p.brand;
      const model = p.model;
      const category = p.category;

      if (
        brand &&
        model &&
        PHONE_CASE_CATEGORIES.has(category) &&
        model !== "Универсален" &&
        model !== "Универсална" &&
        model.trim() !== ""
      ) {
        const cleaned = cleanModelName(model.trim(), brand);
        if (cleaned) {
          if (!brandModels[brand]) {
            brandModels[brand] = new Set();
          }
          brandModels[brand].add(cleaned);
        }
      }
    }

    console.log(`Processed ${totalProcessed} products...`);
    cursor = result.continueCursor;
    isDone = result.isDone;
  }

function getAppleWeight(name) {
  const lowercase = name.toLowerCase();
  let score = 0;
  
  if (lowercase.includes("ipad")) {
    score += 50000;
  } else if (lowercase.includes("iphone")) {
    score += 100000;
  }
  
  const numMatch = lowercase.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    if (num > 2000) {
      score += (num - 2000) * 10;
    } else {
      score += num * 100;
    }
  } else {
    if (lowercase.includes("xs max")) {
      score += 1050;
    } else if (lowercase.includes("xs")) {
      score += 1040;
    } else if (lowercase.includes("xr")) {
      score += 1030;
    } else if (lowercase.includes("x")) {
      score += 1000;
    } else if (lowercase.includes("se3") || lowercase.includes("se 3")) {
      score += 1350;
    } else if (lowercase.includes("se2") || lowercase.includes("se 2") || lowercase.includes("se 2020")) {
      score += 1150;
    } else if (lowercase.includes("se")) {
      score += 650;
    }
  }
  
  if (lowercase.includes("6s") || lowercase.includes("5s")) {
    score += 5;
  }
  
  if (lowercase.includes("pro max")) {
    score += 40;
  } else if (lowercase.includes("pro")) {
    score += 30;
  } else if (lowercase.includes("plus")) {
    score += 20;
  } else if (lowercase.includes("air")) {
    score += 15;
  } else if (lowercase.includes("mini")) {
    score += 10;
  }
  
  return score;
}

function getSamsungWeight(name) {
  const lowercase = name.toLowerCase();
  let score = 0;
  let hasSeries = false;
  let num = 0;
  
  if (lowercase.includes("s24") || lowercase.includes("s23") || lowercase.includes("s22") || lowercase.includes("s21") || lowercase.includes("s20") || /\bs[1-9]\b/.test(lowercase) || /\bs10\b/.test(lowercase) || /\bs[1-9]0\b/.test(lowercase)) {
    score += 400000;
    hasSeries = true;
    const sMatch = lowercase.match(/\bs\s*([0-9]+)/) || lowercase.match(/s([0-9]+)/);
    if (sMatch) num = parseInt(sMatch[1], 10);
  } else if (lowercase.includes("note")) {
    score += 300000;
    hasSeries = true;
    const noteMatch = lowercase.match(/note\s*([0-9]+)/);
    if (noteMatch) num = parseInt(noteMatch[1], 10);
  } else if (lowercase.includes("fold") || lowercase.includes("flip")) {
    score += 350000;
    hasSeries = true;
    const foldMatch = lowercase.match(/(?:fold|flip)\s*([0-9]+)/);
    if (foldMatch) num = parseInt(foldMatch[1], 10);
  } else if (lowercase.includes("galaxy a") || /\ba[0-9]/.test(lowercase)) {
    score += 200000;
    hasSeries = true;
    const aMatch = lowercase.match(/\ba\s*([0-9]+)/) || lowercase.match(/a([0-9]+)/);
    if (aMatch) num = parseInt(aMatch[1], 10);
  } else if (lowercase.includes("galaxy j") || /\bj[0-9]/.test(lowercase)) {
    score += 100000;
    hasSeries = true;
    const jMatch = lowercase.match(/\bj\s*([0-9]+)/) || lowercase.match(/j([0-9]+)/);
    if (jMatch) num = parseInt(jMatch[1], 10);
  }
  
  if (!hasSeries) {
    const numMatch = lowercase.match(/\d+/);
    if (numMatch) num = parseInt(numMatch[0], 10);
  }
  
  score += num * 10;
  
  if (lowercase.includes("ultra")) {
    score += 9;
  } else if (lowercase.includes("pro") || lowercase.includes("plus")) {
    score += 5;
  } else if (lowercase.includes("fe")) {
    score += 3;
  } else if (lowercase.includes("lite")) {
    score += 1;
  }
  
  return score;
}

function getXiaomiWeight(name) {
  const lowercase = name.toLowerCase();
  let score = 0;
  let num = 0;
  let hasSeries = false;
  
  if (lowercase.includes("mi")) {
    score += 300000;
    hasSeries = true;
    const miMatch = lowercase.match(/\bmi\s*([0-9]+)/) || lowercase.match(/mi([0-9]+)/);
    if (miMatch) num = parseInt(miMatch[1], 10);
  } else if (lowercase.includes("note")) {
    score += 200000;
    hasSeries = true;
    const noteMatch = lowercase.match(/note\s*([0-9]+)/);
    if (noteMatch) num = parseInt(noteMatch[1], 10);
  } else if (lowercase.includes("redmi")) {
    score += 100000;
    hasSeries = true;
    const redmiMatch = lowercase.match(/redmi\s*([0-9]+)/);
    if (redmiMatch) num = parseInt(redmiMatch[1], 10);
  } else if (lowercase.includes("poco")) {
    score += 150000;
    hasSeries = true;
    const pocoMatch = lowercase.match(/poco\s*[a-z]?\s*([0-9]+)/i) || lowercase.match(/\b[a-z]([0-9]+)\b/);
    if (pocoMatch) num = parseInt(pocoMatch[1], 10);
  }
  
  if (!hasSeries) {
    const numMatch = lowercase.match(/\d+/);
    if (numMatch) num = parseInt(numMatch[0], 10);
  }
  
  score += num * 10;
  
  if (lowercase.includes("pro plus") || lowercase.includes("pro+")) {
    score += 5;
  } else if (lowercase.includes("pro")) {
    score += 4;
  } else if (lowercase.includes("plus")) {
    score += 3;
  } else if (lowercase.includes("se")) {
    score += 2;
  } else if (lowercase.includes("lite")) {
    score += 1;
  }
  
  return score;
}

function getModelWeight(name, brand) {
  const b = brand.toLowerCase();
  if (b === "apple") {
    return getAppleWeight(name);
  } else if (b === "samsung") {
    return getSamsungWeight(name);
  } else if (b === "xiaomi") {
    return getXiaomiWeight(name);
  }
  
  const numMatch = name.match(/\d+/);
  if (numMatch) {
    return parseInt(numMatch[0], 10);
  }
  return 0;
}

// Convert sets to sorted arrays using chronological weight
const output = {};
for (const brand in brandModels) {
  output[brand] = Array.from(brandModels[brand]).sort((a, b) => {
    const wA = getModelWeight(a, brand);
    const wB = getModelWeight(b, brand);
    if (wA !== wB) {
      return wB - wA; // Newest (highest weight) first
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
}

  // Write to src/lib/models.json
  const outputPath = path.join(__dirname, "../src/lib/models.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`Successfully generated models.json at ${outputPath}!`);
  
  // Print some statistics
  for (const brand in output) {
    console.log(`- ${brand}: ${output[brand].length} unique models`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
