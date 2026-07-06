export type BrandSlug =
  | "apple"
  | "samsung"
  | "xiaomi"
  | "huawei"
  | "google"
  | "oneplus"
  | "sony"
  | "lg"
  | "motorola"
  | "realme"
  | "nokia"
  | "zte"
  | "lenovo"
  | "htc"
  | "asus"
  | "honor"
  | "alcatel"
  | "blackberry"
  | "coolpad"
  | "telenor"
  | "microsoft"
  | "a1"
  | "cat"
  | "acer"
  | "meizu"
  | "universal";

export interface Brand {
  slug: BrandSlug;
  name: string;
  tagline: string;
}

export type CategorySlug =
  | "gsm-accessories"
  | "leather-cases"
  | "silicone-cases"
  | "hard-cases"
  | "protectors"
  | "chargers-12v"
  | "chargers-220v"
  | "tablet-cases"
  | "usb-cables"
  | "car-stands"
  | "batteries"
  | "handsfree"
  | "memory-cards"
  | "toys"
  | "bluetooth-headphones"
  | "powerbanks"
  | "universal-cases"
  | "apple-accessories"
  | "smart-devices"
  | "other";

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
