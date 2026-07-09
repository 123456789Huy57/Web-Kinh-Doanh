"""Final quality check after normalization"""
import json
from collections import Counter
import statistics

with open('../data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print('='*60)
print('DATABASE QUALITY REPORT')
print('='*60)
print(f'Total products: {len(products)}')
print()

# Basic completeness
checks = {
    'Images': sum(1 for p in products if p.get('image_url')),
    'Descriptions': sum(1 for p in products if p.get('description') and len(p.get('description',''))>10),
    'Brands': sum(1 for p in products if p.get('brand')),
    'Price > 0': sum(1 for p in products if p.get('price',0)>0),
    'Rating': sum(1 for p in products if p.get('rating')),
    'Reviews': sum(1 for p in products if p.get('review_count')),
    'Category': sum(1 for p in products if p.get('category')),
    'Slug': sum(1 for p in products if p.get('slug')),
    'Nutrition': sum(1 for p in products if p.get('nutrition')),
    'Unit': sum(1 for p in products if p.get('unit')),
}
for label, count in checks.items():
    print(f'  {label:15s}: {count:5d}/{len(products)} ({count/len(products)*100:5.1f}%)')

# Sources
print()
sources = Counter(p.get('source','') for p in products)
print('Sources:')
for s, c in sources.most_common():
    print(f'  {s}: {c}')

# Origins
origins = Counter(p.get('origin','') for p in products)
print('Origins:')
for o, c in origins.most_common():
    print(f'  {o}: {c}')

# Categories
cat_counts = Counter(p.get('category','') for p in products)
print(f'\nCategories ({len(cat_counts)} total):')
for cat, count in cat_counts.most_common():
    print(f'  {cat}: {count}')

# Price stats
prices = [p['price'] for p in products if p.get('price',0)>0]
print(f'\nPrice range: {min(prices):,}d - {max(prices):,}d')
print(f'Mean: {statistics.mean(prices):,.0f}d | Median: {statistics.median(prices):,.0f}d')

# Slug duplicates
slugs = [p.get('slug') for p in products if p.get('slug')]
slug_dup = len(slugs) - len(set(slugs))
print(f'\nSlug duplicates: {slug_dup}')
if slug_dup>0:
    slug_counts = Counter(slugs)
    for slug, count in slug_counts.most_common(5):
        if count>1:
            names = [p.get('name','')[:50] for p in products if p.get('slug')==slug]
            print(f'  "{slug}" x{count}: {names}')

# BHX detail
bhx = [p for p in products if p.get('source')=='Bách Hóa Xanh']
print(f'\nBách Hóa Xanh: {len(bhx)} products')
if bhx:
    print(f'  With images: {sum(1 for p in bhx if p.get("image_url"))}')
    print(f'  With brands: {sum(1 for p in bhx if p.get("brand"))}')
    print(f'  With rating: {sum(1 for p in bhx if p.get("rating"))}')
    print(f'  With reviews: {sum(1 for p in bhx if p.get("review_count"))}')
    print(f'  Categories: {len(set(p.get("category") for p in bhx))}')
    print(f'  Avg price: {statistics.mean(p.get("price",0) for p in bhx):,.0f}d')

# Top brands
brands = Counter(p.get('brand','') for p in products if p.get('brand'))
print(f'\nTop 30 brands ({len(brands)} total):')
for brand, count in brands.most_common(30):
    print(f'  {brand}: {count}')
