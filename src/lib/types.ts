export type BrandSlug =
  | "apple"
  | "samsung"
  | "xiaomi"
  | "huawei"
  | "google"
  | "oneplus"
  | "universal";

export interface Brand {
  slug: BrandSlug;
  name: string;
  tagline: string;
}

export type CategorySlug =
  | "cases"
  | "protectors"
  | "chargers"
  | "cables"
  | "earbuds"
  | "powerbanks"
  | "stands";

export interface Category {
  slug: CategorySlug;
  name: string;
  shortName: string;
  icon: string;
}

export type Badge = "Ново" | "Хит" | "Топ оферта";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: BrandSlug;
  model: string;
  category: CategorySlug;
  price: number;
  oldPrice?: number;
  image: string;
  gallery: string[];
  rating: number;
  reviewCount: number;
  badge?: Badge;
  description: string;
  features: string[];
  bundleWith?: string;
  bundleDiscountPct?: number;
  colorName?: string;
}
