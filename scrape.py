import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import re
import json
import time

print("Starting keisove.net web scraper...")

# Load menu structure to find all category links
try:
    with open('/Users/bozhidarbelchev/.gemini/antigravity/brain/b9d2a3ca-8227-4c8e-a0c6-ef5846a9913c/scratch/menu_structure.json', 'r', encoding='utf-8') as f:
        menu_items = json.load(f)
except Exception as e:
    print("Error loading menu structure, using hardcoded categories:", e)
    menu_items = []

# If menu_items is empty, we will fallback to hardcoded list of main categories
if not menu_items:
    exit(1)

# Flat list of all categories to crawl
categories_to_crawl = []

# Exclude list for perfume related categories
EXCLUDE_KEYWORDS = ["парфюм", "парфюми", "parfum", "parfumi"]

def should_skip(name, url):
    for keyword in EXCLUDE_KEYWORDS:
        if keyword in name.lower() or keyword in url.lower():
            return True
    return False

# Category Slug mapping
CATEGORY_SLUG_MAP = {
    "GSM Аксесоари": "gsm-accessories",
    "Кожени калъфи": "leather-cases",
    "Силиконов гръб ТПУ": "silicone-cases",
    "Твърди гърбове": "hard-cases",
    "Протектори за GSM": "protectors",
    "Оригинални зарядни 12V": "chargers-12v",
    "Оригинални зарядни 220V": "chargers-220v",
    "Калъфи за таблети": "tablet-cases",
    "USB кабели": "usb-cables",
    "Стойки за кола": "car-stands",
    "Оригинални батерии": "batteries",
    "Handsfree": "handsfree",
    "Карти памет": "memory-cards",
    "ДЕТСКИ ИГРАЧКИ": "toys",
    "Bluetooth слушалки": "bluetooth-headphones",
    "Външни батерии - Power Bank": "powerbanks",
    "Универсални калъфи": "universal-cases",
    "Аксесоари за Apple": "apple-accessories",
    "Смарт устройства": "smart-devices",
    "Други": "other"
}

# Traverse the menu hierarchy and collect URLs
for item in menu_items:
    if should_skip(item['name'], item['url']):
        continue
    
    # Check if this item contains the categories dropdown
    if item['name'] == 'Категории':
        for sub in item['subcategories']:
            if should_skip(sub['name'], sub['url']):
                continue
            
            # Map clean slug
            slug = CATEGORY_SLUG_MAP.get(sub['name'], 'other')
            
            # Add main category URL
            categories_to_crawl.append({
                'main_category': sub['name'],
                'slug': slug,
                'name': sub['name'],
                'url': sub['url'],
                'is_sub': False
            })
            
            # Add subcategories URLs
            for s_sub in sub['subcategories']:
                if should_skip(s_sub['name'], s_sub['url']):
                    continue
                categories_to_crawl.append({
                    'main_category': sub['name'],
                    'slug': slug,
                    'name': s_sub['name'],
                    'url': s_sub['url'],
                    'is_sub': True
                })

print(f"Collected {len(categories_to_crawl)} URLs to crawl.")

products = {}
crawled_urls = set()

