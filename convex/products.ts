import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { assertAdmin } from "./adminAuth";

const SORTS = v.optional(
  v.union(
    v.literal("featured"),
    v.literal("price-asc"),
    v.literal("price-desc"),
    v.literal("newest")
  )
);

function facetKey(category?: string, brand?: string) {
  return `${category ?? "all"}|${brand ?? "all"}`;
}

function getModelVariations(model: string, brand: string): string[] {
  const variations = new Set<string>();
  variations.add(model);
  
  const brandCapitalized = brand.charAt(0).toUpperCase() + brand.slice(1);
  const brandRegex = new RegExp(`^${brand}\\s+`, "i");
  let cleanModel = model.replace(brandRegex, "");
  
  cleanModel = cleanModel.replace(/^galaxy\s+/i, "");
  // A "4G"/"5G" connectivity suffix isn't a distinct model for case-fitting
  // purposes — strip it so "S24 Ultra" and "S24 Ultra 5G" match each other.
  cleanModel = cleanModel.replace(/\b[45]g\b/gi, "").replace(/\s+/g, " ").trim();

  variations.add(cleanModel);
  variations.add(`${brandCapitalized} ${cleanModel}`);
  variations.add(`${brandCapitalized} Galaxy ${cleanModel}`);
  variations.add(`Galaxy ${cleanModel}`);
  
  return Array.from(variations).filter(v => v.length > 0);
}

// Combined multi-model products ("... Honor 600 / 600 Pro ...") carry only
// one value in `model`, so an exact model-index lookup misses them for the
// other model(s) they fit. This checks whether any slash-separated segment
// of the NAME mentions exactly the requested model (word-set equality, so a
// "600 Pro" filter doesn't match a plain "600" segment or vice versa).
function nameSegmentMatchesModel(name: string, model: string, brand: string): boolean {
  const brandWord = brand.toLowerCase();
  const targetWords = model
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0 && w !== brandWord && w !== "galaxy" && w !== "5g" && w !== "4g");
  const target = new Set(targetWords);
  if (target.size === 0) return false;
  return name.split("/").some((seg) => {
    const words = seg
      .split(" - ")[0]
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0 && w !== brandWord && w !== "galaxy" && w !== "5g" && w !== "4g");
    if (words.length !== target.size) return false;
    return words.every((w) => target.has(w));
  });
}

// Recognizes a query like "KP-100042", "kp100042" or just "100042" as an
// article-number lookup (as opposed to a normal free-text name search), and
// returns matching products by SKU prefix — or null if `q` doesn't look like
// a SKU at all, so callers can fall back to the regular name search.
async function trySkuSearch(
  ctx: { db: any },
  q: string,
  category: string | undefined,
  brand: string | undefined
): Promise<Doc<"products">[] | null> {
  const trimmed = q.trim().toUpperCase().replace(/\s+/g, "");
  const match = trimmed.match(/^(?:KP-?)?(\d{2,6})$/);
  if (!match) return null;

  const prefix = `KP-${match[1]}`;
  const candidates = await ctx.db
    .query("products")
    .withIndex("by_sku", (qq: any) => qq.gte("sku", prefix))
    .take(25);
  const matches = candidates.filter(
    (p: Doc<"products">) =>
      p.sku &&
      p.sku.startsWith(prefix) &&
      (!category || p.category === category) &&
      (!brand || p.brand === brand)
  );
  return matches;
}

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    // .first() rather than .unique(): historic imports left a handful of
    // duplicate slugs in the table, and .unique() turns each of those product
    // pages into a 500 for visitors. Serving the oldest match keeps the page
    // up; the duplicates themselves get repaired by scripts/fix-duplicate-slugs.
    return await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

