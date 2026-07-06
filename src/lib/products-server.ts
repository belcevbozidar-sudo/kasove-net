import "server-only";
import fs from "fs";
import path from "path";
import type { Product } from "./types";
import { brands, categories } from "./data";

let cachedProducts: Product[] = [];

function loadProducts(): Product[] {
  if (cachedProducts.length > 0) {
    return cachedProducts;
  }
  
  try {
    const filePath = path.join(process.cwd(), "src/lib/products.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      cachedProducts = JSON.parse(raw);
    } else {
      console.warn("products.json not found, using empty list");
      cachedProducts = [];
    }
  } catch (error) {
    console.error("Failed to load products.json:", error);
    cachedProducts = [];
  }
  
  return cachedProducts;
}

export function getAllProducts(): Product[] {
  return loadProducts();
}

export function getProductById(id: string): Product | undefined {
  return loadProducts().find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return loadProducts().find((p) => p.slug === slug);
}

export function getBundleProduct(product: Product): Product | undefined {
  if (!product.bundleWith) return undefined;
  return getProductById(product.bundleWith);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const all = loadProducts();
  return all
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.brand === product.brand || p.category === product.category)
    )
    .sort((a, b) => {
      const aScore = (a.brand === product.brand ? 2 : 0) + (a.category === product.category ? 1 : 0);
      const bScore = (b.brand === product.brand ? 2 : 0) + (b.category === product.category ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, limit);
}

export function getBestSellers(limit = 8): Product[] {
  const all = loadProducts();
  // Live products don't have static badges by default, so we can mock/generate badges or take highest rated
  const discounted = all.filter((p) => p.oldPrice !== undefined);
  if (discounted.length > 0) {
    return discounted.slice(0, limit);
  }
  return all.sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function getNewArrivals(limit = 8): Product[] {
  // Take latest scraped items (they are in reverse chronological order from нови-продукти!)
  return loadProducts().slice(0, limit);
}

export interface FilterOptions {
  brand?: string;
  category?: string;
  sort?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface FilterResult {
  products: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function filterProducts(opts: FilterOptions): FilterResult {
  let list = [...loadProducts()];
  
  if (opts.brand && opts.brand !== "all") {
    list = list.filter((p) => p.brand === opts.brand);
  }
  if (opts.category && opts.category !== "all") {
    list = list.filter((p) => p.category === opts.category);
  }
  if (opts.q) {
    const query = opts.q.toLowerCase();
    list = list.filter((p) =>
      [p.name, p.model, p.brand, p.category].some((field) => field.toLowerCase().includes(query))
    );
  }
  
  switch (opts.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      list.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break;
  }
  
  const totalCount = list.length;
  const page = opts.page || 1;
  const limit = opts.limit || 24;
  const totalPages = Math.ceil(totalCount / limit);
  
  const start = (page - 1) * limit;
  const paginatedList = list.slice(start, start + limit);
  
  return {
    products: paginatedList,
    totalCount,
    totalPages,
    currentPage: page
  };
}
