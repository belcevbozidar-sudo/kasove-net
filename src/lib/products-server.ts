import "server-only";
import { fetchQuery } from "convex/nextjs";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import type { Badge, BrandSlug, CategorySlug, Product } from "./types";

export function toProduct(doc: Doc<"products">): Product {
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

    // Word *set* of the case's model (e.g. "S24 Ultra" -> {s24, ultra}),
    // with the 5G/4G connectivity tag ignored since it's not a distinct
    // model as far as case/protector fit is concerned.
    const caseWords = new Set(
      cleanedCaseModel
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0 && w !== "5g" && w !== "4g")
    );

    // Fetch every protector for this brand — a single capped page (previously
    // 100 items) silently missed models for brands like Samsung/Apple that
    // carry 800+ protectors, since the default order isn't grouped by model.
    const protectorDocs: Doc<"products">[] = [];
    let protectorCursor: string | null = null;
    let protectorIsDone = false;
    while (!protectorIsDone) {
      const protectorPage: FunctionReturnType<typeof api.products.list> = await fetchQuery(api.products.list, {
        brand: product.brand,
        category: "protectors",
        paginationOpts: { numItems: 200, cursor: protectorCursor },
      });
      protectorDocs.push(...protectorPage.page);
      protectorIsDone = protectorPage.isDone;
      protectorCursor = protectorPage.continueCursor;
    }

    if (protectorDocs.length > 0) {
      const protectors = protectorDocs.map(toProduct);

      // A protector's model must match the case's model *exactly* (same
      // word set) — not just contain it. Otherwise a plain "S26" case
      // would also match "S26 Ultra" protectors, since "S26 Ultra"
      // trivially contains the substring "s26". Check both the model
      // field and the full name (whichever parses into a clean model),
      // since scraped data sometimes has the real model only in one of
      // the two.
      function modelWordSet(raw: string): Set<string> | null {
        const cleaned = cleanModelName(raw, product.brand);
        if (!cleaned) return null;
        const words = cleaned
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 0 && w !== "5g" && w !== "4g");
        return words.length > 0 ? new Set(words) : null;
      }

      function sameModel(words: Set<string> | null): boolean {
        if (!words || words.size !== caseWords.size) return false;
        for (const w of words) if (!caseWords.has(w)) return false;
        return true;
      }

      // Combined multi-model protectors ("... Honor 600 / 600 Pro ...")
      // carry only one value in `model`, so also try every slash-separated
      // segment of the name as a standalone model mention. Word-set equality
      // keeps this precise: a segment like "600 Pro" matches the 600 Pro
      // case but a plain "600" case only matches the "Honor 600" segment.
      function segmentMatchesModel(name: string): boolean {
        const brandWord = product.brand.toLowerCase();
        return name.split("/").some((seg) => {
          const words = seg
            .split(" - ")[0]
            .toLowerCase()
            .split(/\s+/)
            .filter(
              (w) =>
                w.length > 0 && w !== brandWord && w !== "galaxy" && w !== "5g" && w !== "4g"
            );
          if (words.length === 0 || words.length !== caseWords.size) return false;
          return words.every((w) => caseWords.has(w));
        });
      }

      const compatible = protectors.filter((p: any) => {
        return (
          sameModel(modelWordSet(p.model || "")) ||
          sameModel(modelWordSet(p.name)) ||
          segmentMatchesModel(p.name)
        );
      });

      // Defense in depth: two protector listings that differ only by a
      // "5G"/"4G" token (or trailing punctuation) are the same physical
      // item — only offer one of them as a bundle option.
      const seen = new Set<string>();
      const deduped: Product[] = [];
      for (const p of compatible) {
        const key = p.name
          .toLowerCase()
          .replace(/\b[45]g\b/gi, " ")
          .replace(/[^\p{L}\p{N}\s]/gu, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(p);
      }

      return deduped.slice(0, 10);
    }
  }

  return [];
}

export async function getSimilarProducts(product: Product, limit = 8): Promise<Product[]> {
  const docs = await fetchQuery(api.products.getSimilar, {
    sourceId: product.id,
    category: product.category,
    brand: product.brand,
    model: product.model,
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
  maxPrice?: number;
  cursor?: string | null;
  numItems?: number;
  jumpToLastPage?: boolean;
}

export interface FilterResult {
  products: Product[];
  totalCount: number | null;
  isDone: boolean;
  continueCursor: string;
}

const VALID_SORTS = new Set(["featured", "price-asc", "price-desc", "newest"]);

export async function filterProducts(opts: FilterOptions): Promise<FilterResult> {
  const sort = opts.sort && VALID_SORTS.has(opts.sort)
    ? (opts.sort as "featured" | "price-asc" | "price-desc" | "newest")
    : undefined;
  const result = await fetchQuery(api.products.list, {
    brand: opts.brand && opts.brand !== "all" ? opts.brand : undefined,
    category: opts.category && opts.category !== "all" ? opts.category : undefined,
    sort,
    q: opts.q || undefined,
    scale: opts.scale && opts.scale !== "all" ? opts.scale : undefined,
    model: opts.model && opts.model !== "all" ? opts.model : undefined,
    maxPrice: opts.maxPrice || undefined,
    paginationOpts: {
      numItems: opts.numItems ?? 24,
      cursor: opts.cursor ?? null,
    },
    jumpToLastPage: opts.jumpToLastPage || undefined,
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