export const getBySourceId = query({
  args: { sourceId: v.string() },
  handler: async (ctx, { sourceId }) => {
    // .first() for the same reason as getBySlug above.
    return await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .first();
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
    scale: v.optional(v.string()),
    model: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
    // Numbered pagination ("1 2 ... N") needs the true LAST page without
    // walking every page in between — infeasible with Convex's opaque
    // forward-only cursors at 35k+ rows. Instead, when this is set, every
    // indexed branch below fetches from the *opposite* end of its index
    // (order flipped, `.take(numItems)`) and reverses the result — which is
    // exactly the last page's contents, at the same O(numItems) cost as any
    // other page, regardless of how many pages exist. Ignored for full-text
    // search, which has no stable index to reverse and no known total.
    jumpToLastPage: v.optional(v.boolean()),
  },
  handler: async (ctx, { category, brand, sort, q, scale, model, maxPrice, paginationOpts, jumpToLastPage }) => {
    // If scale, model or maxPrice is specified, filter in-memory
    if ((scale && scale !== "all") || (model && model !== "all") || maxPrice !== undefined) {
      const scaleNum = scale ? (scale.includes("-") ? scale.split("-")[1] : scale.includes(":") ? scale.split(":")[1] : scale) : null;
      const matchesScale = (name: string) => {
        if (!scaleNum) return true;
        return name.includes(`1:${scaleNum}`) || name.includes(`1/${scaleNum}`) || name.includes(`1-${scaleNum}`);
      };

      const matchesPrice = (p: Doc<"products">) => {
        if (maxPrice === undefined) return true;
        return p.price <= maxPrice;
      };

      let products: Doc<"products">[] = [];
      if (q && q.trim()) {
        const skuMatches = await trySkuSearch(ctx, q, category, brand);
        if (skuMatches) {
          products = skuMatches;
        } else {
          const searchResults = await ctx.db
            .query("products")
            .withSearchIndex("search_name", (query) => {
              let sq = query.search("name", q.trim());
              if (category) sq = sq.eq("category", category);
              if (brand) sq = sq.eq("brand", brand);
              return sq;
            })
            .take(1000);
          products = searchResults;
        }
      } else if (brand && model && model !== "all") {
        const variations = getModelVariations(model, brand);
        const allModelProducts = [];
        const seenIds = new Set<string>();
        
        for (const variant of variations) {
          const docs = await ctx.db
            .query("products")
            .withIndex("by_brand_model", (qq) => qq.eq("brand", brand).eq("model", variant))
            .collect();
          for (const doc of docs) {
            if (!seenIds.has(doc._id)) {
              seenIds.add(doc._id);
              allModelProducts.push(doc);
            }
          }
        }
        // Combined multi-model products live under a different `model` value —
        // find them by name and filter to exact slash-segment mentions.
        const nameCandidates = await ctx.db
          .query("products")
          .withSearchIndex("search_name", (sq) => sq.search("name", model).eq("brand", brand))
          .take(200);
        for (const doc of nameCandidates) {
          if (!seenIds.has(doc._id) && nameSegmentMatchesModel(doc.name, model, brand)) {
            seenIds.add(doc._id);
            allModelProducts.push(doc);
          }
        }
        products = category ? allModelProducts.filter((p) => p.category === category) : allModelProducts;
      } else if (model && model !== "all") {
        const variations = getModelVariations(model, brand || "universal");
        const allModelProducts = [];
        const seenIds = new Set<string>();
        
        for (const variant of variations) {
          const docs = await ctx.db
            .query("products")
            .withIndex("by_model", (qq) => qq.eq("model", variant))
            .collect();
          for (const doc of docs) {
            if (!seenIds.has(doc._id)) {
              seenIds.add(doc._id);
              allModelProducts.push(doc);
            }
          }
        }
        // Combined multi-model products live under a different `model` value —
        // find them by name and filter to exact slash-segment mentions.
        const nameCandidates = await ctx.db
          .query("products")
          .withSearchIndex("search_name", (sq) => sq.search("name", model))
          .take(200);
        for (const doc of nameCandidates) {
          if (!seenIds.has(doc._id) && nameSegmentMatchesModel(doc.name, model, doc.brand)) {
            seenIds.add(doc._id);
            allModelProducts.push(doc);
          }
        }
        products = category ? allModelProducts.filter((p) => p.category === category) : allModelProducts;
      } else if (category && brand) {
        products = await ctx.db
          .query("products")
          .withIndex("by_brand_category", (qq) => qq.eq("brand", brand).eq("category", category))
          .collect();
      } else if (category) {
        if (maxPrice !== undefined) {
          products = await ctx.db
            .query("products")
            .withIndex("by_category_price", (qq) => qq.eq("category", category).lte("price", maxPrice))
            .collect();
        } else {
          products = await ctx.db
            .query("products")
            .withIndex("by_category", (qq) => qq.eq("category", category))
            .collect();
        }
      } else if (brand) {
        if (maxPrice !== undefined) {
          products = await ctx.db
            .query("products")
            .withIndex("by_brand_price", (qq) => qq.eq("brand", brand).lte("price", maxPrice))
            .collect();
        } else {
          products = await ctx.db
            .query("products")
            .withIndex("by_brand", (qq) => qq.eq("brand", brand))
            .collect();
        }
      } else {
        if (maxPrice !== undefined) {
          products = await ctx.db
            .query("products")
            .withIndex("by_price", (qq) => qq.lte("price", maxPrice))
            .collect();
        } else {
          products = await ctx.db.query("products").collect();
        }
      }

      // No matchesModel(p) re-filter here: by the time we reach this line,
      // `products` was already built either (a) with brand and/or bare
      // model already applied via getModelVariations + nameSegmentMatchesModel
      // above — a much more complete match than a crude substring check could
      // repeat — or (b) with no model filter requested at all (model is
      // falsy/"all"). A crude "p.model === model || name.includes(model)"
      // re-check used to sit here and actively DROPPED valid matches whenever
      // the caller passed a model string containing the brand name (e.g.
      // "Samsung S23 Ultra") against products named "... Samsung Galaxy S23
      // Ultra ...", since "Galaxy" breaks the substring check even though the
      // product is the exact right model.
      const filtered = products.filter((p) => matchesScale(p.name) && matchesPrice(p));

      const sorted = [...filtered].sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        return b._creationTime - a._creationTime;
      });


      // This branch already sorts the whole filtered set into a plain array
      // and pages it by numeric offset, so "last page" is just arithmetic —
      // no separate reversed fetch needed here, unlike the indexed branches.
      const start = jumpToLastPage
        ? Math.max(0, sorted.length - (sorted.length % paginationOpts.numItems || paginationOpts.numItems))
        : paginationOpts.cursor
        ? parseInt(paginationOpts.cursor, 10)
        : 0;
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

    // Free-text search takes priority; relevance-ranked, no custom sort.
    if (q && q.trim()) {
      const skuMatches = await trySkuSearch(ctx, q, category, brand);
      if (skuMatches) {
        return {
          page: skuMatches.slice(0, paginationOpts.numItems),
          isDone: true,
          continueCursor: "",
          totalCount: skuMatches.length as number | null,
        };
      }
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

    const order = sort === "price-desc" ? "desc" : "asc";

    // Fetches the true last page of an already-index-filtered query by
    // reading from the opposite end (order flipped) and reversing the
    // result — same O(numItems) cost as a normal page, at any table size.
    async function lastPageFrom(baseQuery: any, forwardOrder: "asc" | "desc") {
      const reverseOrder = forwardOrder === "asc" ? "desc" : "asc";
      const rows = await baseQuery.order(reverseOrder).take(paginationOpts.numItems);
      return { page: rows.reverse(), isDone: true, continueCursor: "", totalCount };
    }

    if (category && brand) {
      // Combined filter: narrow via the compound equality index, then sort
      // in-memory. These combos are always a small slice of the catalog
      // (a single brand within a single category), so this stays cheap.
      if (!sort || sort === "featured") {
        const base = ctx.db
          .query("products")
          .withIndex("by_brand_category", (qq) => qq.eq("brand", brand).eq("category", category));
        if (jumpToLastPage) return lastPageFrom(base, "asc");
        const result = await base.paginate(paginationOpts);
        return { ...result, totalCount };
      }
      const all = await ctx.db
        .query("products")
        .withIndex("by_brand_category", (qq) => qq.eq("brand", brand).eq("category", category))
        .collect();
      return paginateInMemory(all, sort, paginationOpts, jumpToLastPage);
    }

    if (category) {
      if (!sort || sort === "featured") {
        const base = ctx.db.query("products").withIndex("by_category", (qq) => qq.eq("category", category));
        if (jumpToLastPage) return lastPageFrom(base, "asc");
        const result = await base.paginate(paginationOpts);
        return { ...result, totalCount };
      }
      if (sort === "newest") {
        const base = ctx.db.query("products").withIndex("by_category", (qq) => qq.eq("category", category));
        if (jumpToLastPage) return lastPageFrom(base, "desc");
        const result = await base.order("desc").paginate(paginationOpts);
        return { ...result, totalCount };
      }
      const base = ctx.db.query("products").withIndex("by_category_price", (qq) => qq.eq("category", category));
      if (jumpToLastPage) return lastPageFrom(base, order);
      const result = await base.order(order).paginate(paginationOpts);
      return { ...result, totalCount };
    }

    if (brand) {
      if (!sort || sort === "featured") {
        const base = ctx.db.query("products").withIndex("by_brand", (qq) => qq.eq("brand", brand));
        if (jumpToLastPage) return lastPageFrom(base, "asc");
        const result = await base.paginate(paginationOpts);
        return { ...result, totalCount };
      }
      if (sort === "newest") {
        const base = ctx.db.query("products").withIndex("by_brand", (qq) => qq.eq("brand", brand));
        if (jumpToLastPage) return lastPageFrom(base, "desc");
        const result = await base.order("desc").paginate(paginationOpts);
        return { ...result, totalCount };
      }
      const base = ctx.db.query("products").withIndex("by_brand_price", (qq) => qq.eq("brand", brand));
      if (jumpToLastPage) return lastPageFrom(base, order);
      const result = await base.order(order).paginate(paginationOpts);
      return { ...result, totalCount };
    }

    // No filters at all.
    if (!sort || sort === "featured") {
      const base = ctx.db.query("products");
      if (jumpToLastPage) return lastPageFrom(base, "asc");
      const result = await base.paginate(paginationOpts);
      return { ...result, totalCount };
    }
    if (sort === "newest") {
      const base = ctx.db.query("products");
      if (jumpToLastPage) return lastPageFrom(base, "desc");
      const result = await base.order("desc").paginate(paginationOpts);
      return { ...result, totalCount };
    }
    const base = ctx.db.query("products").withIndex("by_price");
    if (jumpToLastPage) return lastPageFrom(base, order);
    const result = await base.order(order).paginate(paginationOpts);
    return { ...result, totalCount };
  },
});

