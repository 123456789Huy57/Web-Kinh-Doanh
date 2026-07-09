"""Inspect Tiki API product structure"""
import requests
import json

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://tiki.vn/',
}

r = requests.get('https://tiki.vn/api/personalish/v1/blocks/listings',
    params={'category': 4421, 'limit': 2, 'page': 1},
    headers=HEADERS, timeout=10)
d = r.json()

# Show first product structure
if d.get('data'):
    p = d['data'][0]
    print("KEYS:", list(p.keys()))
    print()
    # Print all fields
    for k, v in p.items():
        val_str = json.dumps(v, ensure_ascii=False)
        if len(val_str) > 200:
            val_str = val_str[:200] + '...'
        print(f'  {k}: {val_str}')
    print()
    print(f'paging: {json.dumps(d.get("paging", {}), ensure_ascii=False)}')
