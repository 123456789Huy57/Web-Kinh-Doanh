import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data");
const source = JSON.parse(fs.readFileSync(path.join(dataDir, "bhx_products_flat.json"), "utf8"));

const IMG = {
  vegetables: "./assets/images/cat-vegetables.webp",
  fruits: "./assets/images/cat-fruits.webp",
  meat: "./assets/images/cat-meat.webp",
  seafood: "./assets/images/cat-seafood.webp",
  dairy: "./assets/images/cat-dairy.webp",
  beverages: "./assets/images/cat-beverages.webp",
  bakery: "./assets/images/cat-pantry.webp",
  pantry: "./assets/images/cat-pantry.webp",
  condiments: "./assets/images/cat-condiments.webp",
  frozen: "./assets/images/cat-meat.webp"
};

const categories = [
  { id: "vegetables", slug: "rau-cu", name: "Rau - C\u1ee7", imageUrl: IMG.vegetables, source: ["Vegetables"], limit: 20 },
  { id: "fruits", slug: "trai-cay", name: "Tr\u00e1i c\u00e2y", imageUrl: IMG.fruits, source: ["Fruits"], limit: 12 },
  { id: "meat", slug: "thit", name: "Th\u1ecbt", imageUrl: IMG.meat, source: ["Meat"], limit: 20 },
  { id: "seafood", slug: "hai-san", name: "H\u1ea3i s\u1ea3n", imageUrl: IMG.seafood, source: ["Seafood"], limit: 12 },
  { id: "dairy-eggs", slug: "sua-trung", name: "S\u1eefa - Tr\u1ee9ng", imageUrl: IMG.dairy, source: ["Milk", "Eggs"], limit: 16 },
  { id: "beverages", slug: "do-uong", name: "\u0110\u1ed3 u\u1ed1ng", imageUrl: IMG.beverages, source: ["Beverages"], limit: 16 },
  { id: "bakery", slug: "banh-mi-bakery", name: "B\u00e1nh m\u00ec - Bakery", imageUrl: IMG.bakery, source: ["Snacks"], limit: 12 },
  { id: "snacks", slug: "banh-keo-an-vat", name: "B\u00e1nh k\u1eb9o - \u0102n v\u1eb7t", imageUrl: IMG.pantry, source: ["Snacks"], skip: 12, limit: 16 },
  { id: "rice-grains", slug: "gao-ngu-coc", name: "G\u1ea1o - Ng\u0169 c\u1ed1c", imageUrl: IMG.pantry, source: ["Rice"], limit: 16 },
  { id: "noodles", slug: "mi-bun-pho", name: "M\u00ec - B\u00fan - Ph\u1edf", imageUrl: IMG.pantry, source: ["Instant Noodles"], limit: 16 },
  { id: "condiments", slug: "gia-vi-nuoc-sot", name: "Gia v\u1ecb - N\u01b0\u1edbc s\u1ed1t", imageUrl: IMG.condiments, source: ["Sauce", "Cooking Oil"], limit: 18 },
  { id: "frozen", slug: "dong-lanh", name: "\u0110\u00f4ng l\u1ea1nh", imageUrl: IMG.frozen, source: ["Frozen Foods"], limit: 14 },
  { id: "tea-coffee", slug: "tra-ca-phe", name: "Tr\u00e0 & c\u00e0 ph\u00ea", imageUrl: IMG.beverages, source: ["Coffee"], limit: 12 }
];