function paginateInMemory(
  all: Doc<"products">[],
  sort: "price-asc" | "price-desc" | "newest",
  paginationOpts: { numItems: number; cursor: string | null },
  jumpToLastPage?: boolean
) {
  const sorted = [...all].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return b._creationTime - a._creationTime;
  });
  const start = jumpToLastPage
    ? Math.max(0, sorted.length - (sorted.length % paginationOpts.numItems || paginationOpts.numItems))
    : paginationOpts.cursor
    ? parseInt(paginationOpts.cursor, 10)
    : 0;
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
    return await ctx.db.query("products").order("desc").take(limit);
  },
});

export const getNewArrivals = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    return await ctx.db.query("products").order("desc").take(limit);
  },
});

// "Similar products" — strictly the same brand + phone model + accessory
// category as the current product (e.g. other cases for the same iPhone 15),
// not a generic same-brand-or-category cross-sell. Returns fewer than
// `limit` rather than padding with unrelated models.
export const getSimilar = query({
  args: { sourceId: v.string(), category: v.string(), brand: v.string(), model: v.string(), limit: v.number() },
  handler: async (ctx, { sourceId, category, brand, model, limit }) => {
    if (!model) return [];
    // Same brand + model can be stored under slightly different `model`
    // spellings ("Samsung S23 Ultra" vs "Samsung Galaxy S23 Ultra") depending
    // on which import batch a product came from — an exact eq() match on the
    // raw field silently hides real matches. Use the same variant expansion
    // the shop's own model filter relies on, so "similar products" sees
    // everything the shop listing for this model would.
    const variations = getModelVariations(model, brand);
    const seenIds = new Set<string>();
    const matches: Doc<"products">[] = [];
    for (const variant of variations) {
      const docs = await ctx.db
        .query("products")
        .withIndex("by_brand_model", (q) => q.eq("brand", brand).eq("model", variant))
        .collect();
      for (const doc of docs) {
        if (doc.sourceId !== sourceId && doc.category === category && !seenIds.has(doc._id)) {
          seenIds.add(doc._id);
          matches.push(doc);
        }
      }
    }
    // Combined multi-model products ("... Honor 600 / 600 Pro ...") carry
    // only one value in `model` — pick them up by name segment too.
    const nameCandidates = await ctx.db
      .query("products")
      .withSearchIndex("search_name", (sq) => sq.search("name", model).eq("brand", brand))
      .take(200);
    for (const doc of nameCandidates) {
      if (
        doc.sourceId !== sourceId &&
        doc.category === category &&
        !seenIds.has(doc._id) &&
        nameSegmentMatchesModel(doc.name, model, brand)
      ) {
        seenIds.add(doc._id);
        matches.push(doc);
      }
    }
    return matches.slice(0, limit);
  },
});

