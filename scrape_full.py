"""
Full catalog scraper for keisove.net -> Keisove Plamen (Next.js) migration.

Strategy: Drupal taxonomy parent-category pages already aggregate all
descendant (brand-specific) subcategory products, so we only need to crawl
the 20 non-perfume TOP-LEVEL category pages (not the ~136 brand subcategory
pages) to capture the full catalog. Perfume categories/products are fully
excluded per requirements.

Categories are crawled most-specific-first so that a product occurring in
both a specific category (e.g. "Кожени калъфи") and the generic catch-all
("GSM Аксесоари") gets the specific category assigned (first-seen wins in
the global dedupe dict).
"""
import json
import re
import time
import threading
import urllib.parse
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

TARGET_FILE = "/Users/bozhidarbelchev/Downloads/Keisove Plamen/src/lib/products.json"
CHECKPOINT_FILE = "/Users/bozhidarbelchev/Downloads/Keisove Plamen/scrape_progress.log"

EXCLUDE_KEYWORDS = ["парфюм", "parfum", "parfumi"]

# Priority order: most specific product-type categories first, generic
# "GSM Аксесоари" catch-all last.
CATEGORIES = [
    ("leather-cases", "/аксесоари/кожени-калъфи-2"),
    ("silicone-cases", "/аксесоари/силиконов-гръб-тпу-2"),
    ("hard-cases", "/аксесоари/твърди-гърбове-0"),
    ("protectors", "/аксесоари/протектори-за-gsm-2"),
    ("tablet-cases", "/аксесоари/калъфи-за-таблети-2"),
    ("universal-cases", "/аксесоари/универсални-калъфи-2"),
    ("chargers-12v", "/аксесоари/оригинални-зарядни-12v-2"),
    ("chargers-220v", "/аксесоари/оригинални-зарядни-220v-2"),
    ("usb-cables", "/аксесоари/usb-кабели-2"),
    ("car-stands", "/аксесоари/стойки-за-кола-2"),
    ("batteries", "/аксесоари/оригинални-батерии-2"),
    ("handsfree", "/аксесоари/handsfree-2"),
    ("bluetooth-headphones", "/аксесоари/bluetooth-слушалки-2"),
    ("powerbanks", "/аксесоари/външни-батерии-power-bank-2"),
    ("memory-cards", "/аксесоари/карти-памет-2"),
    ("toys", "/аксесоари/детски-играчки"),
    ("smart-devices", "/аксесоари/смарт-устройства"),
    ("apple-accessories", "/аксесоари/аксесоари-за-apple-2"),
    ("other", "/аксесоари/други-2"),
    ("gsm-accessories", "/аксесоари/gsm-аксесоари-2"),
]

BRANDS_LIST = [
    ("apple", ["apple", "iphone", "ipad", "macbook"]),
    ("samsung", ["samsung", "galaxy"]),
    ("xiaomi", ["xiaomi", "redmi", "poco", "mi "]),
    ("huawei", ["huawei", "mate", "pura", "p60", "p50", "p40", "nova"]),
    ("google", ["google", "pixel"]),
    ("oneplus", ["oneplus"]),
    ("sony", ["sony ericsson", "sony", "xperia"]),
    ("lg", ["lg "]),
    ("motorola", ["motorola", "moto"]),
    ("realme", ["realme"]),
    ("nokia", ["nokia"]),
    ("zte", ["zte"]),
    ("lenovo", ["lenovo"]),
    ("htc", ["htc"]),
    ("asus", ["asus"]),
    ("honor", ["honor"]),
    ("alcatel", ["alcatel"]),
    ("blackberry", ["blackberry"]),
    ("coolpad", ["coolpad"]),
    ("telenor", ["telenor"]),
    ("microsoft", ["microsoft", "lumia"]),
    ("a1", ["a1 "]),
    ("cat", ["cat "]),
    ("acer", ["acer"]),
    ("meizu", ["meizu"]),
]


def map_brand(title):
    t_lower = title.lower()
    for b_slug, keywords in BRANDS_LIST:
        for kw in keywords:
            if kw in t_lower:
                return b_slug
    return "universal"


def clean_model(title):
    model = "Универсален"
    if "за " in title:
        parts = title.split("за ")
        model_part = parts[1].split(" - ")[0].split(" / ")[0].split(",")[0].strip()
        model = model_part
    return model


