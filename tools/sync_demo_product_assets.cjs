const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readJSON = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const writeJSON = (file, data) => {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const products = readJSON('data/products.json');
const worklist = readJSON('data/demo-product-worklist.json');
const workById = new Map(worklist.map(item => [item.id, item]));

let updated = 0;

products.forEach(product => {
  const item = workById.get(product.id);
  if (!item) return;

  const mainImage = String(item.mainImageUrlToPaste || '').trim();
  const gallery = (item.galleryImageUrls || [])
    .map(url => String(url || '').trim())
    .filter(Boolean);
  const description = String(item.productDetailDescription || '').trim();
  const shortDescription = String(item.shortDescription || '').trim();

  if (mainImage) {
    product.image_url = mainImage;
    product.imageUrl = mainImage;
    product.source_image_url = mainImage;
  }

  if (gallery.length) {
    product.gallery = mainImage && !gallery.includes(mainImage)
      ? [mainImage, ...gallery].slice(0, 6)
      : gallery.slice(0, 6);
  }

  if (description) product.description = description;
  if (shortDescription) product.short_description = shortDescription;

  if (mainImage || gallery.length || description || shortDescription) updated += 1;
});

writeJSON('data/products.json', products);
console.log(`Synced assets/descriptions for ${updated} demo products into data/products.json.`);