// Distinct product categories that actually have stock for a given
// brand+model, used by the shop sidebar so the "Тип продукт" filter only
// ever lists types that exist for the phone currently selected — never a
// dead-end category with zero matching products.
export const getAvailableCategories = query({
  args: { brand: v.optional(v.string()), model: v.string() },
  handler: async (ctx, { brand, model }) => {
    const variations = getModelVariations(model, brand || "universal");
    const seenIds = new Set<string>();
    const categories = new Set<string>();

    for (const variant of variations) {
      const docs = brand
        ? await ctx.db
            .query("products")
            .withIndex("by_brand_model", (qq) => qq.eq("brand", brand).eq("model", variant))
            .collect()
        : await ctx.db
            .query("products")
            .withIndex("by_model", (qq) => qq.eq("model", variant))
            .collect();
      for (const doc of docs) {
        if (!seenIds.has(doc._id)) {
          seenIds.add(doc._id);
          categories.add(doc.category);
        }
      }
    }

    // Combined multi-model products ("... Honor 600 / 600 Pro ...") live
    // under a different `model` value — pick them up by name segment too,
    // same as the main product list query.
    const nameCandidates = await ctx.db
      .query("products")
      .withSearchIndex("search_name", (sq) => {
        let q = sq.search("name", model);
        if (brand) q = q.eq("brand", brand);
        return q;
      })
      .take(200);
    for (const doc of nameCandidates) {
      if (!seenIds.has(doc._id) && nameSegmentMatchesModel(doc.name, model, doc.brand)) {
        seenIds.add(doc._id);
        categories.add(doc.category);
      }
    }

    return Array.from(categories);
  },
});

export const getModels = query({
  args: { brand: v.string() },
  handler: async (ctx, { brand }) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_brand", (q) => q.eq("brand", brand))
      .collect();

    // Normalize before dedup so "Galaxy S24" / "S24" and case-only variants
    // like "Redmi Go" / "Redmi GO" collapse to a single entry.
    const brandRegex = new RegExp(`^${brand}\\s+`, "i");
    const modelsByKey = new Map<string, string>();
    for (const p of products) {
      if (!p.model || p.model === "Универсален" || !p.model.trim()) continue;
      let cleaned = p.model
        .trim()
        .replace(brandRegex, "")
        .replace(/\bgalaxy\b\s*/gi, "")
        .replace(/\b[45]g\b/gi, "");
      cleaned = cleaned.replace(/\s+/g, " ").trim();
      if (!cleaned) continue;
      const key = cleaned.toLowerCase();
      if (!modelsByKey.has(key)) modelsByKey.set(key, cleaned);
    }

    return Array.from(modelsByKey.values()).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" })
    );
  },
});

export const recategorizeBySourceId = mutation({
  args: {
    adminSecret: v.string(),
    updates: v.array(v.object({ sourceId: v.string(), category: v.string() })),
  },
  handler: async (ctx, { adminSecret, updates }) => {
    assertAdmin(adminSecret);
    let updatedCount = 0;
    let notFoundCount = 0;
    for (const { sourceId, category } of updates) {
      const doc = await ctx.db
        .query("products")
        .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
        .unique();
      if (!doc) {
        notFoundCount++;
        continue;
      }
      if (doc.category !== category) {
        await ctx.db.patch(doc._id, { category });
        updatedCount++;
      }
    }
    return { updatedCount, notFoundCount, processedCount: updates.length };
  },
});

