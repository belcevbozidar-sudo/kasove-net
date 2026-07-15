import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";

const SORTS = v.optional(
  v.union(v.literal("featured"), v.literal("price-asc"), v.literal("price-desc"), v.literal("rating"))
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
  cleanModel = cleanModel.trim();
  
  variations.add(cleanModel);
  variations.add(`${brandCapitalized} ${cleanModel}`);
  variations.add(`${brandCapitalized} Galaxy ${cleanModel}`);
  variations.add(`Galaxy ${cleanModel}`);
  
  return Array.from(variations).filter(v => v.length > 0);
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
    scale: v.optional(v.string()),
    model: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { category, brand, sort, q, scale, model, maxPrice, paginationOpts }) => {
    // If scale, model or maxPrice is specified, filter in-memory
    if ((scale && scale !== "all") || (model && model !== "all") || maxPrice !== undefined) {
      const scaleNum = scale ? (scale.includes("-") ? scale.split("-")[1] : scale.includes(":") ? scale.split(":")[1] : scale) : null;
      const matchesScale = (name: string) => {
        if (!scaleNum) return true;
        return name.includes(`1:${scaleNum}`) || name.includes(`1/${scaleNum}`) || name.includes(`1-${scaleNum}`);
      };

      const matchesModel = (p: Doc<"products">) => {
        if (!model || model === "all") return true;
        return (
          p.model === model ||
          p.name.toLowerCase().includes(model.toLowerCase())
        );
      };

      const matchesPrice = (p: Doc<"products">) => {
        if (maxPrice === undefined) return true;
        return p.price <= maxPrice;
      };

      let products: Doc<"products">[] = [];
      if (q && q.trim()) {
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

      const filtered = products.filter((p) => matchesScale(p.name) && matchesModel(p) && matchesPrice(p));

      const sorted = [...filtered].sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "rating") return b.rating - a.rating;
        return b._creationTime - a._creationTime;
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

export const getModels = query({
  args: { brand: v.string() },
  handler: async (ctx, { brand }) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_brand", (q) => q.eq("brand", brand))
      .collect();

    const modelsSet = new Set<string>();
    for (const p of products) {
      if (p.model && p.model !== "Универсален" && p.model.trim()) {
        modelsSet.add(p.model.trim());
      }
    }

    return Array.from(modelsSet).sort((a, b) => 
      b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" })
    );
  },
});

export const recategorizeBySourceId = mutation({
  args: {
    updates: v.array(v.object({ sourceId: v.string(), category: v.string() })),
  },
  handler: async (ctx, { updates }) => {
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
      })
    ),
  },
  handler: async (ctx, { products }) => {
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
  args: { cursor: v.optional(v.string()), limit: v.number() },
  handler: async (ctx, { cursor, limit }) => {
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
  args: { ip: v.string() },
  handler: async (ctx, { ip }) => {
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
  args: { ip: v.string() },
  handler: async (ctx, { ip }) => {
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
  args: { ip: v.string() },
  handler: async (ctx, { ip }) => {
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
  },
  handler: async (ctx, args) => {
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
      rating: 4.8,
      reviewCount: Math.floor(Math.random() * 15) + 5,
      description: args.description,
      features: args.features,
      badge: args.badge,
    };

    const id = await ctx.db.insert("products", product);
    await adjustFacetCount(ctx.db, args.category, args.brand, 1);
    return id;
  },
});

export const adminUpdateProduct = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
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
    });

    if (oldCategory !== args.category || oldBrand !== args.brand) {
      await adjustFacetCount(ctx.db, oldCategory, oldBrand, -1);
      await adjustFacetCount(ctx.db, args.category, args.brand, 1);
    }
  },
});

export const adminDeleteProduct = mutation({
  args: { id: v.string() }, // matches client-side 'id' which is sourceId
  handler: async (ctx, { id }) => {
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sourceId", (q) => q.eq("sourceId", id))
      .unique();
    if (!existing) throw new Error("Product not found");

    await ctx.db.delete(existing._id);
    await adjustFacetCount(ctx.db, existing.category, existing.brand, -1);
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
  args: { cursor: v.union(v.null(), v.string()), limit: v.number() },
  handler: async (ctx, { cursor, limit }) => {
    return await ctx.db
      .query("products")
      .paginate({ cursor, numItems: limit });
  },
});

export const updateProductImageUrls = mutation({
  args: {
    id: v.id("products"),
    image: v.string(),
    gallery: v.array(v.string()),
  },
  handler: async (ctx, { id, image, gallery }) => {
    await ctx.db.patch(id, { image, gallery });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
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
  args: { cursor: v.union(v.null(), v.string()), limit: v.number() },
  handler: async (ctx, { cursor, limit }) => {
    const page = await ctx.db.system.query("_storage").paginate({ cursor, numItems: limit });
    return {
      isDone: page.isDone,
      continueCursor: page.continueCursor,
      items: page.page.map((f) => f.size),
    };
  },
});

export const getProductsPage = query({
  args: { cursor: v.union(v.null(), v.string()), limit: v.number() },
  handler: async (ctx, { cursor, limit }) => {
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
  args: { cursor: v.union(v.null(), v.string()), limit: v.number() },
  handler: async (ctx, { cursor, limit }) => {
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