def get_features(category_slug):
    if category_slug in ["leather-cases", "silicone-cases", "hard-cases", "universal-cases", "tablet-cases"]:
        return [
            "Прецизни изрези за всички портове и бутони",
            "Защита от надраскване, прах и леки удари",
            "Ергономичен дизайн, лесен за поставяне",
            "Приятен на допир материал с добро сцепление",
        ]
    elif category_slug == "protectors":
        return [
            "Твърдост 9H за максимална здравина срещу удари",
            "Олеофобно покритие против отпечатъци",
            "100% прозрачност без промяна на цветовете",
            "Лесно поставяне без остатъчни балончета",
        ]
    elif category_slug in ["chargers-12v", "chargers-220v"]:
        return [
            "Интелигентна система за бързо зареждане",
            "Защита от прегряване, късо съединение и претоварване",
            "Компактни размери, удобен за пренасяне",
            "Съвместим с голям диапазон от мобилни устройства",
        ]
    elif category_slug == "usb-cables":
        return [
            "Издръжлива външна оплетка за дълъг живот",
            "Поддържа бърз трансфер на данни и зареждане",
            "Подсилени конектори против пречупване",
            "Оптимална дължина за удобна ежедневна употреба",
        ]
    elif category_slug == "powerbanks":
        return [
            "Висок капацитет за няколко пълни зареждания",
            "Възможност за зареждане на повече от едно устройство",
            "LED индикатор за нивото на батерията",
            "Ултра тънък дизайн за носене в джоб или чанта",
        ]
    elif category_slug == "car-stands":
        return [
            "Здраво и сигурно закрепване в автомобила",
            "360-градусово въртене за идеален ъгъл на виждане",
            "Лесно поставяне и изваждане на телефона с една ръка",
            "Подходяща за различни размери устройства",
        ]
    return [
        "Високо качество на използваните материали",
        "Гарантирана дълготрайност при употреба",
        "Стилен и практичен съвременен дизайн",
    ]


session = requests.Session()
retry = Retry(total=4, backoff_factor=0.6, status_forcelist=[429, 500, 502, 503, 504])
adapter = HTTPAdapter(max_retries=retry, pool_connections=20, pool_maxsize=20)
session.mount("https://", adapter)
session.mount("http://", adapter)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "bg-BG,bg;q=0.9,en-US;q=0.8,en;q=0.7",
}


def build_url(url_path, page):
    # Category taxonomy views on this site are the SECOND pager on the page
    # (pager_element 1), so pagination requires the multi-pager query format
    # "page=0,N" -- plain "page=N" silently targets a nonexistent first
    # pager and always returns page 0's content.
    url = f"https://keisove.net{url_path}"
    if page > 0:
        url += f"?page=0,{page}"
    parsed = urllib.parse.urlparse(url)
    encoded_path = urllib.parse.quote(parsed.path)
    encoded_query = urllib.parse.quote(parsed.query, safe="=&,")
    return urllib.parse.urlunparse(parsed._replace(path=encoded_path, query=encoded_query))


def fetch_page(url_path, page):
    url = build_url(url_path, page)
    try:
        time.sleep(0.1)
        resp = session.get(url, headers=HEADERS, timeout=25)
        if resp.status_code != 200:
            return None
        return resp.text
    except Exception as e:
        print(f"    ! Error fetching {url}: {e}")
        return None


def get_last_page_index(html):
    soup = BeautifulSoup(html, "html.parser")
    last_link = soup.select_one(".pager-last a")
    if not last_link:
        return 0
    href = last_link.get("href", "")
    m = re.search(r"page=(?:\d+%2C)?(\d+)", href)
    return int(m.group(1)) if m else 0