export const insertProducts = mutation({
  args: {
    adminSecret: v.string(),
    products: v.array(
      v.object({
        sourceId: v.string(),
        slug: v.string(),
        name: v.string(),
        brand: v.string(),
        model: v.string(),
        category: v.string(),
        price: v.number(),
        oldPrice: v.optional(v.number()),
        hasOldPrice: v.boolean(),
        image: v.string(),
        gallery: v.array(v.string()),
        rating: v.number(),
        reviewCount: v.number(),
        description: v.string(),
        features: v.array(v.string()),
        inStock: v.optional(v.boolean()),
        sku: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { adminSecret, products }) => {
    assertAdmin(adminSecret);
    let insertedCount = 0;
    let skippedCount = 0;
    for (const p of products) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_sourceId", (q) => q.eq("sourceId", p.sourceId))
        .unique();
      if (existing) {
        skippedCount++;
        continue;
      }
      await ctx.db.insert("products", p);
      insertedCount++;
    }
    return { insertedCount, skippedCount, processedCount: products.length };
  },
});

export const cleanAllProductImages = mutation({
  args: { adminSecret: v.string(), cursor: v.optional(v.string()), limit: v.number() },
  handler: async (ctx, { adminSecret, cursor, limit }) => {
    assertAdmin(adminSecret);
    const cleanUrl = (url: string) => {
      return url.replace(/\/styles\/[^\/]+\/public\//, "/");
    };

    const page = await ctx.db
      .query("products")
      .paginate({
        numItems: limit,
        cursor: cursor ?? null,
      });

    let updatedCount = 0;
    for (const doc of page.page) {
      const cleanedImage = cleanUrl(doc.image);
      const cleanedGallery = doc.gallery.map(cleanUrl);

      const needsUpdate =
        cleanedImage !== doc.image ||
        cleanedGallery.some((img, idx) => img !== doc.gallery[idx]);

      if (needsUpdate) {
        await ctx.db.patch(doc._id, {
          image: cleanedImage,
          gallery: cleanedGallery,
        });
        updatedCount++;
      }
    }

    return {
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      updatedCount,
      processedCount: page.page.length,
    };
  },
});

// Transliterate Cyrillic to Latin and create clean URL slugs
function slugify(text: string): string {
  const cyrillicToLatin: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
    'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh', 'З': 'Z',
    'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
    'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': 'Y', 'Ю': 'Yu', 'Я': 'Ya'
  };

  let translated = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    translated += cyrillicToLatin[char] || char;
  }

  return translated
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Adjust precomputed facet counts for listing pages
async function adjustFacetCount(db: any, category: string, brand: string, amount: number) {
  const keys = [
    "all|all",
    `${category}|all`,
    `all|${brand}`,
    `${category}|${brand}`
  ];
  for (const key of keys) {
    const existing = await db
      .query("facetCounts")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .unique();
    if (existing) {
      const newCount = Math.max(0, existing.count + amount);
      await db.patch(existing._id, { count: newCount });
    } else if (amount > 0) {
      await db.insert("facetCounts", { key, count: amount });
    }
  }
}

export const getLockout = query({
  args: { adminSecret: v.string(), ip: v.string() },
  handler: async (ctx, { adminSecret, ip }) => {
    assertAdmin(adminSecret);
    const attempt = await ctx.db
      .query("loginAttempts")
      .withIndex("by_ip", (q) => q.eq("ip", ip))
      .unique();
    if (!attempt) return { locked: false, remainingAttempts: 3 };

    if (attempt.lockoutUntil && attempt.lockoutUntil > Date.now()) {
      return {
        locked: true,
        lockoutUntil: attempt.lockoutUntil,
        remainingAttempts: 0,
      };
    }

    return {
      locked: false,
      remainingAttempts: Math.max(0, 3 - attempt.attempts),
    };
  },
});

export const recordLoginFailure = mutation({
  args: { adminSecret: v.string(), ip: v.string() },
  handler: async (ctx, { adminSecret, ip }) => {
    assertAdmin(adminSecret);
    const attempt = await ctx.db
      .query("loginAttempts")
      .withIndex("by_ip", (q) => q.eq("ip", ip))
      .unique();

    const now = Date.now();
    if (attempt) {
      const isLockoutExpired = attempt.lockoutUntil && attempt.lockoutUntil <= now;
      const newAttempts = isLockoutExpired ? 1 : attempt.attempts + 1;
      const lockoutUntil = newAttempts >= 3 ? now + 60 * 60 * 1000 : undefined;

      await ctx.db.patch(attempt._id, {
        attempts: newAttempts,
        lockoutUntil,
      });

      return {
        attempts: newAttempts,
        locked: newAttempts >= 3,
        lockoutUntil,
      };
    } else {
      await ctx.db.insert("loginAttempts", {
        ip,
        attempts: 1,
      });
      return {
        attempts: 1,
        locked: false,
      };
    }
  },
});

export const resetLoginAttempts = mutation({
  args: { adminSecret: v.string(), ip: v.string() },
  handler: async (ctx, { adminSecret, ip }) => {
    assertAdmin(adminSecret);
    const attempt = await ctx.db
      .query("loginAttempts")
      .withIndex("by_ip", (q) => q.eq("ip", ip))
      .unique();
    if (attempt) {
      await ctx.db.patch(attempt._id, {
        attempts: 0,
        lockoutUntil: undefined,
      });
    }
  },
});

export const adminAddProduct = mutation({
  args: {
    adminSecret: v.string(),
    name: v.string(),
    brand: v.string(),
    model: v.string(),
    category: v.string(),
    price: v.number(),
    oldPrice: v.optional(v.number()),
    description: v.string(),
    gallery: v.array(v.string()),
    features: v.array(v.string()),
    badge: v.optional(v.string()),
    inStock: v.optional(v.boolean()),
    sku: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminSecret);
    let baseSlug = slugify(args.name);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const sourceId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const image = args.gallery[0] || "/images/placeholder.png";

    let sku = args.sku?.trim();
    if (!sku) {
      const last = await ctx.db.query("products").withIndex("by_sku").order("desc").first();
      const lastNum = last?.sku ? parseInt(last.sku.replace(/^KP-/, ""), 10) : 100000;
      sku = `KP-${(Number.isFinite(lastNum) ? lastNum : 100000) + 1}`;
    }

    const product = {
      sourceId,
      slug,
      name: args.name,
      brand: args.brand,
      model: args.model,
      category: args.category,
      price: args.price,
      oldPrice: args.oldPrice,
      hasOldPrice: !!args.oldPrice && args.oldPrice > args.price,
      image,
      gallery: args.gallery,
      rating: 0,
      reviewCount: 0,
      description: args.description,
      features: args.features,
      badge: args.badge,
      inStock: args.inStock ?? true,
      sku,
    };

    const id = await ctx.db.insert("products", product);
    await adjustFacetCount(ctx.db, args.category, args.brand, 1);
    return id;
  },
});

export const adminUpdateProduct = mutation({
  args: {
    adminSecret: v.string(),
    id: v.string(), // matches client-side 'id' which is sourceId
    name: v.string(),
    brand: v.string(),
    model: v.string(),
    category: v.string(),
    price: v.number(),
    oldPrice: v.optional(v.number()),
    description: v.string(),
    gallery: v.array(v.string()),
    features: v.array(v.string()),
    badge: v.optional(v.string()),
    inStock: v.optional(v.boolean()),
    sku: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminSecret);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", args.id))
      .unique();
    if (!existing) throw new Error("Product not found");

    let slug = existing.slug;
    if (existing.name !== args.name) {
      let baseSlug = slugify(args.name);
      slug = baseSlug;
      let counter = 1;
      while (true) {
        const dup = await ctx.db
          .query("products")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();
        if (!dup || dup._id === existing._id) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const image = args.gallery[0] || "/images/placeholder.png";
    const oldCategory = existing.category;
    const oldBrand = existing.brand;

    await ctx.db.patch(existing._id, {
      name: args.name,
      slug,
      brand: args.brand,
      model: args.model,
      category: args.category,
      price: args.price,
      oldPrice: args.oldPrice,
      hasOldPrice: !!args.oldPrice && args.oldPrice > args.price,
      image,
      gallery: args.gallery,
      description: args.description,
      features: args.features,
      badge: args.badge,
      inStock: args.inStock ?? true,
      sku: args.sku?.trim() || existing.sku,
    });

    if (oldCategory !== args.category || oldBrand !== args.brand) {
      await adjustFacetCount(ctx.db, oldCategory, oldBrand, -1);
      await adjustFacetCount(ctx.db, args.category, args.brand, 1);
    }
  },
});

// One-off data-migration helper (used by scripts/normalize-model-5g.js) —
// patches only the `model` field, so it can't touch slug/facets/price/etc.
export const adminSetModel = mutation({
  args: { adminSecret: v.string(), sourceId: v.string(), model: v.string() },
  handler: async (ctx, { adminSecret, sourceId, model }) => {
    assertAdmin(adminSecret);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .unique();
    if (!existing) return false;
    await ctx.db.patch(existing._id, { model });
    return true;
  },
});

// One-off data-migration helper (used by scripts/merge-5g-duplicates.js) —
// patches only `name`/`bundleWith`, for renaming a surviving canonical
// record and redirecting bundle references after a duplicate is deleted.
export const adminMigratePatchNameBundle = mutation({
  args: {
    adminSecret: v.string(),
    sourceId: v.string(),
    name: v.optional(v.string()),
    bundleWith: v.optional(v.string()),
  },
  handler: async (ctx, { adminSecret, sourceId, name, bundleWith }) => {
    assertAdmin(adminSecret);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .unique();
    if (!existing) return false;
    const patch: Record<string, unknown> = {};
    if (name !== undefined) patch.name = name;
    if (bundleWith !== undefined) patch.bundleWith = bundleWith;
    await ctx.db.patch(existing._id, patch);
    return true;
  },
});

// One-off data-migration helper (used by scripts/backfill-sku.js) — patches
// only the `sku` field, to assign article numbers to existing products.
export const adminSetSku = mutation({
  args: { adminSecret: v.string(), sourceId: v.string(), sku: v.string() },
  handler: async (ctx, { adminSecret, sourceId, sku }) => {
    assertAdmin(adminSecret);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .unique();
    if (!existing) return false;
    await ctx.db.patch(existing._id, { sku });
    return true;
  },
});

// One-off data-migration helper (used by scripts/fix-price-currency.js) —
// the imported catalog stored the original site's BGN price directly in the
// `price`/`oldPrice` fields, which the storefront treats as EUR and then
// multiplies by the BGN peg for display — inflating every shown price by
// ~95%. This patches just the two numeric fields to the corrected EUR value.
export const adminFixPriceUnits = mutation({
  args: { adminSecret: v.string(), sourceId: v.string(), price: v.number(), oldPrice: v.optional(v.number()) },
  handler: async (ctx, { adminSecret, sourceId, price, oldPrice }) => {
    assertAdmin(adminSecret);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .unique();
    if (!existing) return false;
    const patch: Record<string, unknown> = { price };
    if (oldPrice !== undefined) patch.oldPrice = oldPrice;
    await ctx.db.patch(existing._id, patch);
    return true;
  },
});

// One-off data-migration helper (used by scripts/apply-descriptions.js) —
// replaces the generic templated description with the real per-product text
// scraped from the business's original site (keisove.net, matched by
// sourceId = old article number / Drupal node ID).
export const adminSetDescription = mutation({
  args: { adminSecret: v.string(), sourceId: v.string(), description: v.string() },
  handler: async (ctx, { adminSecret, sourceId, description }) => {
    assertAdmin(adminSecret);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .unique();
    if (!existing) return false;
    await ctx.db.patch(existing._id, { description });
    return true;
  },
});

// One-off data-migration helper (used by scripts/dedupe-galleries.js) — the
// original catalog import wrote each product's gallery list twice
// ([A,B,C,A,B,C]), so nearly every product showed its photos duplicated.
// Dedupes in batches server-side (no files are touched — the duplicate
// entries reference the same storage URLs).
export const adminDedupeGalleries = mutation({
  args: { adminSecret: v.string(), cursor: v.union(v.null(), v.string()), limit: v.number() },
  handler: async (ctx, { adminSecret, cursor, limit }) => {
    assertAdmin(adminSecret);
    const page = await ctx.db
      .query("products")
      .paginate({ cursor, numItems: limit });
    let patched = 0;
    for (const p of page.page) {
      const gallery = p.gallery ?? [];
      const uniq = [...new Set(gallery)];
      if (uniq.length < gallery.length) {
        await ctx.db.patch(p._id, { gallery: uniq });
        patched++;
      }
    }
    return { patched, scanned: page.page.length, cursor: page.continueCursor, isDone: page.isDone };
  },
});

// Returns the next unused SKU (e.g. current highest "KP-100042" -> "KP-100043"),
// so both the admin "new product" form and the backfill script agree on one
// counter instead of guessing independently.
export const getNextSku = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, { adminSecret }) => {
    assertAdmin(adminSecret);
    const last = await ctx.db.query("products").withIndex("by_sku").order("desc").first();
    const lastNum = last?.sku ? parseInt(last.sku.replace(/^KP-/, ""), 10) : 100000;
    const nextNum = (Number.isFinite(lastNum) ? lastNum : 100000) + 1;
    return `KP-${nextNum}`;
  },
});