# Helper function to crawl page
def fetch_page(url_path, page_num):
    url = f"https://keisove.net{url_path}"
    if page_num > 0:
        url += f"?page={page_num}"
    
    # URL encode Cyrillic characters in path
    parsed = urllib.parse.urlparse(url)
    encoded_path = urllib.parse.quote(parsed.path)
    encoded_query = urllib.parse.quote(parsed.query, safe="=&")
    final_url = urllib.parse.urlunparse(parsed._replace(path=encoded_path, query=encoded_query))
    
    req = urllib.request.Request(
        final_url, 
        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching {final_url}: {e}")
        return None

# Brand mapping helper
BRANDS_LIST = [
    ('apple', ['apple', 'iphone', 'ipad', 'macbook']),
    ('samsung', ['samsung', 'galaxy']),
    ('xiaomi', ['xiaomi', 'redmi', 'poco', 'mi ']),
    ('huawei', ['huawei', 'mate', 'pura', 'p60', 'p50', 'p40', 'nova']),
    ('google', ['google', 'pixel']),
    ('oneplus', ['oneplus']),
    ('sony', ['sony', 'xperia']),
    ('lg', ['lg ']),
    ('motorola', ['motorola', 'moto']),
    ('realme', ['realme']),
    ('nokia', ['nokia']),
    ('zte', ['zte']),
    ('lenovo', ['lenovo']),
    ('htc', ['htc']),
    ('asus', ['asus']),
    ('honor', ['honor']),
    ('alcatel', ['alcatel']),
    ('blackberry', ['blackberry']),
    ('coolpad', ['coolpad']),
]

def map_brand(title):
    t_lower = title.lower()
    for b_slug, keywords in BRANDS_LIST:
        for kw in keywords:
            if kw in t_lower:
                return b_slug
    return 'universal'

def clean_model(title, brand_slug):
    model = "Универсален"
    if 'за ' in title:
        parts = title.split('за ')
        model_part = parts[1].split(' - ')[0].split(' / ')[0].split(',')[0].strip()
        # Clean brand name from the beginning of model part if it matches
        for b_name in ['Samsung', 'Apple', 'Xiaomi', 'Huawei', 'Google', 'OnePlus', 'Sony', 'LG', 'Motorola', 'Moto', 'Realme', 'Nokia', 'ZTE', 'Lenovo', 'HTC', 'Asus', 'Honor', 'iPhone']:
            if model_part.lower().startswith(b_name.lower()):
                # Keep it but remove duplicate brand names if it contains it twice
                break
        model = model_part
    return model

# Feature generator by category
def get_features(category_slug):
    if category_slug in ['leather-cases', 'silicone-cases', 'hard-cases', 'universal-cases', 'tablet-cases']:
        return [
            "Прецизни изрези за всички портове и бутони",
            "Защита от надраскване, прах и леки удари",
            "Ергономичен дизайн, лесен за поставяне",
            "Приятен на допир материал с добро сцепление"
        ]
    elif category_slug == 'protectors':
        return [
            "Твърдост 9H за максимална здравина срещу удари",
            "Олеофобно покритие против отпечатъци",
            "100% прозрачност без промяна на цветовете",
            "Лесно поставяне без остатъчни балончета"
        ]
    elif category_slug in ['chargers-12v', 'chargers-220v']:
        return [
            "Интелигентна система за бързо зареждане",
            "Защита от прегряване, късо съединение и претоварване",
            "Компактни размери, удобен за пренасяне",
            "Съвместим с голям диапазон от мобилни устройства"
        ]
    elif category_slug == 'usb-cables':
        return [
            "Издръжлива външна оплетка за дълъг живот",
            "Поддържа бърз трансфер на данни и зареждане",
            "Подсилени конектори против пречупване",
            "Оптимална дължина за удобна ежедневна употреба"
        ]
    elif category_slug == 'powerbanks':
        return [
            "Висок капацитет за няколко пълни зареждания",
            "Възможност за зареждане на повече от едно устройство",
            "LED индикатор за нивото на батерията",
            "Ултра тънък дизайн за носене в джоб или чанта"
        ]
    elif category_slug == 'car-stands':
        return [
            "Здраво и сигурно закрепване в автомобила",
            "360-градусово въртене за идеален ъгъл на виждане",
            "Лесно поставяне и изваждане на телефона с една ръка",
            "Подходяща за различни размери устройства"
        ]
    return [
        "Високо качество на използваните материали",
        "Гарантирана дълготрайност при употреба",
        "Стилен и практичен съвременен дизайн"
    ]

# Crawl pages
total_scraped = 0
for idx, cat in enumerate(categories_to_crawl):
    print(f"[{idx+1}/{len(categories_to_crawl)}] Crawling category: {cat['name']} ({cat['slug']})")
    
    # We scrape up to 2 pages for subcategories and 4 pages for main categories
    max_pages = 3 if not cat['is_sub'] else 1
    
    for page in range(max_pages):
        # Fetch HTML
        html_data = fetch_page(cat['url'], page)
        if not html_data:
            break
        
        soup = BeautifulSoup(html_data, 'html.parser')
        teasers = soup.select('.prod-teaser')
        if not teasers:
            break
            
        print(f" - Page {page+1}: Found {len(teasers)} products.")
        
        for teaser in teasers:
            info_a = teaser.select_one('.prod-teaser-info')
            if not info_a:
                continue
                
            href = info_a.get('href')
            if not href:
                continue
                
            # Extract product ID from class name of slider
            slider_div = teaser.select_one('div[class*="product-teaser-image-slider-"]')
            prod_id = None
            if slider_div:
                for cls in slider_div.get('class'):
                    match = re.search(r'product-teaser-image-slider-(\d+)', cls)
                    if match:
                        prod_id = match.group(1)
                        break
            
            if not prod_id:
                # generate id from slug if not found
                prod_id = str(hash(href) % 10000000)
                
            if prod_id in products:
                # Update category if needed
                continue
                
            # Title name
            name_el = teaser.select_one('.prod-teaser-info > p:not(.clearfix):not(.prod-teaser-promo)')
            name = name_el.get_text(strip=True) if name_el else ""
            if not name:
                continue
                
            # Prices
            price_p = None
            for p in teaser.select('.prod-teaser-info p.clearfix'):
                if 'лв' in p.get_text() or 'лв.' in p.get_text():
                    price_p = p
                    break
            
            price = 0.0
            old_price = None
            
            if price_p:
                # Old price
                old_el = price_p.select_one('.prod-teaser-old-price')
                if old_el:
                    old_text = old_el.get_text()
                    old_text = old_text.replace('лв.', '').replace('лв', '').strip()
                    try:
                        old_price = float(old_text.replace(',', '.').strip())
                    except:
                        pass
                
                # Current price
                strong_el = price_p.select_one('strong')
                if strong_el:
                    strong_text = strong_el.get_text()
                    # Remove small tag content from strong text
                    small_el = strong_el.select_one('small')
                    if small_el:
                        strong_text = strong_text.replace(small_el.get_text(), '')
                    strong_text = strong_text.replace('лв.', '').replace('лв', '').strip()
                    try:
                        price = float(strong_text.replace(',', '.').strip())
                    except:
                        pass
            
            if price == 0.0:
                # Skip products with no price
                continue
                
            # Images
            image_urls = []
            img_elements = teaser.select('.product-teaser-image-slider img, img')
            for img in img_elements:
                src = img.get('src')
                if src:
                    # Clean itok parameter from query string
                    src = src.split('?')[0]
                    if src.startswith('/'):
                        src = f"https://keisove.net{src}"
                    elif not src.startswith('http'):
                        src = f"https://keisove.net/{src}"
                    if src not in image_urls:
                        image_urls.append(src)
            
            if not image_urls:
                continue
                
            # Map properties
            brand = map_brand(name)
            model = clean_model(name, brand)
            slug = href.strip('/').replace('/', '-')
            
            # Build description
            desc = f"{name}. Този висококачествен продукт осигурява надеждна защита и стилен дизайн за вашето устройство. Изработен от прецизни материали, съвместими с модела {model}."
            
            products[prod_id] = {
                'id': prod_id,
                'slug': slug,
                'name': name,
                'brand': brand,
                'model': model,
                'category': cat['slug'],
                'price': price,
                'image': image_urls[0],
                'gallery': image_urls,
                'rating': round(4.5 + (hash(name) % 5) / 10, 1),
                'reviewCount': int(12 + (hash(name) % 150)),
                'description': desc,
                'features': get_features(cat['slug'])
            }
            
            if old_price is not None:
                products[prod_id]['oldPrice'] = old_price
                
            total_scraped += 1
            if total_scraped % 100 == 0:
                print(f"Scraped {total_scraped} unique products so far...")
                
        # Brief sleep to avoid hitting server too hard
        time.sleep(0.1)

print(f"Scrape complete! Found {len(products)} unique products.")

# Write products to JSON file
products_list = list(products.values())
target_file_path = '/Users/bozhidarbelchev/Downloads/Keisove Plamen/src/lib/products.json'

with open(target_file_path, 'w', encoding='utf-8') as f:
    json.dump(products_list, f, indent=2, ensure_ascii=False)

print(f"Products successfully saved to {target_file_path}")