def parse_teasers(html, cat_slug):
    soup = BeautifulSoup(html, "html.parser")
    teasers = soup.select(".prod-teaser")
    out = []
    for teaser in teasers:
        info_a = teaser.select_one(".prod-teaser-info")
        if not info_a:
            continue
        href = info_a.get("href")
        if not href:
            continue

        slider_div = teaser.select_one('div[class*="product-teaser-image-slider-"]')
        prod_id = None
        if slider_div:
            for cls in slider_div.get("class"):
                m = re.search(r"product-teaser-image-slider-(\d+)", cls)
                if m:
                    prod_id = m.group(1)
                    break
        if not prod_id:
            prod_id = str(abs(hash(href)) % 100000000)

        name_el = teaser.select_one(".prod-teaser-info > p:not(.clearfix):not(.prod-teaser-promo)")
        name = name_el.get_text(strip=True) if name_el else ""
        if not name:
            continue

        if any(kw in name.lower() or kw in href.lower() for kw in EXCLUDE_KEYWORDS):
            continue

        price_p = None
        for p in teaser.select(".prod-teaser-info p.clearfix"):
            if "лв" in p.get_text():
                price_p = p
                break

        price = 0.0
        old_price = None
        if price_p:
            old_el = price_p.select_one(".prod-teaser-old-price")
            if old_el:
                old_text = old_el.get_text().replace("лв.", "").replace("лв", "").strip()
                try:
                    old_price = float(old_text.replace(",", "."))
                except Exception:
                    pass
            strong_el = price_p.select_one("strong")
            if strong_el:
                strong_text = strong_el.get_text()
                small_el = strong_el.select_one("small")
                if small_el:
                    strong_text = strong_text.replace(small_el.get_text(), "")
                strong_text = strong_text.replace("лв.", "").replace("лв", "").strip()
                try:
                    price = float(strong_text.replace(",", "."))
                except Exception:
                    pass

        if price == 0.0:
            continue

        image_urls = []
        for img in teaser.select(".product-teaser-image-slider img, img"):
            src = img.get("src")
            if not src:
                continue
            src = src.split("?")[0]
            if src.startswith("/"):
                src = f"https://keisove.net{src}"
            elif not src.startswith("http"):
                src = f"https://keisove.net/{src}"
            if src not in image_urls:
                image_urls.append(src)
        if not image_urls:
            continue

        brand = map_brand(name)
        model = clean_model(name)
        slug = href.strip("/").replace("/", "-")
        desc = (
            f"{name}. Този висококачествен продукт осигурява надеждна защита и стилен дизайн "
            f"за вашето устройство. Изработен от прецизни материали, съвместими с модела {model}."
        )

        product = {
            "id": prod_id,
            "slug": slug,
            "name": name,
            "brand": brand,
            "model": model,
            "category": cat_slug,
            "price": price,
            "image": image_urls[0],
            "gallery": image_urls,
            "rating": round(4.5 + (hash(name) % 5) / 10, 1),
            "reviewCount": int(12 + (hash(name) % 150)),
            "description": desc,
            "features": get_features(cat_slug),
        }
        if old_price is not None and old_price > price:
            product["oldPrice"] = old_price
        out.append(product)
    return out


products = {}
lock = threading.Lock()
stats = {"pages_fetched": 0, "pages_failed": 0}


def process_page(cat_slug, url_path, page_num):
    html = fetch_page(url_path, page_num)
    if html is None:
        with lock:
            stats["pages_failed"] += 1
        return 0
    items = parse_teasers(html, cat_slug)
    added = 0
    with lock:
        stats["pages_fetched"] += 1
        for p in items:
            if p["id"] not in products:
                products[p["id"]] = p
                added += 1
    return added


def checkpoint_save():
    products_list = list(products.values())
    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        json.dump(products_list, f, indent=2, ensure_ascii=False)
    with open(CHECKPOINT_FILE, "a", encoding="utf-8") as f:
        f.write(f"{time.strftime('%H:%M:%S')} checkpoint: {len(products_list)} unique products saved\n")


def main():
    open(CHECKPOINT_FILE, "w").close()
    print(f"Starting full crawl of {len(CATEGORIES)} categories...")

    for idx, (cat_slug, url_path) in enumerate(CATEGORIES):
        first_html = fetch_page(url_path, 0)
        if first_html is None:
            print(f"[{idx+1}/{len(CATEGORIES)}] {cat_slug}: FAILED to fetch first page, skipping")
            continue

        last_page = get_last_page_index(first_html)
        total_pages = last_page + 1
        print(f"[{idx+1}/{len(CATEGORIES)}] {cat_slug}: {total_pages} pages to crawl ({url_path})")

        items = parse_teasers(first_html, cat_slug)
        with lock:
            stats["pages_fetched"] += 1
            new_count = 0
            for p in items:
                if p["id"] not in products:
                    products[p["id"]] = p
                    new_count += 1

        if total_pages > 1:
            with ThreadPoolExecutor(max_workers=6) as executor:
                futures = {
                    executor.submit(process_page, cat_slug, url_path, page): page
                    for page in range(1, total_pages)
                }
                done_count = 0
                for future in as_completed(futures):
                    future.result()
                    done_count += 1
                    if done_count % 100 == 0:
                        with lock:
                            total_so_far = len(products)
                        print(f"    ... {done_count}/{total_pages - 1} pages done, {total_so_far} unique products so far")
                        checkpoint_save()

        with lock:
            total_so_far = len(products)
        print(f"[{idx+1}/{len(CATEGORIES)}] {cat_slug}: done. Running total unique products: {total_so_far}")
        checkpoint_save()

    print(f"\nScrape complete! {len(products)} unique products, {stats['pages_fetched']} pages fetched, {stats['pages_failed']} failed.")
    checkpoint_save()
    print(f"Saved to {TARGET_FILE}")


if __name__ == "__main__":
    main()
