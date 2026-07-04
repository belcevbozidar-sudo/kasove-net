import type { Brand, Category, Product } from "./types";

export const brands: Brand[] = [
  { slug: "apple", name: "Apple", tagline: "iPhone аксесоари" },
  { slug: "samsung", name: "Samsung", tagline: "Galaxy аксесоари" },
  { slug: "xiaomi", name: "Xiaomi", tagline: "Mi & Redmi аксесоари" },
  { slug: "huawei", name: "Huawei", tagline: "P & Mate серия" },
  { slug: "google", name: "Google", tagline: "Pixel аксесоари" },
  { slug: "oneplus", name: "OnePlus", tagline: "Nord & номер серия" },
];

export const categories: Category[] = [
  { slug: "cases", name: "Калъфи за телефони", shortName: "Калъфи", icon: "case" },
  { slug: "protectors", name: "Протектори за екран", shortName: "Протектори", icon: "shield" },
  { slug: "chargers", name: "Зарядни устройства", shortName: "Зарядни", icon: "bolt" },
  { slug: "cables", name: "Кабели", shortName: "Кабели", icon: "cable" },
  { slug: "earbuds", name: "Слушалки", shortName: "Слушалки", icon: "earbuds" },
  { slug: "powerbanks", name: "Power Bank", shortName: "Power Bank", icon: "battery" },
  { slug: "stands", name: "Поставки", shortName: "Поставки", icon: "stand" },
];

