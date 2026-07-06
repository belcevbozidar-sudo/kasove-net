import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Doc } from "./_generated/dataModel";

const SORTS = v.optional(
  v.union(v.literal("featured"), v.literal("price-asc"), v.literal("price-desc"), v.literal("rating"))
);

function facetKey(category?: string, brand?: string) {
  return `${category ?? "all"}|${brand ?? "all"}`;
}

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const getBySourceId = query({
  args: { sourceId: v.string() },
  handler: async (ctx, { sourceId }) => {
    return await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .unique();
  },
});

export const getFacetCount = query({
  args: { category: v.optional(v.string()), brand: v.optional(v.string()) },
  handler: async (ctx, { category, brand }) => {
    const row = await ctx.db
      .query("facetCounts")
      .withIndex("by_key", (q) => q.eq("key", facetKey(category, brand)))
      .unique();
    return row?.count ?? null;
  },
});

export const list = query({
  args: {
    category: v.optional(v.string()),
    brand: v.optional(v.string()),
    sort: SORTS,
    q: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { category, brand, sort, q, paginationOpts }) => {
    // Free-text search takes priority; relevance-ranked, no custom sort.
    if (q && q.trim()) {
      let searchQuery = ctx.db
        .query("products")
        .withSearchIndex("search_name", (query) => {
          let sq = query.search("name", q.trim());
          if (category) sq = sq.eq("category", category);
          if (brand) sq = sq.eq("brand", brand);
          return sq;
        });
      const result = await searchQuery.paginate(paginationOpts);
      return { ...result, totalCount: null as number | null };
    }

    const totalCount = await (async () => {
      const row = await ctx.db
        .query("facetCounts")
        .withIndex("by_key", (qq) => qq.eq("key", facetKey(category, brand)))
        .unique();
      return row?.count ?? null;
    })();

    const order = sort === "price-desc" || sort === "rating" ? "desc" : "asc";

    if (category && brand) {
      // Combined filter: narrow via the compound equality index, then sort
      // in-memory. These combos are always a small slice of the catalog
      // (a single brand within a single category), so this stays cheap.
      if (!sort || sort === "featured") {
        const result = await ctx.db
          .query("products")
          .withIndex("by_brand_category", (qq) => qq.eq("brand", brand).eq("category", category))
          .paginate(paginationOpts);
        return { ...result, totalCount };
      }
      const all = await ctx.db
        .query("products")
        .withIndex("by_brand_category", (qq) => qq.eq("brand", brand).eq("category", category))
        .collect();
      return paginateInMemory(all, sort, paginationOpts);
    }

    if (category) {
      if (!sort || sort === "featured") {
        const result = await ctx.db
          .query("products")
          .withIndex("by_category", (qq) => qq.eq("category", category))
          .paginate(paginationOpts);
        return { ...result, totalCount };
      }
      const indexName = sort === "rating" ? "by_category_rating" : "by_category_price";
      const result = await ctx.db
        .query("products")
        .withIndex(indexName, (qq) => qq.eq("category", category))
        .order(order)
        .paginate(paginationOpts);
      return { ...result, totalCount };
    }

    if (brand) {
      if (!sort || sort === "featured") {
        const result = await ctx.db
          .query("products")
          .withIndex("by_brand", (qq) => qq.eq("brand", brand))
          .paginate(paginationOpts);
        return { ...result, totalCount };
      }
      const indexName = sort === "rating" ? "by_brand_rating" : "by_brand_price";
      const result = await ctx.db
        .query("products")
        .withIndex(indexName, (qq) => qq.eq("brand", brand))
        .order(order)
        .paginate(paginationOpts);
      return { ...result, totalCount };
    }

    // No filters at all.
    if (!sort || sort === "featured") {
      const result = await ctx.db.query("products").paginate(paginationOpts);
      return { ...result, totalCount };
    }
    const indexName = sort === "rating" ? "by_rating" : "by_price";
    const result = await ctx.db
      .query("products")
      .withIndex(indexName)
      .order(order)
      .paginate(paginationOpts);
    return { ...result, totalCount };
  },
});

function paginateInMemory(
  all: Doc<"products">[],
  sort: "price-asc" | "price-desc" | "rating",
  paginationOpts: { numItems: number; cursor: string | null }
) {
  const sorted = [...all].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return b.rating - a.rating;
  });
  const start = paginationOpts.cursor ? parseInt(paginationOpts.cursor, 10) : 0;
  const end = start + paginationOpts.numItems;
  const page = sorted.slice(start, end);
  const isDone = end >= sorted.length;
  return {
    page,
    isDone,
    continueCursor: isDone ? "" : String(end),
    totalCount: sorted.length,
  };
}

export const getBestSellers = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const results = await ctx.db
      .query("products")
      .withIndex("by_hasOldPrice", (q) => q.eq("hasOldPrice", true))
      .take(limit);
    if (results.length > 0) return results;
    return await ctx.db.query("products").withIndex("by_rating").order("desc").take(limit);
  },
});

export const getNewArrivals = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    return await ctx.db.query("products").order("asc").take(limit);
  },
});

export const getRelated = query({
  args: { sourceId: v.string(), category: v.string(), brand: v.string(), limit: v.number() },
  handler: async (ctx, { sourceId, category, brand, limit }) => {
    const byBrand = await ctx.db
      .query("products")
      .withIndex("by_brand", (q) => q.eq("brand", brand))
      .take(limit + 1);
    const byCategory = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", category))
      .take(limit + 1);

    const seen = new Set<string>();
    const merged: Doc<"products">[] = [];
    for (const p of [...byBrand, ...byCategory]) {
      if (p.sourceId === sourceId || seen.has(p.sourceId)) continue;
      seen.add(p.sourceId);
      merged.push(p);
      if (merged.length >= limit) break;
    }
    return merged;
  },
});
