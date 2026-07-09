"""Test Tiki API for grocery/food products"""
import requests
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://tiki.vn/',
}

# Search-based approach
search_terms = ['gạo', 'sữa tươi', 'rau củ quả', 'thịt heo', 'trái cây', 'bánh kẹo', 'nước ngọt', 'mì gói', 'dầu ăn', 'gia vị']
total_products = 0
all_ids = set()

for term in search_terms:
    try:
        r = requests.get('https://tiki.vn/api/personalish/v1/blocks/listings',
            params={'q': term, 'limit': 50, 'page': 1},
            headers=headers, timeout=10)
        if r.status_code == 200:
            d = r.json()
            total = d.get('paging', {}).get('total', 0)
            items = d.get('data', [])
            for item in items:
                all_ids.add(item.get('id', ''))
                cat = item.get('category_id', 'N/A')
            print(f'"{term}": total={total}, page_items={len(items)}')
    except Exception as e:
        print(f'"{term}": Error={e}')

print(f'\nTotal unique products found: {len(all_ids)}')

# Test with category 4384 (food & beverage)
for cat_id in [4384, 4386, 4388, 4390, 4392, 4394, 4396, 4398]:
    try:
        r = requests.get('https://tiki.vn/api/personalish/v1/blocks/listings',
            params={'category': cat_id, 'limit': 3, 'page': 1},
            headers=headers, timeout=5)
        d = r.json()
        total = d.get('paging', {}).get('total', 0)
        items = d.get('data', [])
        if items:
            names = [it.get('name', '')[:30] for it in items[:2]]
            print(f'  cat {cat_id}: total={total} sample={names}')
        else:
            print(f'  cat {cat_id}: total={total}')
    except Exception as e:
        print(f'  cat {cat_id}: Error={e}')