export const products: Product[] = [
  // ---- CASES ----
  {
    id: "p1",
    slug: "iphone-15-pro-case-clear",
    name: "Прозрачен удароустойчив калъф",
    brand: "apple",
    model: "iPhone 15 Pro",
    category: "cases",
    price: 24.9,
    image: "/images/case-clear.png",
    gallery: ["/images/case-clear.png", "/images/hero-collection.png"],
    rating: 4.8,
    reviewCount: 214,
    badge: "Хит",
    colorName: "Прозрачен",
    description:
      "Ултра прозрачен калъф за iPhone 15 Pro с военен стандарт на защита при удар. Не пожълтява с времето благодарение на специалното покритие, а прецизните изрези осигуряват пълен достъп до бутони и камери.",
    features: ["Военен стандарт на защита MIL-STD-810G", "Не пожълтява", "Съвместим с безжично зареждане", "Прецизни изрези за камера"],
    bundleWith: "p13",
    bundleDiscountPct: 20,
  },
  {
    id: "p2",
    slug: "iphone-15-case-black-silicone",
    name: "Силиконов калъф",
    brand: "apple",
    model: "iPhone 15",
    category: "cases",
    price: 22.9,
    image: "/images/case-black-silicone.png",
    gallery: ["/images/case-black-silicone.png"],
    rating: 4.7,
    reviewCount: 168,
    colorName: "Черен",
    description:
      "Мек силиконов калъф с кадифено покритие отвътре, което предпазва iPhone 15 от драскотини. Тънък профил, който запазва усещането за естествения дизайн на телефона.",
    features: ["Меко покритие отвътре", "Тънък профил 1.2мм", "Устойчив на отпечатъци", "Съвместим с MagSafe"],
    bundleWith: "p13",
    bundleDiscountPct: 20,
  },
  {
    id: "p3",
    slug: "galaxy-s24-ultra-case-leather",
    name: "Кожен калъф Premium",
    brand: "samsung",
    model: "Galaxy S24 Ultra",
    category: "cases",
    price: 27.9,
    oldPrice: 34.9,
    image: "/images/case-leather-brown.png",
    gallery: ["/images/case-leather-brown.png"],
    rating: 4.9,
    reviewCount: 132,
    badge: "Топ оферта",
    colorName: "Кафяв",
    description:
      "Елегантен калъф от еко-кожа с прошити ръбове за Galaxy S24 Ultra. Съчетава луксозен вид с реална защита от удар и надраскване, а вътрешната подплата пази екрана и корпуса.",
    features: ["Еко-кожа с прецизни шевове", "Подсилени ъгли", "Съвместим с S Pen", "Магнитно затваряне"],
    bundleWith: "p14",
    bundleDiscountPct: 20,
  },
  {
    id: "p4",
    slug: "galaxy-s23-case-blue",
    name: "Гланцов калъф",
    brand: "samsung",
    model: "Galaxy S23",
    category: "cases",
    price: 21.9,
    image: "/images/case-blue.png",
    gallery: ["/images/case-blue.png"],
    rating: 4.6,
    reviewCount: 97,
    colorName: "Синьо",
    description:
      "Гланцов калъф в дълбок синьо-кобалтов оттенък за Galaxy S23 с твърда поликарбонатна обвивка и мек TPU буфер по ръбовете за амортизация при удар.",
    features: ["Хибридна конструкция PC + TPU", "Устойчив на надраскване", "Прецизни бутони", "Лек — 18г"],
    bundleWith: "p14",
    bundleDiscountPct: 20,
  },
  {
    id: "p5",
    slug: "redmi-note-13-pro-case-cardholder",
    name: "Калъф с поставка за карти",
    brand: "xiaomi",
    model: "Redmi Note 13 Pro",
    category: "cases",
    price: 19.9,
    image: "/images/case-cardholder-clear.png",
    gallery: ["/images/case-cardholder-clear.png"],
    rating: 4.5,
    reviewCount: 76,
    colorName: "Прозрачен",
    description:
      "Практичен прозрачен калъф за Redmi Note 13 Pro с вградено джобче за 1-2 карти на гърба — забравете за отделния портфейл.",
    features: ["Вградена поставка за карти", "Прозрачен, не пожълтява", "Противохлъзгащи ръбове", "Лесен достъп до порт"],
    bundleWith: "p15",
    bundleDiscountPct: 20,
  },
  {
    id: "p6",
    slug: "xiaomi-14-case-armor",
    name: "Armor удароустойчив калъф",
    brand: "xiaomi",
    model: "Xiaomi 14",
    category: "cases",
    price: 26.9,
    oldPrice: 32.9,
    image: "/images/case-rugged-armor.png",
    gallery: ["/images/case-rugged-armor.png"],
    rating: 4.8,
    reviewCount: 143,
    badge: "Топ оферта",
    colorName: "Черен / Оранжев",
    description:
      "Двуслоен Armor калъф за Xiaomi 14, проектиран за максимална защита в тежки условия — подсилени ъгли, грайферен захват и защита на камерата.",
    features: ["Двуслойна защита PC + TPU", "Подсилени ъгли", "Изпъкнала рамка около камерата", "Грайферен захват"],
    bundleWith: "p15",
    bundleDiscountPct: 20,
  },
  {
    id: "p7",
    slug: "huawei-p60-pro-case-pink",
    name: "Силиконов калъф",
    brand: "huawei",
    model: "P60 Pro",
    category: "cases",
    price: 22.9,
    image: "/images/case-pink.png",
    gallery: ["/images/case-pink.png"],
    rating: 4.6,
    reviewCount: 58,
    colorName: "Розово",
    description:
      "Нежен розов силиконов калъф за Huawei P60 Pro с матово покритие, което не задържа отпечатъци и приятно пасва в ръка.",
    features: ["Матово покритие", "Не задържа отпечатъци", "Мека подплата отвътре", "Прецизни изрези"],
    bundleWith: "p16",
    bundleDiscountPct: 20,
  },
  {
    id: "p8",
    slug: "huawei-mate-60-pro-case-mint",
    name: "Силиконов калъф",
    brand: "huawei",
    model: "Mate 60 Pro",
    category: "cases",
    price: 22.9,
    image: "/images/case-mint-green.png",
    gallery: ["/images/case-mint-green.png"],
    rating: 4.7,
    reviewCount: 64,
    colorName: "Мента",
    description:
      "Пастелен калъф в цвят мента за Mate 60 Pro — лек, тънък и с приятна на допир текстура, която не се хлъзга от ръка.",
    features: ["Пастелна цветова гама", "Ултра лек — 20г", "Противохлъзгаща текстура", "Съвместим с всички кабели"],
    bundleWith: "p16",
    bundleDiscountPct: 20,
  },
  {
    id: "p9",
    slug: "pixel-8-pro-case-gradient",
    name: "Градиентен калъф",
    brand: "google",
    model: "Pixel 8 Pro",
    category: "cases",
    price: 24.9,
    image: "/images/case-purple-gradient.png",
    gallery: ["/images/case-purple-gradient.png"],
    rating: 4.7,
    reviewCount: 89,
    badge: "Ново",
    colorName: "Лилаво-розов градиент",
    description:
      "Ефектен калъф с лилаво-розов градиент за Pixel 8 Pro. Гланцовото покритие сменя нюанса си на светлина, а корпусът остава лек и здрав.",
    features: ["Ефект на преливащ градиент", "Гланцово покритие", "Защита от удар до 1.5м", "Прецизни изрези за камера"],
    bundleWith: "p17",
    bundleDiscountPct: 20,
  },
  {
    id: "p10",
    slug: "pixel-7-case-cardholder",
    name: "Калъф с поставка за карти",
    brand: "google",
    model: "Pixel 7",
    category: "cases",
    price: 19.9,
    image: "/images/case-cardholder-clear.png",
    gallery: ["/images/case-cardholder-clear.png"],
    rating: 4.5,
    reviewCount: 41,
    colorName: "Прозрачен",
    description:
      "Практичен прозрачен калъф за Pixel 7 с джобче за карти на гърба — 2 в 1 решение за ежедневието.",
    features: ["Вградена поставка за карти", "Прозрачен дизайн", "Тънък профил", "Лесен достъп до бутони"],
    bundleWith: "p17",
    bundleDiscountPct: 20,
  },
  {
    id: "p11",
    slug: "oneplus-12-case-clear",
    name: "Прозрачен удароустойчив калъф",
    brand: "oneplus",
    model: "OnePlus 12",
    category: "cases",
    price: 22.9,
    image: "/images/case-clear.png",
    gallery: ["/images/case-clear.png"],
    rating: 4.6,
    reviewCount: 52,
    colorName: "Прозрачен",
    description:
      "Кристално прозрачен калъф за OnePlus 12 с усилени въздушни възглавнички по ъглите за амортизация при падане.",
    features: ["Въздушни възглавнички по ъглите", "Не пожълтява", "Съвместим с безжично зареждане", "Лек профил"],
    bundleWith: "p18",
    bundleDiscountPct: 20,
  },
  {
    id: "p12",
    slug: "oneplus-nord-3-case-black",
    name: "Силиконов калъф",
    brand: "oneplus",
    model: "Nord 3",
    category: "cases",
    price: 19.9,
    image: "/images/case-black-silicone.png",
    gallery: ["/images/case-black-silicone.png"],
    rating: 4.5,
    reviewCount: 37,
    colorName: "Черен",
    description:
      "Стилен черен силиконов калъф за Nord 3 с мека подплата отвътре, която пази корпуса от драскотини всеки ден.",
    features: ["Мека вътрешна подплата", "Матово покритие", "Устойчив на отпечатъци", "Прецизни изрези"],
    bundleWith: "p18",
    bundleDiscountPct: 20,
  },

  // ---- PROTECTORS ----
  {
    id: "p13",
    slug: "iphone-15-pro-protector-glass",
    name: "Закалено стъкло 9H",
    brand: "apple",
    model: "iPhone 15 Pro",
    category: "protectors",
    price: 14.9,
    image: "/images/protector-glass.png",
    gallery: ["/images/protector-glass.png"],
    rating: 4.8,
    reviewCount: 301,
    description:
      "Закалено стъкло с твърдост 9H за iPhone 15 Pro. Олеофобно покритие срещу отпечатъци и балон-свободно лепене с включен апликатор.",
    features: ["Твърдост 9H", "Олеофобно покритие", "Комплект с апликатор", "Прецизна съвместимост с Face ID"],
  },
  {
    id: "p14",
    slug: "galaxy-s24-ultra-protector-glass",
    name: "Закалено стъкло 9H",
    brand: "samsung",
    model: "Galaxy S24 Ultra",
    category: "protectors",
    price: 14.9,
    image: "/images/protector-glass.png",
    gallery: ["/images/protector-glass.png"],
    rating: 4.7,
    reviewCount: 189,
    description:
      "Прецизно изрязано закалено стъкло за Galaxy S24 Ultra, съвместимо с извития ръб на екрана и вградения четец на пръстови отпечатъци.",
    features: ["Твърдост 9H", "Съвместимо с четец на отпечатъци", "Anti-scratch покритие", "Лесно апликиране"],
  },
  {
    id: "p15",
    slug: "xiaomi-14-protector-privacy",
    name: "Privacy стъклен протектор",
    brand: "xiaomi",
    model: "Xiaomi 14",
    category: "protectors",
    price: 17.9,
    image: "/images/protector-privacy.png",
    gallery: ["/images/protector-privacy.png"],
    rating: 4.6,
    reviewCount: 88,
    description:
      "Протектор с ефект против странично надничане за Xiaomi 14 — екранът се вижда ясно само право срещу вас, идеален за градски транспорт и офис.",
    features: ["Anti-spy защита на 45°", "Твърдост 9H", "Олеофобно покритие", "Комплект с апликатор"],
  },
  {
    id: "p16",
    slug: "huawei-p60-pro-protector-glass",
    name: "Закалено стъкло 9H",
    brand: "huawei",
    model: "P60 Pro",
    category: "protectors",
    price: 14.9,
    image: "/images/protector-glass.png",
    gallery: ["/images/protector-glass.png"],
    rating: 4.7,
    reviewCount: 65,
    description:
      "Прецизно изрязано закалено стъкло за Huawei P60 Pro с високо-прозрачна структура, запазваща яркостта и цветовете на екрана.",
    features: ["Твърдост 9H", "99.9% прозрачност", "Anti-scratch покритие", "Балон-свободно лепене"],
  },
  {
    id: "p17",
    slug: "pixel-8-pro-protector-privacy",
    name: "Privacy стъклен протектор",
    brand: "google",
    model: "Pixel 8 Pro",
    category: "protectors",
    price: 17.9,
    image: "/images/protector-privacy.png",
    gallery: ["/images/protector-privacy.png"],
    rating: 4.6,
    reviewCount: 47,
    description:
      "Защитава личното пространство на екрана на Pixel 8 Pro — съдържанието е видимо само за вас, докато качеството на дисплея остава непроменено.",
    features: ["Anti-spy защита на 45°", "Твърдост 9H", "Олеофобно покритие", "Лесно апликиране"],
  },
  {
    id: "p18",
    slug: "oneplus-12-protector-glass",
    name: "Закалено стъкло 9H",
    brand: "oneplus",
    model: "OnePlus 12",
    category: "protectors",
    price: 14.9,
    image: "/images/protector-glass.png",
    gallery: ["/images/protector-glass.png"],
    rating: 4.6,
    reviewCount: 39,
    description:
      "Здраво закалено стъкло за OnePlus 12 с прецизни изрези около предната камера и олеофобно покритие срещу мазни отпечатъци.",
    features: ["Твърдост 9H", "Олеофобно покритие", "Прецизни изрези", "Комплект с апликатор"],
  },

  // ---- CHARGERS ----
  {
    id: "p19",
    slug: "fast-charger-20w-usbc",
    name: "Бързо зарядно 20W USB-C",
    brand: "universal",
    model: "Универсално",
    category: "chargers",
    price: 29.9,
    image: "/images/charger-fast-wall.png",
    gallery: ["/images/charger-fast-wall.png"],
    rating: 4.7,
    reviewCount: 256,
    badge: "Хит",
    description:
      "Компактно зарядно устройство с мощност 20W и технология Power Delivery за бързо зареждане на всеки съвременен телефон. Съвместимо с iPhone, Samsung, Xiaomi и др.",
    features: ["Power Delivery 20W", "Защита от прегряване", "Компактен дизайн", "Съвместимо с всички марки"],
  },
  {
    id: "p20",
    slug: "wireless-charging-pad-15w",
    name: "Безжично зарядно пад 15W",
    brand: "universal",
    model: "Универсално",
    category: "chargers",
    price: 34.9,
    oldPrice: 44.9,
    image: "/images/charger-wireless-pad.png",
    gallery: ["/images/charger-wireless-pad.png"],
    rating: 4.6,
    reviewCount: 178,
    badge: "Топ оферта",
    description:
      "Елегантна безжична зарядна станция с мощност до 15W, тапицирана с фина текстилна повърхност. Съвместима с Qi зареждане на всички модерни смартфони.",
    features: ["Qi безжично зареждане 15W", "LED индикатор", "Противоплъзгаща основа", "Защита от прегряване"],
  },

  // ---- CABLES ----
  {
    id: "p21",
    slug: "braided-cable-usbc-usbc",
    name: "Плетен кабел USB-C към USB-C 1м",
    brand: "universal",
    model: "Универсално",
    category: "cables",
    price: 16.9,
    image: "/images/cable-usbc-braided.png",
    gallery: ["/images/cable-usbc-braided.png"],
    rating: 4.7,
    reviewCount: 143,
    description:
      "Здрав найлоново плетен кабел USB-C към USB-C с дължина 1м, издържащ над 10000 огъвания. Поддържа бързо зареждане до 60W.",
    features: ["Найлоново плетиво", "Издържа 10000+ огъвания", "Бързо зареждане до 60W", "Дължина 1м"],
  },
  {
    id: "p22",
    slug: "braided-cable-usbc-lightning",
    name: "Плетен кабел USB-C към Lightning 1м",
    brand: "universal",
    model: "Универсално",
    category: "cables",
    price: 18.9,
    image: "/images/cable-lightning-braided.png",
    gallery: ["/images/cable-lightning-braided.png"],
    rating: 4.6,
    reviewCount: 98,
    description:
      "Найлоново плетен кабел USB-C към Lightning за бързо зареждане на iPhone устройства, сертифициран за издръжливост и стабилна връзка.",
    features: ["Найлоново плетиво", "MFi съвместим", "Бързо зареждане", "Дължина 1м"],
  },

  // ---- EARBUDS ----
  {
    id: "p23",
    slug: "wireless-earbuds-pro-air",
    name: "Безжични слушалки Pro Air",
    brand: "universal",
    model: "Универсално",
    category: "earbuds",
    price: 59.9,
    oldPrice: 79.9,
    image: "/images/earbuds-wireless.png",
    gallery: ["/images/earbuds-wireless.png"],
    rating: 4.8,
    reviewCount: 312,
    badge: "Топ оферта",
    description:
      "Безжични слушалки с активно шумопотискане и до 30 часа общо време на работа с калъфа за зареждане. Кристално чист звук и стабилна Bluetooth връзка.",
    features: ["Активно шумопотискане (ANC)", "До 30ч. с калъфа", "Bluetooth 5.3", "Touch управление"],
  },
  {
    id: "p24",
    slug: "wireless-earbuds-sport",
    name: "Безжични слушалки Sport Buds",
    brand: "universal",
    model: "Универсално",
    category: "earbuds",
    price: 44.9,
    image: "/images/earbuds-wireless.png",
    gallery: ["/images/earbuds-wireless.png"],
    rating: 4.6,
    reviewCount: 154,
    description:
      "Леки спортни слушалки с водоустойчивост IPX5 и сигурно захващане в ухото — перфектни за тренировки и активен начин на живот.",
    features: ["Водоустойчивост IPX5", "Ергономична форма", "До 24ч. с калъфа", "Bluetooth 5.2"],
  },

  // ---- POWERBANKS ----
  {
    id: "p25",
    slug: "powerbank-10000-slim",
    name: "Power Bank 10000mAh Slim",
    brand: "universal",
    model: "Универсално",
    category: "powerbanks",
    price: 39.9,
    image: "/images/powerbank-slim.png",
    gallery: ["/images/powerbank-slim.png"],
    rating: 4.7,
    reviewCount: 122,
    description:
      "Тънка преносима батерия с капацитет 10000mAh — зарежда телефона до 2.5 пъти. Джобен размер, който се побира навсякъде.",
    features: ["Капацитет 10000mAh", "Ултра тънък дизайн", "Двоен USB изход", "LED индикатор за заряд"],
  },
  {
    id: "p26",
    slug: "powerbank-20000-fast",
    name: "Power Bank 20000mAh Fast Charge",
    brand: "universal",
    model: "Универсално",
    category: "powerbanks",
    price: 54.9,
    oldPrice: 64.9,
    image: "/images/powerbank-slim.png",
    gallery: ["/images/powerbank-slim.png"],
    rating: 4.8,
    reviewCount: 201,
    badge: "Хит",
    description:
      "Мощна батерия 20000mAh с поддръжка на бързо зареждане 22.5W — достатъчна за няколко пълни зареждания на телефон и таблет.",
    features: ["Капацитет 20000mAh", "Бързо зареждане 22.5W", "3 изхода едновременно", "Дигитален дисплей за заряд"],
  },

  // ---- STANDS ----
  {
    id: "p27",
    slug: "desk-stand-aluminum",
    name: "Настолна поставка за телефон",
    brand: "universal",
    model: "Универсално",
    category: "stands",
    price: 19.9,
    image: "/images/stand-desk-holder.png",
    gallery: ["/images/stand-desk-holder.png"],
    rating: 4.6,
    reviewCount: 87,
    description:
      "Стабилна алуминиева поставка за бюро с регулируем ъгъл на наклон — удобна за видеоразговори, гледане на видео и работа.",
    features: ["Алуминиева конструкция", "Регулируем ъгъл", "Противоплъзгащи подложки", "Съвместима с всички телефони"],
  },
  {
    id: "p28",
    slug: "car-mount-magnetic",
    name: "Магнитна поставка за кола",
    brand: "universal",
    model: "Универсално",
    category: "stands",
    price: 24.9,
    image: "/images/car-mount.png",
    gallery: ["/images/car-mount.png"],
    rating: 4.7,
    reviewCount: 116,
    badge: "Ново",
    description:
      "Силна магнитна поставка за кола, монтираща се на вентилационната решетка. Сигурно захваща телефона дори при рязко спиране.",
    features: ["Силен неодимов магнит", "360° въртене", "Монтаж на решетка", "Съвместима с MagSafe"],
  },
];

