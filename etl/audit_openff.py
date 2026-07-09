"""Audit OpenFF data quality"""
import json
import re

with open('../data/products.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

off = [p for p in data if not p.get('bhx_id') and p.get('origin') != 'Bách Hóa Xanh']
print('OpenFF count:', len(off))

# Check nutrition data
has_nutrition = sum(1 for p in off if p.get('nutrition'))
print('Has nutrition:', has_nutrition)

# Sample nutrition
for p in off:
    if p.get('nutrition'):
        print('Sample nutrition:', json.dumps(p['nutrition'], indent=2, ensure_ascii=False))
        break

# Check gallery
has_gallery = sum(1 for p in off if p.get('gallery') and len(p['gallery']) > 0)
print('Has gallery:', has_gallery)

# Check description
has_desc = sum(1 for p in off if p.get('description'))
print('Has description:', has_desc)

# Check barcode
has_barcode = sum(1 for p in off if p.get('barcode'))
print('Has barcode:', has_barcode)

# Check brand
has_brand = sum(1 for p in off if p.get('brand') and p['brand'] not in ('Unknown', ''))
print('Has brand:', has_brand)

# Check tags
has_tags = sum(1 for p in off if p.get('tags') and len(p['tags']) > 0)
print('Has tags:', has_tags)

# Check nutrition specific fields
print()
nutrition_keys_found = set()
for p in off[:200]:
    for k in p.keys():
        if any(x in k.lower() for x in ['nutri', 'kcal', 'calor', 'protein', 'fat', 'sugar', 'sodium', 'fiber']):
            nutrition_keys_found.add(k)
print('Nutrition-related keys in product:', nutrition_keys_found)

# Language check
vn_pat = re.compile(r'[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]')
vn_names = sum(1 for p in off if vn_pat.search(p.get('name', '')))
eng_only = sum(1 for p in off if p.get('name', '') and not vn_pat.search(p.get('name', '')))
print()
print('Names with Vietnamese chars:', vn_names)
print('Names pure ASCII:', eng_only)

# Sample English names
print()
print('Sample English names:')
count = 0
for p in off:
    name = p.get('name', '')
    if name and not vn_pat.search(name) and count < 15:
        print('  - %s (%s)' % (name[:60], p.get('brand', '?')))
        count += 1

# Sample with nutrition
print()
print('Sample products WITH nutrition:')
count = 0
for p in off:
    if p.get('nutrition') and count < 5:
        n = p['nutrition']
        print('  %s' % p['name'][:40])
        print('    nutrition:', n)
        count += 1

# Sample without nutrition
print()
print('Sample products WITHOUT nutrition:')
count = 0
for p in off:
    if not p.get('nutrition') and count < 5:
        print('  %s' % p['name'][:40])
        count += 1
