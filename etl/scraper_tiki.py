"""
Tiki scraper — scrape food categories via working listing API.
Strategy: parent categories work, paginate 40/page, deduplicate by tiki_id.
Output: etl/data/tiki_products.json
"""
import json
import time
from pathlib import Path
from typing import Dict, List, Set
import requests
from slugify import slugify

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://tiki.vn/',
}
API_URL = 'https://tiki.vn/api/personalish/v1/blocks/listings'
OUTPUT_PATH = Path(__file__).parent / 'data' / 'tiki_products.json'
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# Parent categories under c4384 that work via API
PARENT_CATEGORIES = {
    4421:  "Snacks",
    15074: "Rice",
    22998: "Beverages",
    4422:  "Sauce",
    53582: "Beverages",
    53562: "Milk",
    68576: "Milk",
    53558: "Snacks",
    8240:  "Snacks",
    11251: "Snacks",
    11252: "Baby",
    5479:  "Rice",
    11347: "Snacks",
}

# Override specific child categories within parents
OVERRIDE = {
    # Within 4421 (Snacks) — mostly snacks already
    # Within 15074 (Rice) — mixed
    4420: "Instant Noodles", 68556: "Instant Noodles", 68557: "Instant Noodles",
    68558: "Instant Noodles", 68559: "Instant Noodles", 68560: "Instant Noodles",
    68561: "Instant Noodles", 68562: "Instant Noodles", 68555: "Instant Noodles",
    4419: "Snacks", 8279: "Snacks", 8280: "Snacks", 8281: "Snacks",
    # Within 4422 (Sauce) — cooking oil
    5477: "Cooking Oil", 8284: "Cooking Oil", 8285: "Cooking Oil",
    8286: "Cooking Oil", 68442: "Cooking Oil", 68443: "Cooking Oil", 68445: "Cooking Oil",
    # Within 22998 (Beverages) — coffee
    4423: "Coffee",
    # Within 11252 (Baby)
    11251: "Snacks",
}


def get_category(cat_id, limit=40, page=1):
    try:
        r = requests.get(API_URL, headers=HEADERS,
                         params={'category': cat_id, 'limit': limit, 'page': page},
                         timeout=15)
        if r.status_code != 200:
            return [], 0
        data = r.json()
        return data.get('data', []), data.get('paging', {}).get('total', 0)
    except Exception as e:
        print(f"    Error: {e}")
        return [], 0


def parse_product(p, global_idx, default_cat):
    price = p.get('price', 0) or 0
    orig_price = p.get('original_price', 0) or 0
    sale_price = price if (orig_price and price < orig_price) else None
    qs = p.get('quantity_sold', {})
    sold = qs.get('value', 0) if isinstance(qs, dict) else 0
    rating = p.get('rating_average', 0) or 0
    reviews = p.get('review_count', 0) or 0
    sku = p.get('sku', '')
    barcode = ''
    if sku:
        d = ''.join(c for c in sku if c.isdigit())
        if 8 <= len(d) <= 13:
            barcode = d
    brand = p.get('brand_name', '')
    tags = ['tiki', default_cat.lower()]
    if brand:
        tags.insert(0, brand.lower().replace(' ', '-'))
    url_key = p.get('url_key', '') or ''
    slug = url_key if url_key else (slugify((p.get('name', '') or '')[:80]) or f'tiki-{global_idx:06d}')
    return {
        'id': f'p-{global_idx:06d}',
        'sku': sku or f'TIKI-{global_idx:06d}',
        'slug': slug,
        'barcode': barcode,
        'name': p.get('name', ''),
        'brand': brand,
        'category': default_cat,
        'description': p.get('short_description', '') or '',
        'price': price,
        'unit': 'item',
        'stock': sold,
        'rating': rating,
        'gallery': [],
        'nutrition': {'energy_kcal': 0, 'fat': 0.0, 'saturated_fat': 0.0,
                      'carbohydrates': 0.0, 'sugars': 0.0, 'protein': 0.0,
                      'fiber': 0.0, 'salt': 0.0},
        'tags': tags,
        'badges': [b.get('code', '') for b in p.get('badges', [])
                   if isinstance(b, dict) and b.get('code')],
        'active': True,
        'createdAt': '2026-01-01T00:00:00.000Z',
        'updatedAt': '2026-06-29T00:00:00.000Z',
        'image_url': p.get('thumbnail_url', ''),
        'sale_price': sale_price,
        'review_count': reviews,
        'sold_count': sold,
        'isFeatured': False,
        'in_stock': p.get('availability', 1) > 0,
        'origin': 'Việt Nam',
        'source': 'Tiki',
        'tiki_id': p.get('id'),
        'tiki_url': p.get('url_path', ''),
    }


def resolve_category(raw_product, fallback_cat):
    path = raw_product.get('primary_category_path', '')
    if not path:
        return fallback_cat
    for part in reversed(path.split('/')):
        cid = int(part)
        if cid in OVERRIDE:
            return OVERRIDE[cid]
    return fallback_cat


def main():
    all_products = []  # list of parsed products
    seen_tiki_ids = set()
    seen_slugs = set()
    global_idx = 0

    print("=== Tiki Scraper ===")
    print(f"Target: {len(PARENT_CATEGORIES)} parent categories\n")

    for cat_id, fallback_cat in PARENT_CATEGORIES.items():
        print(f"[{cat_id}] Scanning... ", end='', flush=True)
        items, total = get_category(cat_id, limit=1, page=1)
        print(f"total={total} products")

        if total == 0:
            continue

        page = 1
        cat_count = 0
        max_pages = min((total + 39) // 40, 100)  # safety cap ~4000 products

        while page <= max_pages:
            items, _ = get_category(cat_id, limit=40, page=page)
            if not items:
                break

            for raw in items:
                tiki_id = raw.get('id')
                if tiki_id in seen_tiki_ids:
                    continue
                seen_tiki_ids.add(tiki_id)

                cat = resolve_category(raw, fallback_cat)
                parsed = parse_product(raw, global_idx, cat)

                # Slug dedup
                slug = parsed['slug']
                if slug in seen_slugs:
                    parsed['slug'] = f"{slug}-{global_idx:06d}"
                seen_slugs.add(parsed['slug'])

                all_products.append(parsed)
                global_idx += 1
                cat_count += 1

            page += 1
            time.sleep(0.3)

        print(f"  -> {cat_count} unique products collected")
        time.sleep(0.5)

    # Summary
    print(f"\n=== DONE ===")
    print(f"Total unique Tiki products: {len(all_products)}")
    cats = {}
    for p in all_products:
        c = p['category']
        cats[c] = cats.get(c, 0) + 1
    for c, n in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {c}: {n}")

    # Save
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    print(f"\nSaved: {OUTPUT_PATH} ({len(all_products)} products)")


if __name__ == '__main__':
    main()
