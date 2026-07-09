"""Find Tiki food subcategories"""
import requests
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
}

# Tiki food/beverage category tree (from URL: di-cho-online -> /thuc-pham-tuoi-song)
# Let's scan for grocery categories
cat_ranges = {
    'food_base': list(range(4384, 4410)),  # 4384-4409
    'beverages': list(range(4390, 4410)),
    'bakery': list(range(4420, 4440)),
    'meat_seafood': list(range(4400, 4420)),
    'frozen': list(range(4440, 4460)),
    'rice_noodles': list(range(4460, 4480)),
}

all_found = {}
for group_name, cat_ids in cat_ranges.items():
    for cat_id in cat_ids:
        try:
            r = requests.get('https://tiki.vn/api/personalish/v1/blocks/listings',
                params={'category': cat_id, 'limit': 1, 'page': 1},
                headers=headers, timeout=5)
            d = r.json()
            total = d.get('paging', {}).get('total', 0)
            if total > 0:
                items = d.get('data', [])
                sample_name = items[0].get('name', '')[:40] if items else 'N/A'
                all_found[cat_id] = {'total': total, 'sample': sample_name}
                print(f'  cat {cat_id}: total={total} sample="{sample_name}"')
        except:
            pass

print(f'\nTotal categories with products: {len(all_found)}')
print(f'Total estimated products: {sum(v.get("total",0) for v in all_found.values())}')
