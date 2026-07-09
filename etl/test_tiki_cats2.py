"""Scan wider Tiki category range for food products"""
import requests
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
}

# Known Tiki grocery categories (from tiki.vn/bach-hoa-online/c4384)
# Food & grocery categories typically range from 4384-4500
# Let's scan the entire range 1-5000 for food-related names
# But first, check specific known ranges

# Tiki Bach Hoa Online structure:
# c4384 = Thuc pham tuoi song (Food & grocery)
# Under it: do uong (beverages), thuc pham (food), etc.

# Let's try to get Tiki's category tree
try:
    r = requests.get('https://tiki.vn/api/v2/categories',
        params={'parent_id': 4384},
        headers=headers, timeout=10)
    if r.status_code == 200:
        print('=== Subcategories of c4384 ===')
        data = r.json()
        if isinstance(data, list):
            for cat in data:
                print(f'  {cat.get("id")}: {cat.get("name")} (total={cat.get("product_count","?")})')
        elif isinstance(data, dict):
            print(data)
    else:
        print(f'Categories API: status={r.status_code}')
        print(r.text[:500])
except Exception as e:
    print(f'Error: {e}')

# Try to get root categories
try:
    r = requests.get('https://tiki.vn/api/v2/categories',
        headers=headers, timeout=10)
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            print(f'\n=== Root categories ({len(data)}) ===')
            for cat in data:
                children = cat.get('children', [])
                print(f'  {cat.get("id")}: {cat.get("name")} ({len(children)} children)')
    else:
        print(f'Root categories: status={r.status_code}')
except Exception as e:
    print(f'Error: {e}')
