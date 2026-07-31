import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { assertAdmin } from "./adminAuth";

const DEFAULT_SLIDES = [
  {
    image: "/images/hero-collection.webp",
    eyebrow: "Нова колекция",
    title: "Калъфи за всеки телефон, всеки стил",
    subtitle: "Apple, Samsung, Xiaomi, Huawei, Google и OnePlus — на едно място, на топ цени.",
    ctaLabel: "Пазарувай калъфи",
    ctaHref: "/shop?category=silicone-cases",
    order: 1,
  },
  {
    image: "/images/hero-toys.webp",
    eyebrow: "Метални макети",
    title: "Колекционерски колички и детски играчки",
    subtitle: "Изберете перфектния метален макет в мащаб 1:18, 1:24 или 1:32 на супер цена.",
    ctaLabel: "Разгледай количките",
    ctaHref: "/shop?category=toys",
    order: 2,
  },
  {
    image: "/images/hero-lifestyle.webp",
    eyebrow: "Стил и защита",
    title: "Кожени калъфи и аксесоари",
    subtitle: "Елегантни кожени калъфи тип тефтер с магнитно закопчаване и джобове за карти.",
    ctaLabel: "Разгледай кожени",
    ctaHref: "/shop?category=leather-cases",
    order: 3,
  },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    const dbSlides = await ctx.db.query("slides").collect();
    if (dbSlides.length === 0) {
      return DEFAULT_SLIDES;
    }
    return dbSlides.sort((a, b) => a.order - b.order);
  },
});

export const seed = mutation({
  args: { adminSecret: v.string() },
  handler: async (ctx, { adminSecret }) => {
    assertAdmin(adminSecret);
    const existing = await ctx.db.query("slides").collect();
    for (const s of existing) {
      await ctx.db.delete(s._id);
    }
    for (const s of DEFAULT_SLIDES) {
      await ctx.db.insert("slides", s);
    }
  },
});


export const add = mutation({
  args: {
    adminSecret: v.string(),
    image: v.string(),
    eyebrow: v.string(),
    title: v.string(),
    subtitle: v.string(),
    ctaLabel: v.string(),
    ctaHref: v.string(),
    order: v.number(),
  },
  // adminSecret must be destructured out — the rest is spread straight into
  // the document, and the secret must never be persisted.
  handler: async (ctx, { adminSecret, ...slide }) => {
    assertAdmin(adminSecret);
    return await ctx.db.insert("slides", slide);
  },
});

export const update = mutation({
  args: {
    adminSecret: v.string(),
    id: v.id("slides"),
    image: v.string(),
    eyebrow: v.string(),
    title: v.string(),
    subtitle: v.string(),
    ctaLabel: v.string(),
    ctaHref: v.string(),
    order: v.number(),
  },
  handler: async (ctx, { adminSecret, id, ...args }) => {
    assertAdmin(adminSecret);
    return await ctx.db.patch(id, args);
  },
});

export const deleteSlide = mutation({
  args: { adminSecret: v.string(), id: v.id("slides") },
  handler: async (ctx, { adminSecret, id }) => {
    assertAdmin(adminSecret);
    return await ctx.db.delete(id);
  },
});
