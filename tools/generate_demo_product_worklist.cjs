const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readJSON = (file, fallback = null) => {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) return fallback;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
};
const writeJSON = (file, data) => {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const DEMO_LIMIT = 200;

function cleanText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function getProductCategory(product) {
  const category = cleanText(product?.categoryId || product?.category || '');
  const text = cleanText(`${product?.name || ''} ${product?.slug || ''} ${product?.categoryName || ''}`);
  if (category) return category;
  if (/\b(tom|cua|muc|ca basa|hai san)\b/.test(text)) return 'seafood';
  if (/\b(thit|ga|bo|heo)\b/.test(text)) return 'meat';
  if (/\b(rau|cu|ca chua|dua leo|hanh|toi|gung)\b/.test(text)) return 'vegetables';
  if (/\b(chuoi|tao|cam|nho|xoai)\b/.test(text)) return 'fruits';
  return 'pantry';
}

function isProductActive(product) {
  return product?.isActive !== false && product?.active !== false;
}

function isMarketProduct(product) {
  const category = getProductCategory(product);
  return isProductActive(product) && category !== 'cleaning' && category !== 'others';
}

function reviewCount(product) {
  return Number(product?.review_count ?? product?.reviewCount ?? 0);
}

function sortProducts(products) {
  return [...products].sort((a, b) => {
    const requiredDiff = Number(!!b.baseIngredientId) - Number(!!a.baseIngredientId);
    if (requiredDiff) return requiredDiff;
    const soldDiff = Number(b.sold_count || 0) - Number(a.sold_count || 0);
    if (soldDiff) return soldDiff;
    const reviewDiff = reviewCount(b) - reviewCount(a);
    if (reviewDiff) return reviewDiff;
    return String(a.name || '').localeCompare(String(b.name || ''), 'vi');
  });
}

function pickDemoProducts(products) {
  const curated = products.filter(isMarketProduct);
  const required = sortProducts(curated.filter((product) => product.baseIngredientId));
  const rest = sortProducts(curated.filter((product) => !product.baseIngredientId));
  const selected = [];
  const seen = new Set();

  [...required, ...rest].forEach((product) => {
    if (selected.length >= DEMO_LIMIT || seen.has(product.id)) return;
    selected.push(product);
    seen.add(product.id);
  });

  return selected;
}

function makeWorkItem(product, previous = {}) {
  const currentImage = product.image_url || product.imageUrl || '';
  const previousGallery = Array.isArray(previous.galleryImageUrls) ? [...previous.galleryImageUrls] : [];
  const hasUserGallery = previousGallery.some((url) => {
    const value = String(url || '').trim();
    return value && value !== currentImage && !(product.gallery || []).includes(value);
  });
  const gallery = hasUserGallery ? previousGallery : [];
  while (gallery.length < 5) gallery.push('');

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: getProductCategory(product),
    categoryName: product.categoryName || product.category || '',
    brand: product.brand || '',
    unit: product.unit || '',
    price: product.price || 0,
    sale_price: product.sale_price ?? product.salePrice ?? 0,
    isMealPlannerRequired: Boolean(product.baseIngredientId),
    baseIngredientId: product.baseIngredientId || '',
    ingredientName: product.ingredientName || '',
    currentImage,
    mainImageUrlToPaste: previous.mainImageUrlToPaste || '',
    galleryImageUrls: gallery.slice(0, 5),
    productDetailDescription: previous.productDetailDescription || product.description || '',
    shortDescription: previous.shortDescription || '',
    sourceUrls: Array.isArray(previous.sourceUrls) ? previous.sourceUrls : ['', '', ''],
    assetStatus: previous.assetStatus || 'todo',
    notes: previous.notes || '',
    todo: [
      'Paste URL ảnh chính vào mainImageUrlToPaste',
      'Paste 4-5 URL ảnh phụ vào galleryImageUrls',
      'Viết/sửa productDetailDescription nếu cần',
      'Đổi assetStatus thành done khi hoàn tất'
    ]
  };
}

const products = readJSON('data/products.json', []);
const previousWorklist = readJSON('data/demo-product-worklist.json', []);
const previousById = new Map((previousWorklist || []).map((item) => [item.id, item]));
const demoProducts = pickDemoProducts(products);

if (demoProducts.length !== DEMO_LIMIT) {
  throw new Error(`Expected ${DEMO_LIMIT} demo products, got ${demoProducts.length}`);
}

const demoIds = demoProducts.map((product) => product.id);
const worklist = demoProducts.map((product) => makeWorkItem(product, previousById.get(product.id)));
const requiredCount = worklist.filter((item) => item.isMealPlannerRequired).length;

writeJSON('data/demo-product-ids.json', demoIds);
writeJSON('data/demo-product-worklist.json', worklist);

console.log(`Generated ${worklist.length} demo work items (${requiredCount} Meal Planner required).`);