const subMeta = {
  "vegetables-leafy": ["Rau \u0103n l\u00e1", "rau-an-la"],
  "vegetables-fruit": ["Rau \u0103n qu\u1ea3", "rau-an-qua"],
  "vegetables-other": ["Rau c\u1ee7 kh\u00e1c", "rau-cu-khac"],
  "fruits-fresh": ["Tr\u00e1i c\u00e2y t\u01b0\u01a1i", "trai-cay-tuoi"],
  "fruits-other": ["Tr\u00e1i c\u00e2y kh\u00e1c", "trai-cay-khac"],
  "meat-chicken": ["Th\u1ecbt g\u00e0", "thit-ga"],
  "meat-beef": ["Th\u1ecbt b\u00f2", "thit-bo"],
  "meat-pork": ["Th\u1ecbt heo", "thit-heo"],
  "meat-other": ["Th\u1ecbt kh\u00e1c", "thit-khac"],
  "seafood-fish": ["C\u00e1", "ca"],
  "seafood-shrimp-crab": ["T\u00f4m - cua", "tom-cua"],
  "seafood-other": ["H\u1ea3i s\u1ea3n kh\u00e1c", "hai-san-khac"],
  "dairy-milk": ["S\u1eefa t\u01b0\u01a1i", "sua-tuoi"],
  "dairy-yogurt": ["S\u1eefa chua", "sua-chua"],
  "dairy-eggs": ["Tr\u1ee9ng", "trung"],
  "dairy-other": ["S\u1eefa - b\u01a1 - ph\u00f4 mai", "sua-bo-pho-mai"],
  "beverages-water": ["N\u01b0\u1edbc kho\u00e1ng", "nuoc-khoang"],
  "beverages-juice": ["N\u01b0\u1edbc \u00e9p", "nuoc-ep"],
  "beverages-soft": ["N\u01b0\u1edbc ng\u1ecdt", "nuoc-ngot"],
  "beverages-other": ["\u0110\u1ed3 u\u1ed1ng kh\u00e1c", "do-uong-khac"],
  "bakery-bread": ["B\u00e1nh m\u00ec", "banh-mi"],
  "bakery-sweet": ["B\u00e1nh ng\u1ecdt", "banh-ngot"],
  "snacks-candy": ["K\u1eb9o", "keo"],
  "snacks-biscuit": ["B\u00e1nh quy", "banh-quy"],
  "snacks-other": ["\u0102n v\u1eb7t kh\u00e1c", "an-vat-khac"],
  "rice-rice": ["G\u1ea1o", "gao"],
  "rice-grains": ["Ng\u0169 c\u1ed1c", "ngu-coc"],
  "rice-other": ["\u0110\u1ed3 kh\u00f4 kh\u00e1c", "do-kho-khac"],
  "noodles-instant": ["M\u00ec \u0103n li\u1ec1n", "mi-an-lien"],
  "noodles-rice": ["B\u00fan - ph\u1edf", "bun-pho"],
  "noodles-other": ["M\u00ec b\u00fan kh\u00e1c", "mi-bun-khac"],
  "condiments-sauce": ["N\u01b0\u1edbc s\u1ed1t", "nuoc-sot"],
  "condiments-spice": ["Gia v\u1ecb", "gia-vi"],
  "condiments-oil": ["D\u1ea7u \u0103n", "dau-an"],
  "frozen-meat": ["Th\u1ecbt c\u00e1 \u0111\u00f4ng l\u1ea1nh", "thit-ca-dong-lanh"],
  "frozen-ready": ["M\u00f3n ch\u1ebf bi\u1ebfn s\u1eb5n", "mon-che-bien-san"],
  "frozen-other": ["\u0110\u00f4ng l\u1ea1nh kh\u00e1c", "dong-lanh-khac"],
  "tea": ["Tr\u00e0", "tra"],
  "coffee": ["C\u00e0 ph\u00ea", "ca-phe"]
};

