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

export const categoryMenuData: MenuCategory[] = [
  {
    name: "GSM АКСЕСОАРИ",
    slug: "gsm-accessories",
    href: "/shop",
    subcategories: [
      { name: "Аксесоари за Apple", href: "/shop?brand=apple" },
      { name: "Аксесоари за Samsung", href: "/shop?brand=samsung" },
      { name: "Аксесоари за Xiaomi", href: "/shop?brand=xiaomi" },
      { name: "Аксесоари за Huawei", href: "/shop?brand=huawei" },
      { name: "Аксесоари за Motorola", href: "/shop?brand=motorola" },
      { name: "Аксесоари за Honor", href: "/shop?brand=honor" },
      { name: "Аксесоари за Google", href: "/shop?brand=google" },
      { name: "Аксесоари за OnePlus", href: "/shop?brand=oneplus" },
      { name: "Аксесоари за Sony", href: "/shop?brand=sony" },
      { name: "Аксесоари за Nokia", href: "/shop?brand=nokia" },
      { name: "Аксесоари за Realme", href: "/shop?brand=realme" },
    ],
  },
  {
    name: "КОЖЕНИ КАЛЪФИ",
    slug: "leather-cases",
    href: "/shop?category=leather-cases",
    subcategories: [
      { name: "Кожени калъфи за Apple", href: "/shop?category=leather-cases&brand=apple" },
      { name: "Кожени калъфи за Samsung", href: "/shop?category=leather-cases&brand=samsung" },
      { name: "Кожени калъфи за Xiaomi", href: "/shop?category=leather-cases&brand=xiaomi" },
      { name: "Кожени калъфи за Huawei", href: "/shop?category=leather-cases&brand=huawei" },
      { name: "Кожени калъфи за Motorola", href: "/shop?category=leather-cases&brand=motorola" },
      { name: "Кожени калъфи за Honor", href: "/shop?category=leather-cases&brand=honor" },
      { name: "Кожени калъфи за Sony", href: "/shop?category=leather-cases&brand=sony" },
      { name: "Кожени калъфи за Nokia", href: "/shop?category=leather-cases&brand=nokia" },
    ],
  },
  {
    name: "СИЛИКОНОВ ГРЪБ ТПУ",
    slug: "silicone-cases",
    href: "/shop?category=silicone-cases",
    subcategories: [
      { name: "Силиконов гръб за Apple", href: "/shop?category=silicone-cases&brand=apple" },
      { name: "Силиконов гръб за Samsung", href: "/shop?category=silicone-cases&brand=samsung" },
      { name: "Силиконов гръб за Xiaomi", href: "/shop?category=silicone-cases&brand=xiaomi" },
      { name: "Силиконов гръб за Huawei", href: "/shop?category=silicone-cases&brand=huawei" },
      { name: "Силиконов гръб за Motorola", href: "/shop?category=silicone-cases&brand=motorola" },
      { name: "Силиконов гръб за Honor", href: "/shop?category=silicone-cases&brand=honor" },
      { name: "Силиконов гръб за Google", href: "/shop?category=silicone-cases&brand=google" },
      { name: "Силиконов гръб за OnePlus", href: "/shop?category=silicone-cases&brand=oneplus" },
      { name: "Силиконов гръб за Sony", href: "/shop?category=silicone-cases&brand=sony" },
    ],
  },
  {
    name: "ТВЪРДИ ГРЪБОВЕ",
    slug: "hard-cases",
    href: "/shop?category=hard-cases",
    subcategories: [
      { name: "Твърд гръб за Apple", href: "/shop?category=hard-cases&brand=apple" },
      { name: "Твърд гръб за Samsung", href: "/shop?category=hard-cases&brand=samsung" },
      { name: "Твърд гръб за Xiaomi", href: "/shop?category=hard-cases&brand=xiaomi" },
      { name: "Твърд гръб за Huawei", href: "/shop?category=hard-cases&brand=huawei" },
      { name: "Твърд гръб за Motorola", href: "/shop?category=hard-cases&brand=motorola" },
      { name: "Твърд гръб за Honor", href: "/shop?category=hard-cases&brand=honor" },
      { name: "Твърд гръб за Sony", href: "/shop?category=hard-cases&brand=sony" },
    ],
  },
  {
    name: "ПРОТЕКТОРИ ЗА GSM",
    slug: "protectors",
    href: "/shop?category=protectors",
    subcategories: [
      { name: "Протектори за Apple", href: "/shop?category=protectors&brand=apple" },
      { name: "Протектори за Samsung", href: "/shop?category=protectors&brand=samsung" },
      { name: "Протектори за Xiaomi", href: "/shop?category=protectors&brand=xiaomi" },
      { name: "Протектори за Huawei", href: "/shop?category=protectors&brand=huawei" },
      { name: "Протектори за Motorola", href: "/shop?category=protectors&brand=motorola" },
      { name: "Протектори за Honor", href: "/shop?category=protectors&brand=honor" },
      { name: "Протектори за Google", href: "/shop?category=protectors&brand=google" },
      { name: "Протектори за Sony", href: "/shop?category=protectors&brand=sony" },
    ],
  },
  {
    name: "ОРИГИНАЛНИ ЗАРЯДНИ 12V",
    slug: "chargers-12v",
    href: "/shop?category=chargers",
    subcategories: [
      { name: "Зарядни 12V за Apple", href: "/shop?category=chargers&brand=apple" },
      { name: "Зарядни 12V за Samsung", href: "/shop?category=chargers&brand=samsung" },
      { name: "Зарядни 12V за Xiaomi", href: "/shop?category=chargers&brand=xiaomi" },
      { name: "Зарядни 12V за Huawei", href: "/shop?category=chargers&brand=huawei" },
    ],
  },
  {
    name: "ОРИГИНАЛНИ ЗАРЯДНИ 220V",
    slug: "chargers-220v",
    href: "/shop?category=chargers",
    subcategories: [
      { name: "Зарядни 220V за Apple", href: "/shop?category=chargers&brand=apple" },
      { name: "Зарядни 220V за Samsung", href: "/shop?category=chargers&brand=samsung" },
      { name: "Зарядни 220V за Xiaomi", href: "/shop?category=chargers&brand=xiaomi" },
      { name: "Зарядни 220V за Huawei", href: "/shop?category=chargers&brand=huawei" },
      { name: "Зарядни 220V за Sony", href: "/shop?category=chargers&brand=sony" },
      { name: "Зарядни 220V за Nokia", href: "/shop?category=chargers&brand=nokia" },
    ],
  },
  {
    name: "КАЛЪФИ ЗА ТАБЛЕТИ",
    slug: "tablet-cases",
    href: "/shop",
    subcategories: [
      { name: "Таблети 7.0 - 8.0 инча", href: "/shop" },
      { name: "Таблети 9.7 - 11.0 инча", href: "/shop" },
    ],
  },
  {
    name: "USB КАБЕЛИ",
    slug: "usb-cables",
    href: "/shop?category=usb-cables",
    subcategories: [
      { name: "Кабели за Apple (Lightning)", href: "/shop?category=usb-cables&brand=apple" },
      { name: "Кабели USB Type-C", href: "/shop?category=usb-cables" },
      { name: "Кабели Micro USB", href: "/shop?category=usb-cables" },
    ],
  },
  {
    name: "СТОЙКИ ЗА КОЛА",
    slug: "car-stands",
    href: "/shop?category=car-stands",
    subcategories: [
      { name: "Стойки за Apple", href: "/shop?category=car-stands&brand=apple" },
      { name: "Стойки за Samsung", href: "/shop?category=car-stands&brand=samsung" },
      { name: "Стойки за Xiaomi", href: "/shop?category=car-stands&brand=xiaomi" },
      { name: "Магнитни стойки за решетка", href: "/shop?category=car-stands" },
      { name: "Стойки за стъкло / табло", href: "/shop?category=car-stands" },
    ],
  },
  {
    name: "ОРИГИНАЛНИ БАТЕРИИ",
    slug: "batteries",
    href: "/shop",
    subcategories: [
      { name: "Батерии за Apple", href: "/shop?brand=apple" },
      { name: "Батерии за Samsung", href: "/shop?brand=samsung" },
      { name: "Батерии за Huawei", href: "/shop?brand=huawei" },
      { name: "Батерии за Xiaomi", href: "/shop?brand=xiaomi" },
    ],
  },
  {
    name: "HANDSFREE",
    slug: "handsfree",
    href: "/shop",
    subcategories: [
      { name: "Слушалки за Apple", href: "/shop?brand=apple" },
      { name: "Слушалки за Samsung", href: "/shop?brand=samsung" },
      { name: "Слушалки за Xiaomi", href: "/shop?brand=xiaomi" },
      { name: "Слушалки Type-C / 3.5mm", href: "/shop" },
    ],
  },
  {
    name: "КАРТИ ПАМЕТ",
    slug: "memory-cards",
    href: "/shop",
    subcategories: [
      { name: "Micro SD карти 32GB", href: "/shop" },
      { name: "Micro SD карти 64GB", href: "/shop" },
      { name: "Micro SD карти 128GB", href: "/shop" },
    ],
  },
  {
    name: "АРАБСКИ ПАРФЮМИ",
    slug: "arabic-perfumes",
    href: "/shop",
    subcategories: [
      { name: "Дамски Парфюми", href: "/shop" },
      { name: "Мъжки Парфюми", href: "/shop" },
      { name: "Унисекс Парфюми", href: "/shop" },
    ],
  },
  {
    name: "ДЕТСКИ ИГРАЧКИ",
    slug: "toys",
    href: "/shop",
    subcategories: [
      { name: "Занимателни играчки", href: "/shop" },
      { name: "Детски колички и писти", href: "/shop" },
    ],
  },
  {
    name: "BLUETOOTH СЛУШАЛКИ",
    slug: "bluetooth-headphones",
    href: "/shop",
  },
  {
    name: "ВЪНШНИ БАТЕРИИ - POWER BANK",
    slug: "power-banks",
    href: "/shop",
  },
  {
    name: "УНИВЕРСАЛНИ КАЛЪФИ",
    slug: "universal-cases",
    href: "/shop",
  },
  {
    name: "АКСЕСОАРИ ЗА APPLE",
    slug: "apple-accessories",
    href: "/shop?brand=apple",
  },
  {
    name: "СМАРТ УСТРОЙСТВА",
    slug: "smart-devices",
    href: "/shop",
    subcategories: [
      { name: "Аксесоари за Apple Watch", href: "/shop?brand=apple" },
      { name: "Смарт часовници и гривни", href: "/shop" },
    ],
  },
  {
    name: "ДРУГИ",
    slug: "other",
    href: "/shop",
    subcategories: [
      { name: "Видеонаблюдение", href: "/shop" },
      { name: "Колекционерски фигурки", href: "/shop" },
      { name: "Преносими тонколони", href: "/shop" },
    ],
  },
];
