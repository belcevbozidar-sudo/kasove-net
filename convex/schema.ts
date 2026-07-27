import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
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
    badge: v.optional(v.string()),
    description: v.string(),
    features: v.array(v.string()),
    bundleWith: v.optional(v.string()),
    bundleDiscountPct: v.optional(v.number()),
    colorName: v.optional(v.string()),
    inStock: v.optional(v.boolean()),
  })
    .index("by_slug", ["slug"])
    .index("by_sourceId", ["sourceId"])
    .index("by_category", ["category"])
    .index("by_brand", ["brand"])
    .index("by_brand_category", ["brand", "category"])
    .index("by_category_price", ["category", "price"])
    .index("by_brand_price", ["brand", "price"])
    .index("by_price", ["price"])
    .index("by_category_rating", ["category", "rating"])
    .index("by_brand_rating", ["brand", "rating"])
    .index("by_rating", ["rating"])
    .index("by_hasOldPrice", ["hasOldPrice"])
    .index("by_model", ["model"])
    .index("by_brand_model", ["brand", "model"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "brand"],
    }),


  // Categories and brands are small, static reference data (~20 and ~25
  // rows) used synchronously all over client and server components, so they
  // stay as plain arrays in src/lib/data.ts rather than round-tripping to
  // Convex. Only the large, dynamic product catalog lives here.

  // Precomputed counts for (category, brand) combos so listing pages can show
  // "X products" without an expensive full-table count query.
  // key format: "<category|all>|<brand|all>"
  facetCounts: defineTable({
    key: v.string(),
    count: v.number(),
  }).index("by_key", ["key"]),

  loginAttempts: defineTable({
    ip: v.string(),
    attempts: v.number(),
    lockoutUntil: v.optional(v.number()),
  }).index("by_ip", ["ip"]),

  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    createdAt: v.number(),
  }),

  slides: defineTable({
    image: v.string(),
    eyebrow: v.string(),
    title: v.string(),
    subtitle: v.string(),
    ctaLabel: v.string(),
    ctaHref: v.string(),
    order: v.number(),
  }).index("by_order", ["order"]),

  orders: defineTable({
    seq: v.number(),
    orderNumber: v.string(),
    type: v.union(v.literal("standard"), v.literal("quick")),
    status: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    deliveryMethod: v.optional(v.string()),
    city: v.optional(v.string()),
    addressOrOffice: v.optional(v.string()),
    note: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.string(),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
        image: v.string(),
        bundleProductId: v.optional(v.string()),
      })
    ),
    subtotal: v.number(),
    bundleSavings: v.optional(v.number()),
    shipping: v.number(),
    total: v.number(),
    createdAt: v.number(),
  })
    .index("by_seq", ["seq"])
    .index("by_status", ["status"]),
});