function stripMarks(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function slugify(value) {
  return stripMarks(value).replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function inferSubcategory(categoryId, product) {
  const name = stripMarks(product.name);
  const sourceCategory = product.category;
  if (categoryId === "vegetables") {
    if (/rau|cai|xa lach|mong toi|den|muong|ngong/.test(name)) return "vegetables-leafy";
    if (/ca chua|dua leo|bi|khổ|kho qua|dau bap/.test(name)) return "vegetables-fruit";
    return "vegetables-other";
  }
  if (categoryId === "fruits") return /say|kho/.test(name) ? "fruits-other" : "fruits-fresh";
  if (categoryId === "meat") {
    if (/ga|canh|dui|uc/.test(name)) return "meat-chicken";
    if (/bo/.test(name)) return "meat-beef";
    if (/heo|suon|gio|ba roi|thit nac/.test(name)) return "meat-pork";
    return "meat-other";
  }
  if (categoryId === "seafood") {
    if (/ca|basa|hoi|thu|ngu/.test(name)) return "seafood-fish";
    if (/tom|cua|ghe/.test(name)) return "seafood-shrimp-crab";
    return "seafood-other";
  }
  if (categoryId === "dairy-eggs") {
    if (sourceCategory === "Eggs" || /trung/.test(name)) return "dairy-eggs";
    if (/sua chua|yogurt/.test(name)) return "dairy-yogurt";
    if (/sua tuoi|sua tiet trung/.test(name)) return "dairy-milk";
    return "dairy-other";
  }
  if (categoryId === "beverages") {
    if (/nuoc suoi|nuoc khoang|lavie|aquafina/.test(name)) return "beverages-water";
    if (/ep|juice|trai cay/.test(name)) return "beverages-juice";
    if (/pepsi|coca|7up|sprite|sting|mirinda|fanta/.test(name)) return "beverages-soft";
    return "beverages-other";
  }
  if (categoryId === "bakery") return /banh mi|sandwich/.test(name) ? "bakery-bread" : "bakery-sweet";
  if (categoryId === "snacks") {
    if (/keo|gum|socola|chocolate/.test(name)) return "snacks-candy";
    if (/quy|cookie|cracker/.test(name)) return "snacks-biscuit";
    return "snacks-other";
  }
  if (categoryId === "rice-grains") {
    if (/gao|nep/.test(name)) return "rice-rice";
    if (/ngu coc|yen mach|granola/.test(name)) return "rice-grains";
    return "rice-other";
  }
  if (categoryId === "noodles") {
    if (/mi|hao hao|omachi|kokomi/.test(name)) return "noodles-instant";
    if (/bun|pho|hu tieu/.test(name)) return "noodles-rice";
    return "noodles-other";
  }
  if (categoryId === "condiments") {
    if (/dau/.test(name) || sourceCategory === "Cooking Oil") return "condiments-oil";
    if (/muoi|duong|hat nem|tieu|bot|gia vi/.test(name)) return "condiments-spice";
    return "condiments-sauce";
  }
  if (categoryId === "frozen") {
    if (/ca|bo|heo|ga|tom/.test(name)) return "frozen-meat";
    if (/pizza|cha gio|ha cao|vien/.test(name)) return "frozen-ready";
    return "frozen-other";
  }
  if (categoryId === "tea-coffee") return /tra|tea/.test(name) ? "tea" : "coffee";
  return `${categoryId}-other`;
}

function pickProducts(config) {
  const pool = source.filter((item) => config.source.includes(item.category));
  return pool.slice(config.skip || 0, (config.skip || 0) + config.limit);
}

let sequence = 1;
const products = categories.flatMap((category) => pickProducts(category).map((item) => {
  const subId = inferSubcategory(category.id, item);
  const [subcategoryName] = subMeta[subId] || [category.name, category.slug];
  const price = item.price || 12000 + sequence * 1000;
  const salePrice = item.sale_price || (sequence % 4 === 0 ? Math.round(price * 0.86 / 1000) * 1000 : 0);
  const product = {
    id: `p-${String(sequence).padStart(4, "0")}`,
    sku: `${category.id.slice(0, 3).toUpperCase()}-${String(sequence).padStart(4, "0")}`,
    slug: `${slugify(item.name)}-${String(sequence).padStart(4, "0")}`,
    barcode: `893${String(100000000 + sequence).slice(1)}`,
    name: item.name,
    brand: item.brand || "B\u00e1ch H\u00f3a T\u01b0\u01a1i",
    category: category.id,
    categoryName: category.name,
    subcategory: subId,
    subcategoryName,
    description: `${item.name} thu\u1ed9c nh\u00f3m ${subcategoryName.toLowerCase()}, ph\u00f9 h\u1ee3p cho b\u1eefa \u0103n gia \u0111\u00ecnh v\u00e0 giao nhanh trong ng\u00e0y.`,
    price,
    sale_price: salePrice,
    unit: item.unit || "g\u00f3i",
    stock: 15 + (sequence * 7) % 90,
    rating: item.rating || Number((4 + ((sequence * 13) % 10) / 10).toFixed(1)),
    review_count: item.review_count || 18 + (sequence * 19) % 360,
    sold_count: 80 + (sequence * 41) % 2200,
    image_url: item.image_url || category.imageUrl,
    source_image_url: item.image_url || "",
    gallery: item.image_url ? [item.image_url] : [],
    nutrition: {
      energy_kcal: 60 + (sequence * 11) % 260,
      fat: Number(((sequence * 0.7) % 18).toFixed(1)),
      carbohydrates: Number(((sequence * 1.3) % 42).toFixed(1)),
      sugars: Number(((sequence * 0.6) % 18).toFixed(1)),
      protein: Number(((sequence * 0.9) % 32).toFixed(1)),
      fiber: Number(((sequence * 0.2) % 9).toFixed(1)),
      salt: Number(((sequence * 0.05) % 2).toFixed(2))
    },
    tags: [category.name, subcategoryName, item.brand || "B\u00e1ch H\u00f3a T\u01b0\u01a1i"],
    badges: salePrice ? ["sale"] : sequence % 5 === 0 ? ["hot"] : ["fresh"],
    isFeatured: sequence % 3 === 0,
    active: true,
    in_stock: true,
    origin: "Vi\u1ec7t Nam",
    source: "bhx-localized",
    createdAt: "2026-07-04T00:00:00.000Z",
    updatedAt: "2026-07-04T00:00:00.000Z"
  };
  sequence += 1;
  return product;
})).slice(0, 200);

const categoryOutput = categories.map((category, index) => {
  const categoryProducts = products.filter((product) => product.category === category.id);
  const subcategories = [...new Set(categoryProducts.map((product) => product.subcategory))].map((id) => {
    const [name, slug] = subMeta[id] || [category.name, category.slug];
    const firstProduct = categoryProducts.find((product) => product.subcategory === id);
    return {
      id,
      name,
      slug,
      imageUrl: firstProduct?.image_url || category.imageUrl,
      productCount: categoryProducts.filter((product) => product.subcategory === id).length
    };
  });
  const firstCategoryProduct = categoryProducts[0];
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: `${category.name} ch\u1ecdn l\u1ecdc, ph\u00f9 h\u1ee3p cho ch\u1ee3 th\u1ef1c ph\u1ea9m online v\u00e0 giao nhanh trong ng\u00e0y.`,
    imageUrl: firstCategoryProduct?.image_url || category.imageUrl,
    fallbackImageUrl: category.imageUrl,
    icon: "",
    sortOrder: index + 1,
    isActive: true,
    productCount: categoryProducts.length,
    subcategories
  };
});

fs.writeFileSync(path.join(dataDir, "products.json"), `${JSON.stringify(products, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(dataDir, "categories.json"), `${JSON.stringify(categoryOutput, null, 2)}\n`, "utf8");

console.log(`products=${products.length}`);
console.log(`categories=${categoryOutput.length}`);
