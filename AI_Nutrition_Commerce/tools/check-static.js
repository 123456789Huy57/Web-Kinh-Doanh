import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const failures = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function listFiles(dir, ext) {
  return fs.readdirSync(path.join(root, dir))
    .filter((file) => file.endsWith(ext))
    .map((file) => path.join(dir, file).replace(/\\/g, "/"));
}

function fail(message) {
  failures.push(message);
}

const jsFiles = listFiles("js", ".js");
const cssFiles = listFiles("css", ".css");
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith(".html"));
const jsonFiles = ["data/products.json", "data/categories.json", "data/vouchers.json", "data/users.json", "data/orders.json"];

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) fail(`${file}: JS syntax failed\n${result.stderr || result.stdout}`);
}

for (const file of jsonFiles) {
  try {
    JSON.parse(read(file));
  } catch (error) {
    fail(`${file}: JSON parse failed (${error.message})`);
  }
}

const badPattern = /href="#"|javascript:void|data-social-login|TODO|FIXME|console\.log\(|alert\(/;
for (const file of [...jsFiles, ...htmlFiles]) {
  const text = read(file);
  if (badPattern.test(text)) fail(`${file}: contains placeholder/debug pattern`);
}

for (const file of htmlFiles) {
  const text = read(file);
  const body = text.match(/<body([^>]*)>/i);
  if (!body) fail(`${file}: missing <body>`);
  else if (!/data-page=/.test(body[1])) fail(`${file}: missing body data-page`);

  if (!/<title>[^<]+<\/title>/i.test(text)) fail(`${file}: missing title`);
  if (!/<meta\s+name=["']description["']\s+content=["'][^"']+["']/i.test(text)) {
    fail(`${file}: missing meta description`);
  }

  for (const match of text.matchAll(/href=["']([^"']+\.html(?:[^"']*)?)["']/g)) {
    const target = match[1].replace(/^\.\//, "").split(/[?#]/)[0];
    if (!exists(target)) fail(`${file}: missing internal page ${match[1]}`);
  }

  for (const match of text.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) {
    const target = match[1].replace(/^\.\//, "").split("?")[0];
    if (!/^https?:/.test(target) && !exists(target)) fail(`${file}: missing script ${match[1]}`);
  }

  for (const match of text.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/g)) {
    const target = match[1].replace(/^\.\//, "").split("?")[0];
    if (!/^https?:/.test(target) && !exists(target)) fail(`${file}: missing stylesheet ${match[1]}`);
  }
}

const products = JSON.parse(read("data/products.json"));
const categories = JSON.parse(read("data/categories.json"));
const categoryIds = new Set(categories.map((item) => item.id));
const productIds = new Set();
const productSlugs = new Set();
for (const product of products) {
  if (!product.id) fail("data/products.json: product missing id");
  else if (productIds.has(product.id)) fail(`data/products.json: duplicate product id ${product.id}`);
  else productIds.add(product.id);

  if (!product.slug) fail(`data/products.json: ${product.id} missing slug`);
  else if (productSlugs.has(product.slug)) fail(`data/products.json: duplicate slug ${product.slug}`);
  else productSlugs.add(product.slug);

  const categoryId = product.categoryId || product.category_id || product.category;
  if (categoryId && !categoryIds.has(categoryId)) fail(`data/products.json: ${product.id} invalid category ${categoryId}`);
  if (!(Number(product.price) > 0)) fail(`data/products.json: ${product.id} invalid price`);
  if (!(product.imageUrl || product.image_url || product.source_image_url || product.image || product.images?.length || product.gallery?.length)) {
    fail(`data/products.json: ${product.id} missing usable image`);
  }
}

for (const file of cssFiles) {
  const importantCount = (read(file).match(/!important/g) || []).length;
  if (importantCount > 60) fail(`${file}: too many !important declarations (${importantCount})`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Static audit passed.");
