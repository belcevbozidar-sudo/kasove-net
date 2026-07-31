import { allBrands, categories } from "./data";

export interface MenuSubcategory {
  name: string;
  href: string;
}

export interface MenuCategory {
  name: string;
  slug: string;
  href: string;
  subcategories?: MenuSubcategory[];
}

// Brands with enough real per-category stock to be worth a dedicated
// "<category> за <Brand>" filter link in the mega-menu.
const CATEGORY_BRAND_SLUGS = ["apple", "samsung", "xiaomi", "huawei", "motorola", "honor", "nokia", "realme"];

// Categories hidden from the nav menu (desktop mega-menu + mobile drawer) by
// request, without touching the category or its products — still reachable
// via /shop?category=<slug> directly, the shop sidebar filter, etc.
const MENU_HIDDEN_CATEGORY_SLUGS = new Set<string>(["gsm-accessories"]);

// Every entry here must resolve to a real, populated page — this data feeds
// both the desktop "Категории" mega-menu and the mobile drawer accordion, so
// a placeholder/fake entry shows up in two places at once. Derived from
// `categories` (src/lib/data.ts) — the same 9 category slugs the shop's own
// filters use — rather than hand-maintained, so it can't drift out of sync
// with what the catalog actually contains again.
export const categoryMenuData: MenuCategory[] = [
  {
    name: "МАРКИ",
    slug: "brands",
    href: "/shop",
    subcategories: allBrands
      .filter((b) => b.slug !== "other")
      .map((b) => ({ name: b.name, href: `/brand/${b.slug}` })),
  },
  {
    name: "НОВИ ПРОДУКТИ",
    slug: "new-products",
    href: "/new-products",
  },
  ...categories
    .filter((cat) => !MENU_HIDDEN_CATEGORY_SLUGS.has(cat.slug))
    .map((cat) => ({
    name: cat.name.toUpperCase(),
    slug: cat.slug,
    href: `/shop?category=${cat.slug}`,
    subcategories:
      cat.slug === "toys"
        ? [
            { name: "Всички колички", href: "/shop?category=toys" },
            { name: "Мащаб 1:18", href: "/shop?category=toys&scale=1-18" },
            { name: "Мащаб 1:24", href: "/shop?category=toys&scale=1-24" },
            { name: "Мащаб 1:32", href: "/shop?category=toys&scale=1-32" },
          ]
        : CATEGORY_BRAND_SLUGS.map((slug) => ({
            name: `${cat.name} за ${allBrands.find((b) => b.slug === slug)?.name ?? slug}`,
            href: `/shop?category=${cat.slug}&brand=${slug}`,
          })),
  })),
];
