"""Tiki ALL categories scraper — Playwright (anti-bot bypass).

Usage:
    python scraper_tiki_all.py

Output: data/tiki_products.json
"""
import json
import sys
from pathlib import Path

from slugify import slugify
from playwright.sync_api import sync_playwright

# ── Config ────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent / 'data'
OUTPUT_FILE = DATA_DIR / 'tiki_products.json'
BASE_URL = 'https://tiki.vn'
API_URL = 'https://tiki.vn/api/personalish/v1/blocks/listings'
CATS_API = 'https://tiki.vn/api/v2/categories'

HEADERS = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': f'{BASE_URL}/',
}

# Root food category IDs on Tiki
ROOT_FOOD_CATS = {
    4421: 'Đồ Ăn Vặt',
    15074: 'Thực phẩm Đóng hộp và Khô',
    24024: 'Đồ Uống Không Cồn',
    4422: 'Gia Vị và Chế Biến',
    22998: 'Đồ uống',
    53562: 'Sữa',
    68576: 'Ngũ cốc và mứt',
    53582: 'Rượu bia',
}

# ── Category name → target English name ──────────────────────────
CATEGORY_MAP = {
    'Đồ Ăn Vặt': 'Snacks', 'Bánh': 'Snacks', 'Kẹo': 'Candy',
    'Chocolate': 'Snacks', 'Snack': 'Snacks', 'Bánh kẹo khác': 'Snacks',
    'Các Loại Đồ Ăn Vặt Khác': 'Snacks', 'Thạch các loại': 'Snacks',
    'Pudding': 'Snacks', 'Mứt trái cây': 'Fruits',
    'Các loại rong biển ăn liền': 'Snacks', 'Khoai tây lát': 'Snacks',
    'Các loại đậu sấy khô': 'Snacks', 'Các loại hạt sấy khô': 'Snacks',
    'Trái cây rau củ sấy': 'Fruits', 'Mứt và Bơ thực vật': 'Snacks',
    'Bánh tráng': 'Snacks', 'Rong muối và gia vị': 'Seasoning',
    'Socola': 'Snacks', 'Kẹo & Chocolate': 'Candy',
    'Thực phẩm Đóng hộp và Khô': 'Others', 'Đồ khô': 'Others',
    'Nấm và hải sản khô': 'Seafood', 'Đậu và ngũ cốc': 'Rice',
    'Đồ Uống Không Cồn': 'Beverages', 'Nước trái cây': 'Beverages',
    'Nước ngọt': 'Beverages', 'Nước khoáng & nước uống': 'Beverages',
    'Trà': 'Tea', 'Nước uống tăng lực': 'Beverages',
    'Nước uống khác': 'Beverages', 'Sinh tố và nước ép': 'Beverages',
    'Đồ uống khác': 'Beverages', 'Gia Vị và Chế Biến': 'Seasoning',
    'Nước mắm': 'Sauce', 'Nước chấm': 'Sauce', 'Gia vị': 'Seasoning',
    'Sốt': 'Sauce', 'Mắm': 'Sauce', 'Dầu ăn & Dầu oliu': 'Cooking Oil',
    'Giấm': 'Sauce', 'Nước tương': 'Sauce', 'Gia vị khác': 'Seasoning',
    'Đồ uống': 'Beverages', 'Nước giải khát': 'Beverages',
    'Trà & Cà phê': 'Tea', 'Cà phê': 'Coffee',
    'Sữa': 'Milk', 'Sữa tươi': 'Milk', 'Sữa đặc': 'Milk',
    'Sữa chua': 'Milk', 'Phô mai': 'Milk', 'Bơ': 'Milk',
    'Kem': 'Milk', 'Sữa bột': 'Milk', 'Sữa hạt': 'Milk',
    'Ngũ cốc và mứt': 'Others', 'Ngũ cốc': 'Others', 'Mứt': 'Others',
    'Bơ thực vật': 'Cooking Oil', 'Rượu, bia và nước lên men': 'Beverages',
}


def map_category(name: str) -> str:
    """Map Tiki Vietnamese category name → target English name."""
    if name in CATEGORY_MAP:
        return CATEGORY_MAP[name]
    for k, v in CATEGORY_MAP.items():
        if k.lower() in name.lower() or name.lower() in k.lower():
            return v
    return 'Others'


def parse_product(raw: dict, idx: int, cat: str, tiki_cat_id: int) -> dict:
    """Convert raw Tiki API item → project schema."""
    price = raw.get('price', 0) or 0
    orig = raw.get('original_price', 0) or 0
    sale = price if (orig and price < orig) else None
    qs = raw.get('quantity_sold', {})
    sold = qs.get('value', 0) if isinstance(qs, dict) else 0
    rating = raw.get('rating_average', 0) or 0
    reviews = raw.get('review_count', 0) or 0
    sku = raw.get('sku', '')
    brand = raw.get('brand_name', '')
    url_key = raw.get('url_key', '') or ''
    slug = url_key or (slugify((raw.get('name', '') or '')[:80]) or f'tiki-{idx:06d}')
    return {
        'id': f'p-tiki-{idx:06d}',
        'sku': sku or f'TIKI-{idx:06d}',
        'slug': slug,
        'barcode': raw.get('barcode', '') or '',
        'name': raw.get('name', ''),
        'brand': brand,
        'category': cat,
        'tiki_category_id': tiki_cat_id,
        'description': raw.get('short_description', '') or '',
        'price': price,
        'unit': 'item',
        'stock': sold,
        'rating': rating,
        'gallery': [],
        'nutrition': {k: 0.0 for k in ('energy_kcal', 'fat', 'saturated_fat',
                                        'carbohydrates', 'sugars', 'protein',
                                        'fiber', 'salt')},
        'badges': [b.get('code', '') for b in raw.get('badges', [])
                   if isinstance(b, dict) and b.get('code')],
        'active': True,
        'createdAt': '2026-01-01T00:00:00.000Z',
        'updatedAt': '2026-06-29T00:00:00.000Z',
        'image_url': raw.get('thumbnail_url', ''),
        'sale_price': sale,
        'review_count': reviews,
        'sold_count': sold,
        'isFeatured': False,
        'in_stock': raw.get('availability', 1) > 0,
        'origin': 'Việt Nam',
        'source': 'Tiki',
        'tiki_id': raw.get('id'),
        'tiki_url': raw.get('url_path', ''),
    }


