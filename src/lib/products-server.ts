import "server-only";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import type { Badge, BrandSlug, CategorySlug, Product } from "./types";

function toProduct(doc: Doc<"products">): Product {
  const { _id, _creationTime, sourceId, hasOldPrice, ...rest } = doc;
  return {
    id: sourceId,
    ...rest,
    brand: rest.brand as BrandSlug,
    category: rest.category as CategorySlug,
    badge: rest.badge as Badge | undefined,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const doc = await fetchQuery(api.products.getBySlug, { slug });
  return doc ? toProduct(doc) : undefined;
}

function cleanModelName(model: string, brand: string): string | null {
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
  cleaned = cleaned.replace(/\s+['"`‘’“”′″]+$/g, "");
  cleaned = cleaned.replace(/\s+\/\s*\d+\s*$/g, "");
  cleaned = cleaned.replace(/\s*\/12\s*$/g, "");
  cleaned = cleaned.trim();

  if (cleaned.toLowerCase().startsWith("iphone")) {
    cleaned = "iPhone" + cleaned.substring(6);
  } else if (cleaned.toLowerCase().startsWith("ipad")) {
    cleaned = "iPad" + cleaned.substring(4);
  }

  return cleaned;
}

export async function getBundleProducts(product: Product): Promise<Product[]> {
  // 1. If manual bundleWith is set, use it as a list containing that single product
  if (product.bundleWith) {
    const doc = await fetchQuery(api.products.getBySourceId, { sourceId: product.bundleWith });
    if (doc) return [toProduct(doc)];
  }

  // 2. Otherwise, if it is a case category, search for protectors for the same brand and model
  const caseCategories = new Set([
    "leather-cases",
    "silicone-cases",
    "hard-cases"
  ]);

  if (caseCategories.has(product.category) && product.model) {
    const cleanedCaseModel = cleanModelName(product.model, product.brand);
    if (!cleanedCaseModel) return [];

    // Split cleaned model name into keywords (e.g. "S24 Ultra" -> ["s24", "ultra"])
    // Filter out "5g" and "4g" since screen protectors often omit them
    const modelWords = cleanedCaseModel
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 0 && w !== "5g" && w !== "4g");

    // Fetch all protectors for this brand
    const result = await fetchQuery(api.products.list, {
      brand: product.brand,
      category: "protectors",
      paginationOpts: {
        numItems: 100, // Fetch up to 100 screen protectors to perform keyword matching
        cursor: null
      }
    });

    if (result.page && result.page.length > 0) {
      const protectors = result.page.map(toProduct);
      
      // Filter protectors whose name contains ALL words of the case model name
      const compatible = protectors.filter(p => {
        const nameLower = p.name.toLowerCase();
        const modelLower = p.model ? p.model.toLowerCase() : "";
        return modelWords.every(word => nameLower.includes(word) || modelLower.includes(word));
      });

      return compatible.slice(0, 10);
    }
  }

  return [];
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const docs = await fetchQuery(api.products.getRelated, {
    sourceId: product.id,
    category: product.category,
    brand: product.brand,
    limit,
  });
  return docs.map(toProduct);
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  const docs = await fetchQuery(api.products.getBestSellers, { limit });
  return docs.map(toProduct);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const docs = await fetchQuery(api.products.getNewArrivals, { limit });
  return docs.map(toProduct);
}

export interface FilterOptions {
  brand?: string;
  category?: string;
  sort?: string;
  q?: string;
  scale?: string;
  model?: string;
  cursor?: string | null;
  numItems?: number;
}

export interface FilterResult {
  products: Product[];
  totalCount: number | null;
  isDone: boolean;
  continueCursor: string;
}

const VALID_SORTS = new Set(["featured", "price-asc", "price-desc", "rating"]);

export async function filterProducts(opts: FilterOptions): Promise<FilterResult> {
  const sort = opts.sort && VALID_SORTS.has(opts.sort) ? (opts.sort as "featured" | "price-asc" | "price-desc" | "rating") : undefined;
  const result = await fetchQuery(api.products.list, {
    brand: opts.brand && opts.brand !== "all" ? opts.brand : undefined,
    category: opts.category && opts.category !== "all" ? opts.category : undefined,
    sort,
    q: opts.q || undefined,
    scale: opts.scale && opts.scale !== "all" ? opts.scale : undefined,
    model: opts.model && opts.model !== "all" ? opts.model : undefined,
    paginationOpts: {
      numItems: opts.numItems ?? 24,
      cursor: opts.cursor ?? null,
    },
  });

  return {
    products: result.page.map(toProduct),
    totalCount: result.totalCount,
    isDone: result.isDone,
    continueCursor: result.continueCursor,
  };
}

export async function getBrandModels(brand: string): Promise<string[]> {
  return await fetchQuery(api.products.getModels, { brand });
}
