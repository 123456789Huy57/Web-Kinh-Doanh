"""Explore BHX API and page structure to find product data."""

import requests
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
    'Referer': 'https://www.bachhoaxanh.com/rau-cu-qua',
    'Origin': 'https://www.bachhoaxanh.com',
}

# 1. Try GraphQL API with ReverseHost header
print("=" * 60)
print("1. BHX GraphQL API")
print("=" * 60)
gql_headers = {
    **headers,
    'ReverseHost': 'www.bachhoaxanh.com',
    'Content-Type': 'application/json',
}

# GraphQL query for products
query = """
query getProductListing($categoryUrl: String, $page: Int, $pageSize: Int) {
  getProductListing(categoryUrl: $categoryUrl, page: $page, pageSize: $pageSize) {
    products {
      id
      name
      url
      image
      price
      oldPrice
      promotion
    }
    total
    currentPage
  }
}
"""

payload = {
    'query': query,
    'variables': {'categoryUrl': 'rau-cu-qua', 'page': 1, 'pageSize': 20}
}

try:
    r = requests.post('https://apibhx.tgdd.vn/graphql', 
                      headers=gql_headers, json=payload, timeout=15)
    print(f'Status: {r.status_code}')
    if r.status_code == 200:
        data = r.json()
        print(json.dumps(data, ensure_ascii=False, indent=2)[:3000])
    else:
        print(f'Response: {r.text[:500]}')
except Exception as e:
    print(f'Error: {e}')

# 2. Try REST API variations
print("\n" + "=" * 60)
print("2. REST API endpoints")
print("=" * 60)
apis = [
    ('GET', 'https://apibhx.tgdd.vn/api/v1/products?slug=rau-cu-qua', {}),
    ('GET', 'https://apibhx.tgdd.vn/api/v1/category/rau-cu-qua/products', {}),
    ('GET', 'https://apibhx.tgdd.vn/api/v1/product/list?slug=rau-cu-qua', {}),
    ('GET', 'https://apibhx.tgdd.vn/api/products?slug=rau-cu-qua', {}),
    ('GET', 'https://apibhx.tgdd.vn/api/v1/product?category=rau-cu-qua', {}),
]

for method, url, extra in apis:
    try:
        if method == 'GET':
            r = requests.get(url, headers=headers, timeout=15)
            print(f'{r.status_code} | {url}')
            if r.status_code == 200:
                data = r.json()
                text = json.dumps(data, ensure_ascii=False, indent=2)
                print(f'   {text[:500]}')
    except Exception as e:
        print(f'ERR | {url} | {e}')

# 3. Look at the HTML page more carefully
print("\n" + "=" * 60)
print("3. Page HTML analysis")
print("=" * 60)
r = requests.get('https://www.bachhoaxanh.com/rau-cu-qua', 
                 headers={'User-Agent': headers['User-Agent']}, timeout=30)
html = r.text

# Find all script tags
scripts = re.findall(r'<script[^>]*src=[\"']([^\"']+)[\"']', html)
print(f"Scripts found: {len(scripts)}")
for s in scripts[:20]:
    print(f'  {s}')

# Look for data in JavaScript variables
patterns = [
    (r'window\.__INITIAL_STATE__\s*=\s*({.*?});', 'INITIAL_STATE'),
    (r'window\.__DATA__\s*=\s*({.*?});', '__DATA__'),
    (r'window\.__PRELOADED_STATE__\s*=\s*({.*?});', 'PRELOADED_STATE'),
    (r'window\.__NUXT__\s*=\s*({.*?});', 'NUXT'),
    (r'window\.__RENDERED_DATA__\s*=\s*({.*?});', 'RENDERED_DATA'),
    (r'window\._APP_DATA\s*=\s*({.*?});', 'APP_DATA'),
]

for pattern, name in patterns:
    m = re.search(pattern, html, re.DOTALL)
    if m:
        print(f'\nFound {name}!')
        try:
            data = json.loads(m.group(1))
            print(json.dumps(data, ensure_ascii=False)[:1000])
        except:
            print(f'{name} content (first 300): {m.group(1)[:300]}')
    else:
        print(f'No {name} found')

# Look for any JSON-like data in the HTML
print("\n--- Searching for product data patterns ---")
product_patterns = [
    r'"productName":\s*"([^"]+)"',
    r'"productItem":\s*{',
    r'"listProduct":\s*\[',
    r'"products":\s*\[',
    r'"item":\s*{',
]
for pat in product_patterns:
    matches = re.findall(pat, html)
    if matches:
        print(f'\nPattern "{pat}": found {len(matches)} matches')
        for m2 in matches[:5]:
            if isinstance(m2, str):
                print(f'  {m2[:100]}')
            else:
                print(f'  (non-string match)')

print("\nDone!")
