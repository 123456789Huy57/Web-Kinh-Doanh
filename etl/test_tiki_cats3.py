"""Comprehensive Tiki food category tree scanner"""
import requests
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
}

def get_subcategories(parent_id):
    """Get all subcategories recursively"""
    results = []
    try:
        r = requests.get('https://tiki.vn/api/v2/categories',
            params={'parent_id': parent_id},
            headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            cats = data.get('data', [])
            for cat in cats:
                cat_id = cat['id']
                cat_name = cat['name']
                cat_count = cat.get('product_count', 0)
                cat_url = cat.get('url_key', '')
                is_leaf = cat.get('is_leaf', True)
                results.append({
                    'id': cat_id,
                    'name': cat_name,
                    'product_count': cat_count,
                    'url_key': cat_url,
                    'is_leaf': is_leaf,
                    'parent_id': parent_id
                })
                if not is_leaf:
                    children = get_subcategories(cat_id)
                    results.extend(children)
    except Exception as e:
        print(f'  Error fetching children of {parent_id}: {e}')
    return results

# Get all food categories under c4384 (Bach Hoa Online)
print('Fetching full Tiki food category tree...')
all_cats = get_subcategories(4384)

print(f'\n=== ALL CATEGORIES UNDER c4384 ({len(all_cats)}) ===')
for cat in all_cats:
    indent = '  ' * (cat.get('level', 2) - 2) if 'level' in cat else '  '
    leaf = ' LEAF' if cat['is_leaf'] else ''
    print(f'{indent}cat {cat["id"]}: {cat["name"]} ({cat["product_count"]} products){leaf}')

# Test each subcategory for actual food products (exclude cleaning, pet, etc.)
print(f'\n=== TESTING EATABLE/FOOD CATEGORIES ONLY ===')
food_categories = [c for c in all_cats if c['product_count'] > 0 and 
                   c['name'] not in ['Chăm sóc thú cưng', 'Bộ quà tặng']]

total_products = 0
for cat in food_categories:
    try:
        r = requests.get('https://tiki.vn/api/personalish/v1/blocks/listings',
            params={'category': cat['id'], 'limit': 3, 'page': 1},
            headers=headers, timeout=10)
        d = r.json()
        total = d.get('paging', {}).get('total', 0)
        items = d.get('data', [])
        samples = [it.get('name', '')[:40] for it in items[:2]]
        total_products += total
        print(f'  cat {cat["id"]}: {cat["name"]:30s} total={total:>5} samples={samples}')
    except Exception as e:
        print(f'  cat {cat["id"]}: {cat["name"]}: Error={e}')

print(f'\nTotal estimated food products: {total_products}')