export const adminDeleteProduct = mutation({
  args: { adminSecret: v.string(), id: v.string() }, // matches client-side 'id' which is sourceId
  handler: async (ctx, { adminSecret, id }) => {
    assertAdmin(adminSecret);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", id))
      .unique();
    if (!existing) throw new Error("Product not found");

    await ctx.db.delete(existing._id);
    await adjustFacetCount(ctx.db, existing.category, existing.brand, -1);
  },
});

// Narrow category-only patch used by scripts/fix-orphan-categories.js to move
// products out of category values that aren't in the site's own category
// menu (src/lib/data.ts `categories`) — those products were otherwise
// unreachable via any category-based navigation, only via direct search.
export const adminSetCategory = mutation({
  args: { adminSecret: v.string(), sourceId: v.string(), category: v.string() },
  handler: async (ctx, { adminSecret, sourceId, category }) => {
    assertAdmin(adminSecret);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId))
      .first();
    if (!existing) return false;
    if (existing.category !== category) {
      await adjustFacetCount(ctx.db, existing.category, existing.brand, -1);
      await adjustFacetCount(ctx.db, category, existing.brand, 1);
      await ctx.db.patch(existing._id, { category });
    }
    return true;
  },
});

export const getManyBySlugs = query({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, { slugs }) => {
    const results = [];
    for (const slug of slugs) {
      const doc = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (doc) {
        results.push(doc);
      }
    }
    return results;
  },
});

