const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readJSON = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const writeJSON = (file, data) => {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const products = readJSON('data/products.json');
const demoIds = readJSON('data/demo-product-ids.json');
const productById = new Map(products.map(product => [product.id, product]));
const missingIds = demoIds.filter(id => !productById.has(id));

if (demoIds.length !== 200) {
  throw new Error(`demo-product-ids.json must contain 200 ids, got ${demoIds.length}`);
}

if (missingIds.length) {
  throw new Error(`Missing product ids in products.json: ${missingIds.join(', ')}`);
}

const frozenProducts = demoIds.map(id => productById.get(id));
const requiredCount = frozenProducts.filter(product => product.baseIngredientId).length;

writeJSON('data/products.before-demo-trim.json', products);
writeJSON('data/products.json', frozenProducts);

console.log(`products.json frozen to ${frozenProducts.length} products (${requiredCount} Meal Planner required).`);
console.log('Full pre-trim copy saved to data/products.before-demo-trim.json');
