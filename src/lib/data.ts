import type { Brand, Category } from "./types";

const allBrands: Brand[] = [
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
  { slug: "other", name: "Други марки и аксесоари", tagline: "Аксесоари за други марки" },
  { slug: "diecast-cars", name: "Метални колички", tagline: "Колекционерски метални колички" }
];

export const brands: Brand[] = [
  { slug: "apple", name: "Apple", tagline: "iPhone аксесоари" },
  { slug: "samsung", name: "Samsung", tagline: "Galaxy аксесоари" },
  { slug: "xiaomi", name: "Xiaomi", tagline: "Redmi & Mi аксесоари" },
  { slug: "honor", name: "Honor", tagline: "Honor аксесоари" },
  { slug: "motorola", name: "Motorola", tagline: "Moto аксесоари" },
  { slug: "huawei", name: "Huawei", tagline: "Huawei аксесоари" },
  { slug: "other", name: "Други марки и аксесоари", tagline: "Аксесоари за други марки" },
  { slug: "diecast-cars", name: "Метални колички", tagline: "Колекционерски метални колички" }
];

export const categories: Category[] = [
  { slug: "silicone-cases", name: "Силиконови калъфи", shortName: "Силиконови", icon: "case" },
  { slug: "hard-cases", name: "Твърди гърбове", shortName: "Твърди", icon: "case" },
  { slug: "leather-cases", name: "Кожени калъфи", shortName: "Кожени", icon: "case" },
  { slug: "protectors", name: "Протектори за GSM", shortName: "Протектори", icon: "shield" },
  { slug: "chargers-220v", name: "Оригинални зарядни 220V", shortName: "Зарядни 220V", icon: "bolt" },
  { slug: "usb-cables", name: "USB кабели", shortName: "Кабели", icon: "cable" },
  { slug: "car-stands", name: "Стойки за кола", shortName: "Стойки кола", icon: "stand" },
];

export const FREE_SHIPPING_THRESHOLD = 60; // 60 BGN (formatted to EUR/BGN split)
export const DEFAULT_SHIPPING_FEE = 6.95; // 6.95 BGN (formatted to EUR/BGN split)


export function formatPrice(valueBgn: number): string {
  const valueEur = valueBgn / 1.95583;
  return `${valueEur.toFixed(2).replace(".", ",")} € (${valueBgn.toFixed(2).replace(".", ",")} лв.)`;
}

export function getBrand(slug: string) {
  return allBrands.find((b) => b.slug === slug) || brands.find((b) => b.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

