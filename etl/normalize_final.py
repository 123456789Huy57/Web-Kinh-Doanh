"""Final data normalization - fix missing fields, unify schema"""
import json
import re
import sys
from datetime import datetime

DATA_FILE = '../data/products.json'
print('[1/6] Loading products...')
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    products = json.load(f)
print(f'  Loaded {len(products)} products')

print('[2/6] Normalizing fields...')
fields_fixed = 0
for p in products:
    changed = False
    
    # Ensure id exists
    if not p.get('id'):
        p['id'] = f"p-{hash(p.get('name', '')) % 10**8:08d}"
        changed = True
    
    # Ensure name
    if not p.get('name'):
        p['name'] = f"Product {p.get('id', 'unknown')}"
        changed = True
    
    # Ensure price is numeric
    price = p.get('price')
    if price is None:
        p['price'] = 0
        changed = True
    elif isinstance(price, str):
        p['price'] = float(price.replace(',', '').replace('₫', '').strip()) if price else 0
        changed = True
    
    # Add origin for OpenFF products (no origin or source yet)
    if not p.get('source') and not p.get('origin'):
        p['origin'] = 'Quốc tế'
        p['source'] = 'Open Food Facts'
        changed = True
    
    # Ensure source for BHX products that only have origin
    if p.get('origin') == 'Bách Hóa Xanh' and not p.get('source'):
        p['source'] = 'Bách Hóa Xanh'
        changed = True
    
    # Ensure unit
    if not p.get('unit'):
        p['unit'] = 'piece'
        changed = True
    
    # Fix image_url for gallery-based products
    if not p.get('image_url') and p.get('gallery'):
        gallery = p['gallery']
        if isinstance(gallery, list) and len(gallery) > 0:
            first = gallery[0]
            if isinstance(first, str):
                p['image_url'] = first
            elif isinstance(first, dict):
                p['image_url'] = first.get('image', first.get('url', ''))
            changed = True
    
    # Fix sale_price None -> 0 for display
    if p.get('sale_price') is None:
        p['sale_price'] = 0
        changed = True
    
    if changed:
        fields_fixed += 1

print(f'  Fixed {fields_fixed} products')

print('[3/6] Removing duplicate IDs...')
seen_ids = {}
duplicates = 0
for i, p in enumerate(products):
    pid = p.get('id')
    if pid in seen_ids:
        # Keep the one with more data
        prev_idx = seen_ids[pid]
        prev = products[prev_idx]
        # Count non-empty fields
        prev_count = sum(1 for v in prev.values() if v and v != 0)
        curr_count = sum(1 for v in p.values() if v and v != 0)
        if curr_count > prev_count:
            products[prev_idx] = p
        products[i] = None  # Mark for removal
        duplicates += 1
    else:
        seen_ids[pid] = i

products = [p for p in products if p is not None]
print(f'  Removed {duplicates} duplicates')

print('[4/6] Sorting by category then name...')
products.sort(key=lambda p: (p.get('category', ''), p.get('name', '')))

print('[5/6] Ensuring all IDs are unique strings...')
for p in products:
    pid = p.get('id', '')
    if not isinstance(pid, str):
        p['id'] = str(pid)

print('[6/6] Saving...')
with open(DATA_FILE, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f'\nDone! {len(products)} products saved to {DATA_FILE}')

# Quick stats
cats = {}
origins = {}
sources = {}
for p in products:
    cats[p.get('category', 'Unknown')] = cats.get(p.get('category', 'Unknown'), 0) + 1
    origins[p.get('origin', 'Unknown')] = origins.get(p.get('origin', 'Unknown'), 0) + 1
    sources[p.get('source', 'Unknown')] = sources.get(p.get('source', 'Unknown'), 0) + 1

print('\n=== STATS ===')
print(f'Total: {len(products)}')
print(f'Categories: {len(cats)}')
print(f'Origin breakdown: {origins}')
print(f'Source breakdown: {sources}')
print(f'Top categories:')
for c, n in sorted(cats.items(), key=lambda x: -x[1])[:15]:
    print(f'  {c}: {n}')