export const FREE_SHIPPING_THRESHOLD = 60;
export const DEFAULT_SHIPPING_FEE = 5.9;

export function formatPrice(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} лв.`;
}

export function getBrand(slug: string) {
  return brands.find((b) => b.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function getBundleProduct(product: Product) {
  if (!product.bundleWith) return undefined;
  return getProductById(product.bundleWith);
}

export function getRelatedProducts(product: Product, limit = 4) {
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.brand === product.brand || p.category === product.category)
    )
    .sort((a, b) => {
      const aScore = (a.brand === product.brand ? 2 : 0) + (a.category === product.category ? 1 : 0);
      const bScore = (b.brand === product.brand ? 2 : 0) + (b.category === product.category ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, limit);
}

export function getBestSellers(limit = 8) {
  return products.filter((p) => p.badge === "Хит" || p.badge === "Топ оферта").slice(0, limit);
}

export function getNewArrivals(limit = 8) {
  return products.filter((p) => p.badge === "Ново").concat(products.slice(0, limit)).slice(0, limit);
}

export function filterProducts(opts: { brand?: string; category?: string; sort?: string; q?: string }) {
  let list = [...products];
  if (opts.brand && opts.brand !== "all") {
    list = list.filter((p) => p.brand === opts.brand);
  }
  if (opts.category && opts.category !== "all") {
    list = list.filter((p) => p.category === opts.category);
  }
  if (opts.q) {
    const query = opts.q.toLowerCase();
    list = list.filter((p) =>
      [p.name, p.model, p.brand, p.category].some((field) => field.toLowerCase().includes(query))
    );
  }
  switch (opts.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      list.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break;
  }
  return list;
}
