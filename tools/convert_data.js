// tools/convert_data.js
// Node.js script to convert raw product data (realdata) into the schema expected by the app,
// including nutrition fields required by AI‑Meal Planner (protein, carb, fat, calories).

import { readFile, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const INPUT = './data/products_subset.json'; // use subset file
const OUTPUT = './data/products.json';   // overwrite with converted data

// Helper to safely extract numeric values, fallback to 0
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mapProduct(raw) {
  // Raw nutrition may be under different keys depending on source
  const nutrition = raw.nutritionFacts || raw.nutrients || {};

  return {
    id: raw.id ?? uuidv4(),
    name: raw.name ?? raw.title ?? 'Sản phẩm không tên',
    slug: raw.slug ?? (raw.name ? raw.name.toLowerCase().replace(/\s+/g, '-') : uuidv4()),
    price: toNumber(raw.price ?? raw.retailPrice),
    salePrice: toNumber(raw.salePrice ?? raw.discountedPrice ?? raw.price),
    unit: raw.unit ?? 'g',
    unitWeight: toNumber(raw.unitWeight ?? 1),
    categoryId: raw.categoryId ?? raw.category?.id ?? 'unknown',
    // Nutrition fields required by Meal Planner
    protein: toNumber(nutrition.protein),
    carb: toNumber(nutrition.carbohydrate ?? nutrition.carb),
    fat: toNumber(nutrition.fat),
    calories: toNumber(nutrition.energy_kcal ?? nutrition.calories),
    // Optional fields – keep if present
    imageUrl: raw.imageUrl ?? raw.thumbnail ?? '',
    description: raw.description ?? '',
  };
}

async function main() {
  const rawData = JSON.parse(await readFile(INPUT, 'utf8'));
  const transformed = rawData.slice(0, 1000).map(mapProduct);
  await writeFile(OUTPUT, JSON.stringify(transformed, null, 2), 'utf8');
  console.log(`✅ Converted ${transformed.length} products → ${OUTPUT}`);
}

main().catch(err => console.error('❌ convert_data error:', err));