export const listForMigration = query({
  args: { adminSecret: v.string(), cursor: v.union(v.null(), v.string()), limit: v.number() },
  handler: async (ctx, { adminSecret, cursor, limit }) => {
    assertAdmin(adminSecret);
    return await ctx.db
      .query("products")
      .paginate({ cursor, numItems: limit });
  },
});

// Narrow slug-only patch used by scripts/fix-duplicate-slugs.js — refuses to
// create a new collision, so it can only reduce the duplicate count.
export const adminSetSlug = mutation({
  args: { adminSecret: v.string(), id: v.id("products"), slug: v.string() },
  handler: async (ctx, { adminSecret, id, slug }) => {
    assertAdmin(adminSecret);
    const clash = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (clash && clash._id !== id) {
      throw new Error(`Slug already in use by ${clash._id}: ${slug}`);
    }
    await ctx.db.patch(id, { slug });
  },
});

export const updateProductImageUrls = mutation({
  args: {
    adminSecret: v.string(),
    id: v.id("products"),
    image: v.string(),
    gallery: v.array(v.string()),
  },
  handler: async (ctx, { adminSecret, id, image, gallery }) => {
    assertAdmin(adminSecret);
    await ctx.db.patch(id, { image, gallery });
  },
});

export const generateUploadUrl = mutation({
  args: { adminSecret: v.string() },
  handler: async (ctx, { adminSecret }) => {
    assertAdmin(adminSecret);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrlFromStorageId = query({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

export const getStoragePage = query({
  args: { adminSecret: v.string(), cursor: v.union(v.null(), v.string()), limit: v.number() },
  handler: async (ctx, { adminSecret, cursor, limit }) => {
    assertAdmin(adminSecret);
    const page = await ctx.db.system.query("_storage").paginate({ cursor, numItems: limit });
    return {
      isDone: page.isDone,
      continueCursor: page.continueCursor,
      items: page.page.map((f) => f.size),
    };
  },
});

export const getStorageAuditPage = query({
  args: { adminSecret: v.string(), cursor: v.union(v.null(), v.string()), limit: v.number() },
  handler: async (ctx, { adminSecret, cursor, limit }) => {
    assertAdmin(adminSecret);
    const page = await ctx.db.system.query("_storage").paginate({ cursor, numItems: limit });
    const items = [];
    for (const f of page.page) {
      items.push({
        id: f._id,
        url: await ctx.storage.getUrl(f._id),
        sha256: f.sha256,
        size: f.size,
        contentType: f.contentType,
      });
    }
    return { isDone: page.isDone, continueCursor: page.continueCursor, items };
  },
});

export const setFacetCounts = mutation({
  args: { adminSecret: v.string(), entries: v.array(v.object({ key: v.string(), count: v.number() })) },
  handler: async (ctx, { adminSecret, entries }) => {
    assertAdmin(adminSecret);
    for (const { key, count } of entries) {
      const existing = await ctx.db
        .query("facetCounts")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (existing) {
        if (existing.count !== count) await ctx.db.patch(existing._id, { count });
      } else {
        await ctx.db.insert("facetCounts", { key, count });
      }
    }
    return entries.length;
  },
});

export const listFacetCounts = query({
  args: { adminSecret: v.string() },
  handler: async (ctx, { adminSecret }) => {
    assertAdmin(adminSecret);
    return await ctx.db.query("facetCounts").collect();
  },
});

export const deleteStorageFiles = mutation({
  args: { adminSecret: v.string(), ids: v.array(v.id("_storage")) },
  handler: async (ctx, { adminSecret, ids }) => {
    assertAdmin(adminSecret);
    for (const id of ids) {
      await ctx.storage.delete(id);
    }
    return ids.length;
  },
});

export const getProductsPage = query({
  args: { adminSecret: v.string(), cursor: v.union(v.null(), v.string()), limit: v.number() },
  handler: async (ctx, { adminSecret, cursor, limit }) => {
    assertAdmin(adminSecret);
    const page = await ctx.db.query("products").paginate({ cursor, numItems: limit });
    return {
      isDone: page.isDone,
      continueCursor: page.continueCursor,
      items: page.page.map((p) => ({
        hasImage: !!p.image,
        galleryCount: p.gallery ? p.gallery.length : 0,
      })),
    };
  },
});

export const getProductImageDomains = query({
  args: { adminSecret: v.string(), cursor: v.union(v.null(), v.string()), limit: v.number() },
  handler: async (ctx, { adminSecret, cursor, limit }) => {
    assertAdmin(adminSecret);
    const page = await ctx.db.query("products").paginate({ cursor, numItems: limit });
    return {
      isDone: page.isDone,
      continueCursor: page.continueCursor,
      items: page.page.map((p) => {
        const isKeisoveMain = p.image ? p.image.includes("keisove.net") : false;
        const isConvexMain = p.image ? p.image.includes("convex.cloud") : false;
        
        let keisoveGalleryCount = 0;
        let convexGalleryCount = 0;
        if (p.gallery) {
          for (const img of p.gallery) {
            if (img.includes("keisove.net")) keisoveGalleryCount++;
            if (img.includes("convex.cloud")) convexGalleryCount++;
          }
        }
        
        return {
          isKeisoveMain,
          isConvexMain,
          keisoveGalleryCount,
          convexGalleryCount,
        };
      }),
    };
  },
});

