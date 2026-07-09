import json
with open('data/products.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print('Total:', len(data))
for p in data[:5]:
    print(p['id'] + ': ' + p['slug'] + ' - ' + p['name'])
# Test find by slug
slug = 'apricot-mixed-fruit-imp-bab-007105'
found = [p for p in data if p.get('slug') == slug]
print()
print('Found by slug:', len(found))
if found:
    print('ID:', found[0]['id'])
else:
    # Check raw slugs
    slugs = [p.get('slug') for p in data[:20]]
    print('First 20 slugs:', slugs)
