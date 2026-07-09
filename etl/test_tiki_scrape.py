"""Test Tiki scraper with proper API and pagination"""
import requests
import json
import time

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://tiki.vn/',
}

# Test pagination: how many products per category?
print("=== PAGINATION TEST ===")
for cat_id in [4421, 8275, 15074]:  # Do an vat, Banh, Thuc pham dong hop
    all_products = set()
    for page in range(1, 20):
        try:
            r = requests.get('https://tiki.vn/api/personalish/v1/blocks/listings',
                params={'category': cat_id, 'limit': 50, 'page': page},
                headers=HEADERS, timeout=10)
            if r.status_code == 200:
                d = r.json()
                items = d.get('data', [])
                if not items:
                    break
                for item in items:
                    all_products.add(item.get('id'))
                print(f'  cat {cat_id} page {page}: {len(items)} items, total unique={len(all_products)}')
                time.sleep(0.3)
            else:
                print(f'  cat {cat_id} page {page}: status {r.status_code}')
                break
        except Exception as e:
            print(f'  cat {cat_id} page {page}: error {e}')
            break
    print(f'  cat {cat_id} TOTAL: {len(all_products)} products')
    print()

# Test search-based approach
print("=== SEARCH TEST ===")
search_terms = ['gạo', 'sữa', 'thịt', 'cá', 'trứng', 'bánh', 'kẹo', 'nước mắm', 'dầu ăn', 'gia vị', 'rau', 'trái cây', 'mì gói', 'bún', 'phở']
total_search = set()
for term in search_terms:
    for page in range(1, 5):
        try:
            r = requests.get('https://tiki.vn/api/personalish/v1/blocks/listings',
                params={'q': term, 'limit': 50, 'page': page},
                headers=HEADERS, timeout=10)
            if r.status_code == 200:
                d = r.json()
                items = d.get('data', [])
                if not items:
                    break
                for item in items:
                    total_search.add(item.get('id'))
                print(f'  "{term}" page {page}: {len(items)} items')
                time.sleep(0.2)
            else:
                break
        except:
            break
print(f'  SEARCH TOTAL: {len(total_search)} unique products')
