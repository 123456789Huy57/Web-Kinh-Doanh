const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readJSON = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const writeJSON = (file, data) => {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const slugify = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const mealProducts = readJSON('data/meal-products.json');
let products = readJSON('data/products.json');
let recipes = readJSON('data/recipes.json');

const categoryMap = {
  vegetables: ['vegetables', 'Rau - Củ', 'rau-cu'],
  fruits: ['fruits', 'Trái cây', 'trai-cay'],
  meat: ['meat', 'Thịt', 'thit'],
  seafood: ['seafood', 'Hải sản', 'hai-san'],
  dairy: ['dairy-eggs', 'Sữa - Trứng', 'sua-trung'],
  pantry: ['rice-grains', 'Gạo - Mì - Ngũ cốc', 'gao-mi-ngu-coc'],
  condiments: ['condiments', 'Gia vị - Nước sốt', 'gia-vi-nuoc-sot'],
  beverages: ['beverages', 'Đồ uống', 'do-uong']
};

const knownMap = {
  'p-001': 'p-0071',
  'p-008': 'p-0053',
  'p-010': 'p-0004',
  'p-015': 'p-0026',
  'p-018': 'p-0132',
  'p-024': 'p-0160',
  'p-026': 'p-0079',
  'p-049': 'p-0015',
  'p-050': 'p-0013'
};

const getCategory = categoryId => categoryMap[categoryId] || ['others', 'Khác', 'khac'];

function normalizeWeight(product) {
  const unit = String(product.unit || '').toLowerCase();
  const unitWeight = Number(product.unitWeight || product.unitWeightGram || 0);

  if (unit === 'kg') return { netWeightGram: 1000, unitWeightGram: 1000 };
  if (unit === 'g') return { netWeightGram: unitWeight || 100, unitWeightGram: unitWeight || 100 };
  if (['ml', 'lít', 'lit'].includes(unit)) {
    return { netVolumeMl: unit === 'ml' ? (unitWeight || 100) : 1000, unitWeightGram: unitWeight || 1000 };
  }
  if (unitWeight) return { netWeightGram: unitWeight, unitWeightGram: unitWeight, netQuantity: 1 };
  return { unitWeightGram: 100, netQuantity: 1 };
}

function nutritionPer100g(product) {
  const n = product.nutrition || {};
  const unitWeight = Number(product.unitWeight || product.unitWeightGram || 100) || 100;
  const multiplier = product.unit === 'kg' ? 0.1 : product.unit === 'g' ? 1 : 100 / unitWeight;
  return {
    energy_kcal: Math.round(Number(n.calories || n.energy_kcal || 0) * multiplier),
    protein: Number((Number(n.protein || 0) * multiplier).toFixed(1)),
    carbohydrates: Number((Number(n.carbs || n.carbohydrates || 0) * multiplier).toFixed(1)),
    fat: Number((Number(n.fat || 0) * multiplier).toFixed(1)),
    fiber: Number((Number(n.fiber || 0) * multiplier).toFixed(1))
  };
}

const ingredientByMealId = new Map();
const ingredients = mealProducts.map(product => {
  const id = `ing-${slugify(product.slug || product.name)}`;
  ingredientByMealId.set(product.id, id);
  return {
    id,
    mealProductId: product.id,
    slug: slugify(product.slug || product.name),
    name: product.name,
    categoryId: product.categoryId,
    category: product.categoryId,
    defaultUnit: product.unit,
    unitWeightGram: product.unitWeight || null,
    imageUrl: product.imageUrl || '/assets/images/hero-fresh.jpg',
    aliases: [product.name, product.slug].filter(Boolean),
    nutritionPer100g: nutritionPer100g(product),
    isActive: product.isActive !== false
  };
});

const productById = new Map(products.map(product => [product.id, product]));
const mapEntries = {};

for (const mealProduct of mealProducts) {
  const ingredientId = ingredientByMealId.get(mealProduct.id);
  let catalogProductId = knownMap[mealProduct.id];

  if (!catalogProductId || !productById.has(catalogProductId)) {
    catalogProductId = `mp-${mealProduct.id.replace(/^p-/, '')}`;
  }

  let catalogProduct = productById.get(catalogProductId);
  const [category, categoryName, subcategory] = getCategory(mealProduct.categoryId);
  const weightFields = normalizeWeight(mealProduct);

  if (!catalogProduct) {
    catalogProduct = {
      id: catalogProductId,
      sku: `MEAL-${mealProduct.id.replace(/^p-/, '')}`,
      slug: `${slugify(mealProduct.slug || mealProduct.name)}-meal`,
      barcode: '',
      name: mealProduct.name,
      brand: mealProduct.brand || 'Bách Hóa Tươi',
      category,
      categoryName,
      subcategory,
      subcategoryName: categoryName,
      description: mealProduct.description || `${mealProduct.name} được chuẩn hóa cho Meal Planner.`,
      price: mealProduct.price || 0,
      sale_price: mealProduct.salePrice || 0,
      unit: mealProduct.unit || 'phần',
      stock: mealProduct.stock || 50,
      rating: mealProduct.rating || 4.7,
      review_count: mealProduct.reviewCount || 0,
      sold_count: 0,
      image_url: mealProduct.imageUrl || '/assets/images/hero-fresh.jpg',
      source_image_url: mealProduct.imageUrl || '/assets/images/hero-fresh.jpg',
      gallery: [mealProduct.imageUrl || '/assets/images/hero-fresh.jpg'],
      nutrition: {
        energy_kcal: mealProduct.nutrition?.calories || 0,
        protein: mealProduct.nutrition?.protein || 0,
        carbohydrates: mealProduct.nutrition?.carbs || 0,
        fat: mealProduct.nutrition?.fat || 0,
        fiber: 0,
        sugars: 0,
        salt: 0
      },
      tags: mealProduct.tags || [],
      badges: mealProduct.badges || [],
      active: true,
      in_stock: true
    };
    products.push(catalogProduct);
    productById.set(catalogProductId, catalogProduct);
  }

  Object.assign(catalogProduct, {
    baseIngredientId: ingredientId,
    ingredientName: mealProduct.name,
    sellUnit: catalogProduct.sellUnit || catalogProduct.unit || mealProduct.unit,
    unitWeightGram: catalogProduct.unitWeightGram || weightFields.unitWeightGram || mealProduct.unitWeight || null,
    nutritionPer100g: catalogProduct.nutritionPer100g || nutritionPer100g(mealProduct),
    active: catalogProduct.active !== false,
    in_stock: catalogProduct.in_stock !== false
  }, weightFields);

  mapEntries[ingredientId] = {
    ingredientId,
    mealProductId: mealProduct.id,
    preferredProductId: catalogProductId,
    productIds: [catalogProductId]
  };
}

recipes = recipes.map(recipe => ({
  ...recipe,
  ingredients: (recipe.ingredients || []).map(ingredient => ({
    ...ingredient,
    mealProductId: ingredient.mealProductId || ingredient.productId,
    ingredientId: ingredient.ingredientId || ingredientByMealId.get(ingredient.productId) || ingredient.productId
  }))
}));

writeJSON('data/ingredients.json', ingredients);
writeJSON('data/ingredient-product-map.json', mapEntries);
writeJSON('data/products.json', products);
writeJSON('data/recipes.json', recipes);

console.log(`Normalized ${ingredients.length} ingredients, ${Object.keys(mapEntries).length} product mappings, ${recipes.length} recipes.`);