def fetch_subcategories(page, parent_id: int, depth: int = 0, max_depth: int = 2):
    """Recursively fetch subcategories via browser context."""
    cats = {}
    try:
        resp = page.evaluate(f'''
            async () => {{
                const r = await fetch('{CATS_API}?parent_id={parent_id}', {{
                    headers: {{'Accept':'application/json'}}
                }});
                return (await r.json()).data || [];
            }}
        ''')
        for c in resp:
            cid = c.get('id')
            cats[cid] = {
                'name': c.get('name', ''),
                'is_leaf': c.get('is_leaf', True),
                'count': c.get('product_count', 0),
                'depth': depth,
                'parent_id': parent_id,
            }
            if not c.get('is_leaf', True) and depth < max_depth:
                cats.update(fetch_subcategories(page, cid, depth + 1, max_depth))
    except Exception:
        pass
    return cats


def scrape_category(page, cid: int, cname: str, target_cat: str,
                    seen_ids: set, seen_slugs: set) -> list:
    """Paginate all products from a single category."""
    products = []
    idx = 0
    page_num = 1
    empty_run = 0
    # Estimate max pages from product_count
    max_p = 100  # safety cap
    print(f'  [{cid}] {cname[:30]:30s} -> {target_cat:15s} ', end='', flush=True)

    while page_num <= max_p:
        try:
            result = page.evaluate(f'''
                async () => {{
                    const r = await fetch('{API_URL}?category={cid}&limit=40&page={page_num}', {{
                        headers: {{
                            'Accept':'application/json',
                            'X-Requested-With':'XMLHttpRequest',
                            'Referer':'{BASE_URL}/'
                        }}
                    }});
                    if (!r.ok) return {{error: r.status}};
                    const d = await r.json();
                    return {{products: d.data || [], total: d.paging?.total || 0}};
                }}
            ''')
            if 'error' in result:
                if result['error'] == 429:
                    page.wait_for_timeout(5000)
                    continue
                break

            items = result.get('products', [])
            if not items:
                empty_run += 1
                if empty_run >= 3:
                    break
                page_num += 1
                continue
            empty_run = 0

            for raw in items:
                tid = raw.get('id')
                if not tid or tid in seen_ids:
                    continue
                seen_ids.add(tid)
                name = (raw.get('name') or '').strip()
                if not name or len(name) < 3:
                    continue
                p = parse_product(raw, len(products) + idx, target_cat, cid)
                s = p['slug']
                if s in seen_slugs:
                    p['slug'] = f'{s}-{len(products) + idx:06d}'
                seen_slugs.add(p['slug'])
                products.append(p)

            page_num += 1
        except Exception as e:
            print(f'ERR:{e}', end='')
            break

    print(f'{len(products)} products')
    return products


def main():
    print('=== Tiki Scraper (Playwright) ===')
    print('[1/3] Opening browser...')
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled', '--no-sandbox']
        )
        context = browser.new_context(
            user_agent=(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/120.0.0.0 Safari/537.36'
            ),
            viewport={'width': 1280, 'height': 800},
            locale='vi-VN',
        )
        page = context.new_page()

        print('[2/3] Loading Tiki homepage...')
        page.goto(f'{BASE_URL}/', wait_until='domcontentloaded', timeout=30000)
        page.wait_for_timeout(2000)

        print('[3/3] Fetching category tree...')
        all_cats = {}
        for pid in ROOT_FOOD_CATS:
            all_cats.update(fetch_subcategories(page, pid, depth=1))
        # Ensure root cats are included even if subcat fetch returned nothing
        for pid, pname in ROOT_FOOD_CATS.items():
            if pid not in all_cats:
                all_cats[pid] = {
                    'name': pname, 'is_leaf': False,
                    'count': 0, 'depth': 0,
                }

        print(f'  Total categories found: {len(all_cats)}')
        # Scrape all leaves and root-level categories
        targets = {k: v for k, v in all_cats.items()
                   if v['is_leaf'] or v['depth'] == 0}
        print(f'  Scrape targets: {len(targets)}')

        # Scrape!
        all_products = []
        seen_ids = set()
        seen_slugs = set()

        for cid, cat in sorted(targets.items(),
                               key=lambda x: (x[1]['depth'], -x[1].get('count', 0))):
            cname = cat['name']
            if cname in ('Chăm sóc thú cưng', 'Bộ quà tặng'):
                continue  # skip non-food
            target_cat = map_category(cname)
            products = scrape_category(page, cid, cname, target_cat,
                                       seen_ids, seen_slugs)
            all_products.extend(products)
            if products:
                page.wait_for_timeout(200)

        browser.close()

    # Summary
    print(f'\n=== DONE ===')
    print(f'Total products: {len(all_products)}')
    cat_counts = {}
    for p in all_products:
        c = p['category']
        cat_counts[c] = cat_counts.get(c, 0) + 1
    for c, n in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f'  {c}: {n}')

    # Save
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    print(f'\nSaved: {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
