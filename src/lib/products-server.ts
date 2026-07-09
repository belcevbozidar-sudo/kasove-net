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

export async function getBundleProduct(product: Product): Promise<Product | undefined> {
  // 1. If manual bundleWith is set, use it
  if (product.bundleWith) {
    const doc = await fetchQuery(api.products.getBySourceId, { sourceId: product.bundleWith });
    if (doc) return toProduct(doc);
  }

  // 2. Otherwise, if it is a case category, search for a protector for the same brand and model
  const caseCategories = new Set([
    "leather-cases",
    "silicone-cases",
    "hard-cases"
  ]);

  if (caseCategories.has(product.category) && product.model) {
    const result = await fetchQuery(api.products.list, {
      brand: product.brand,
      category: "protectors",
      model: product.model,
      paginationOpts: {
        numItems: 1,
        cursor: null
      }
    });

    if (result.page && result.page.length > 0) {
      return toProduct(result.page[0]);
    }
  }

  return undefined;
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
