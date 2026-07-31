import type { Brand, Category } from "./types";

export const allBrands: Brand[] = [

  { slug: "apple", name: "Apple", tagline: "iPhone аксесоари" },
  { slug: "samsung", name: "Samsung", tagline: "Galaxy аксесоари" },
  { slug: "xiaomi", name: "Xiaomi", tagline: "Redmi & Mi аксесоари" },
  { slug: "huawei", name: "Huawei", tagline: "Huawei аксесоари" },
  { slug: "google", name: "Google", tagline: "Pixel аксесоари" },
  { slug: "oneplus", name: "OnePlus", tagline: "OnePlus аксесоари" },
  { slug: "sony", name: "Sony", tagline: "Sony Xperia аксесоари" },
  { slug: "lg", name: "LG", tagline: "LG аксесоари" },
  { slug: "motorola", name: "Motorola", tagline: "Moto аксесоари" },
  { slug: "realme", name: "Realme", tagline: "Realme аксесоари" },
  { slug: "nokia", name: "Nokia", tagline: "Nokia аксесоари" },
  { slug: "zte", name: "ZTE", tagline: "ZTE аксесоари" },
  { slug: "lenovo", name: "Lenovo", tagline: "Lenovo аксесоари" },
  { slug: "htc", name: "HTC", tagline: "HTC аксесоари" },
  { slug: "asus", name: "Asus", tagline: "Asus аксесоари" },
  { slug: "honor", name: "Honor", tagline: "Honor аксесоари" },
  { slug: "alcatel", name: "Alcatel", tagline: "Alcatel аксесоари" },
  { slug: "blackberry", name: "BlackBerry", tagline: "BlackBerry аксесоари" },
  { slug: "coolpad", name: "Coolpad", tagline: "Coolpad аксесоари" },
  { slug: "telenor", name: "Telenor", tagline: "Telenor аксесоари" },
  { slug: "microsoft", name: "Microsoft", tagline: "Microsoft Lumia аксесоари" },
  { slug: "a1", name: "A1", tagline: "A1 аксесоари" },
  { slug: "cat", name: "Cat", tagline: "Cat аксесоари" },
  { slug: "acer", name: "Acer", tagline: "Acer аксесоари" },
  { slug: "meizu", name: "Meizu", tagline: "Meizu аксесоари" },
  { slug: "universal", name: "Универсални", tagline: "Аксесоари за всички телефони" },
  { slug: "other", name: "Други", tagline: "Аксесоари за други марки" }
];

export const brands: Brand[] = [
  { slug: "apple", name: "Apple", tagline: "iPhone аксесоари" },
  { slug: "samsung", name: "Samsung", tagline: "Galaxy аксесоари" },
  { slug: "xiaomi", name: "Xiaomi", tagline: "Redmi & Mi аксесоари" },
  { slug: "honor", name: "Honor", tagline: "Honor аксесоари" },
  { slug: "motorola", name: "Motorola", tagline: "Moto аксесоари" },
  { slug: "huawei", name: "Huawei", tagline: "Huawei аксесоари" },
  { slug: "nokia", name: "Nokia", tagline: "Nokia аксесоари" },
  { slug: "realme", name: "Realme", tagline: "Realme аксесоари" },
  { slug: "other", name: "Други", tagline: "Аксесоари за други марки" }
];


export const categories: Category[] = [
  { slug: "silicone-cases", name: "Силиконови калъфи", shortName: "Силиконови", icon: "case" },
  { slug: "hard-cases", name: "Твърди гърбове", shortName: "Твърди", icon: "case" },
  { slug: "leather-cases", name: "Кожени калъфи", shortName: "Кожени", icon: "case" },
  { slug: "protectors", name: "Протектори за GSM", shortName: "Протектори", icon: "shield" },
  { slug: "chargers-220v", name: "Оригинални зарядни 220V", shortName: "Зарядни 220V", icon: "bolt" },
  { slug: "usb-cables", name: "USB кабели", shortName: "Кабели", icon: "cable" },
  { slug: "car-stands", name: "Стойки за кола", shortName: "Стойки кола", icon: "stand" },
  { slug: "bluetooth-headphones", name: "Блутут слушалки", shortName: "Слушалки", icon: "case" },
  { slug: "handsfree", name: "Handsfree слушалки", shortName: "Handsfree", icon: "case" },
  { slug: "other", name: "Разни продукти", shortName: "Разни", icon: "case" },
  { slug: "batteries", name: "Батерии", shortName: "Батерии", icon: "bolt" },
  { slug: "chargers-12v", name: "Зарядни 12V за кола", shortName: "Зарядни 12V", icon: "bolt" },
  { slug: "powerbanks", name: "Външни батерии", shortName: "Power Bank", icon: "bolt" },
  { slug: "tablet-cases", name: "Калъфи за таблети", shortName: "Таблети", icon: "case" },
  { slug: "smart-devices", name: "Смарт устройства", shortName: "Смарт", icon: "case" },
  { slug: "universal-cases", name: "Универсални калъфи", shortName: "Универсални", icon: "case" },
  { slug: "apple-accessories", name: "Аксесоари за Apple", shortName: "Apple", icon: "case" },
  { slug: "gsm-accessories", name: "GSM аксесоари", shortName: "GSM", icon: "case" },
  { slug: "memory-cards", name: "Карти памет", shortName: "Карти памет", icon: "cable" },
  { slug: "toys", name: "Метални колички", shortName: "Колички", icon: "case" },
];

// The homepage "Пазарувай по категория" tile grid only shows the original 9
// categories (each needs a hero image at /images/categories/<slug>.webp) —
// the 11 restored below don't have one yet, so keep them off that grid for
// now while still making them real, filterable categories everywhere else
// (shop sidebar, header/mobile menu).
export const HOMEPAGE_CATEGORY_SLUGS = new Set<string>([
  "silicone-cases",
  "hard-cases",
  "leather-cases",
  "protectors",
  "chargers-220v",
  "usb-cables",
  "car-stands",
  "bluetooth-headphones",
  "toys",
]);

// Categories that aren't phone accessories: the shop's brand/model wizard must
// be skipped for these, since their products aren't tied to a phone model.
export const NON_PHONE_CATEGORIES = new Set<string>(["toys"]);

// Bulgaria's fixed currency-board peg — prices are stored in EUR and the BGN
// figure is always derived from it, never stored separately.
export const BGN_PER_EUR = 1.95583;

export const FREE_SHIPPING_THRESHOLD = 45.50; // 89 BGN (formatted to EUR/BGN split)
export const DEFAULT_SHIPPING_FEE = 3.55; // 6.95 BGN (formatted to EUR/BGN split)

// Rounded BGN figure for customer-facing copy, derived from the threshold so
// the promise in the banner can't drift away from what checkout charges.
export const FREE_SHIPPING_THRESHOLD_BGN = Math.round(FREE_SHIPPING_THRESHOLD * BGN_PER_EUR);

/** Shipping fee for an order subtotal, in EUR. Single source of truth for
 *  the cart, the checkout and the quick-order modal. */
export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
}

export function formatPrice(value: number): string {
  const bgn = value * BGN_PER_EUR;
  return `€${value.toFixed(2)} (${bgn.toFixed(2).replace(".", ",")} лв.)`;
}

export function getBrand(slug: string) {
  return allBrands.find((b) => b.slug === slug) || brands.find((b) => b.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

