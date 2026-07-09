"""Get Tiki category tree and build mapping"""
import requests
import json

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://tiki.vn/',
}

def get_subcategories(parent_id):
    """Get subcategories of a parent."""
    # Try Tiki category tree endpoint
    r = requests.get('https://tiki.vn/api/personalish/v1/blocks/listings',
        params={'category': parent_id, 'limit': 1, 'page': 1},
        headers=HEADERS, timeout=10)
    if r.status_code != 200:
        return []
    data = r.json()
    paging = data.get('paging', {})
    total = paging.get('total', 0)
    return total

# Main food categories from c4384 (Bách Hóa Online > Đồ Ăn Vặt)
# From test_tiki_cats3.py we know these are under c4384
# Let's try fetching the category tree from the main page
r = requests.get('https://tiki.vn/api/personalish/v1/blocks/listings',
    params={'category': 4384, 'limit': 40, 'page': 1},
    headers=HEADERS, timeout=10)
print(f"Root c4384: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"Total products in c4384: {data.get('paging', {}).get('total', 0)}")
    
# Now let's try to discover subcategories from category_path in products
# Each product has primary_category_path like "1/2/4384/4421/8275/67044"
products = data.get('data', [])
cat_paths = set()
for p in products:
    path = p.get('primary_category_path', '')
    if path:
        cat_paths.add(path)
        
print(f"\nUnique category paths in first page:")
for path in sorted(cat_paths):
    parts = path.split('/')
    print(f"  {path}")
    # Get product count for leaf category
    leaf = parts[-1]
    total = get_subcategories(leaf)
    print(f"    -> {total} products")
