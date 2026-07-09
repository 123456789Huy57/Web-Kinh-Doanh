import { fetchJSON, formatCurrency, formatDate, escapeHTML, getQueryParam, formatNumber } from "./utils.js";
import { getActiveCart, setActiveCart, toggleWishlist, isWishlisted, addToCompare, getCompareProducts, getCurrentUser, saveVoucher, isVoucherSaved, mergeAdminProducts, mergeAdminVouchers } from "./storage.js";
import { CATEGORY_IMAGES, SUBCATEGORY_IMAGES, PRODUCT_IMAGES, HERO_SLIDES, FEATURES, BENEFITS, PROMO_BANNERS, TESTIMONIALS, TRUST_STATS, MEAL_STEPS } from "./constants.js";
import { initLanguage, isEnglish, toggleLanguage, getLanguageButtonLabel } from "./i18n.js";

const DATA_PATHS = {
  products: "./data/products.json",
  categories: "./data/categories.json",
  vouchers: "./data/vouchers.json"
};

function langText(vi, en) {
  return isEnglish() ? en : vi;
}

const DIRECT_EN = new Map([
  ["Tươi mới ngày - giao tận nhà", "Fresh daily - delivered home"],
  ["Thực phẩm tươi cho bữa cơm gia đình Việt", "Fresh groceries for every family meal"],
  ["Rau củ sạch, trái cây chín mọng, thịt cá tươi ngon được chọn lọc mỗi sáng. Giao nhanh trong 2 giờ tại khu vực nội thành.", "Clean vegetables, ripe fruits, and fresh meat selected every morning. Fast 2-hour delivery in the city."],
  ["Mua sắm ngay", "Shop now"],
  ["Flash sale - giảm đến 30%", "Flash sale - up to 30% off"],
  ["Ưu đãi hôm nay cho căn bếp luôn đầy", "Today deals for a well-stocked kitchen"],
  ["Xem khuyến mãi", "View deals"],
  ["Meal planner miễn phí", "Free meal planner"],
  ["Chọn món nhanh hơn cho cả tuần", "Plan meals faster for the week"],
  ["Khám phá Meal Planner", "Explore Meal Planner"],
  ["Giao nhanh 2h", "2-hour delivery"],
  ["Nội thành TP.HCM", "Inner HCMC"],
  ["Tươi mới ngày", "Fresh daily"],
  ["Nhập hàng mới sáng", "Restocked every morning"],
  ["Deal mỗi ngày", "Daily deals"],
  ["Ưu đãi đến 30%", "Up to 30% off"],
  ["Đổi trả 24h", "24-hour returns"],
  ["Hoàn tiền nếu không tươi", "Refund if not fresh"],
  ["Khuyến mãi", "Deals"],
  ["Voucher giảm giá hôm nay", "Today vouchers"],
  ["Rau củ tươi", "Fresh vegetables"],
  ["Giảm 15% cho nhóm rau củ", "15% off vegetables"],
  ["Combo tiết kiệm", "Value combo"],
  ["Mua đủ bữa với thịt cá tươi", "Complete meals with fresh meat and fish"],
  ["Đồ uống mùa hè", "Summer drinks"],
  ["Nước ép, sữa và trà cà phê", "Juice, milk, tea and coffee"],
  ["Gian bếp gọn", "Easy pantry"],
  ["Gia vị và hàng khô cho bữa ăn nhanh", "Seasonings and dry goods for quick meals"],
  ["Trái cây mỗi ngày", "Daily fruits"],
  ["Chọn trọn vị ngọt tươi cho cả nhà", "Fresh sweetness for the whole family"],
  ["Xem ngay →", "Shop now →"],
  ["Categories", "Categories"],
  ["Mua sắm theo nhóm hàng", "Shop by category"],
  ["Siêu thị trực tuyến cho gia đình Việt", "Online supermarket for modern families"],
  ["200 sản phẩm chọn lọc, 12 cửa hàng tại TP.HCM, giao nhanh trong 2 giờ nội thành.", "200 curated products, 12 HCMC stores, 2-hour inner-city delivery."],
  ["Sản phẩm chọn lọc", "Curated products"],
  ["Cửa hàng TP.HCM", "HCMC stores"],
  ["Giao nhanh nội thành", "Fast city delivery"],
  ["Đơn hàng hài lòng", "Happy orders"],
  ["Tại sao chọn chúng tôi", "Why choose us"],
  ["Cam kết với gia đình bạn", "Our promise to your family"],
  ["Tươi sạch mỗi ngày", "Fresh every day"],
  ["Hàng tươi được chọn lọc kỹ, nhập về mỗi sáng để giữ đúng chất lượng.", "Fresh items are carefully selected and restocked every morning."],
  ["Giao hàng đúng hẹn", "On-time delivery"],
  ["Đóng gói riêng từng nhóm hàng, giao nhanh trong 2 giờ tại nội thành.", "Packed by product group and delivered within 2 hours in the city."],
  ["Giá tốt, voucher rõ", "Clear prices and vouchers"],
  ["Giá niêm yết minh bạch, voucher tách riêng để dễ dùng khi thanh toán.", "Transparent listed prices and easy checkout vouchers."],
  ["Nguồn gốc rõ ràng", "Clear origin"],
  ["Thông tin sản phẩm, xuất xứ và dinh dưỡng được trình bày để dễ kiểm tra.", "Product origin and nutrition details are easy to review."],
  ["Khách hàng nói gì", "Customer stories"],
  ["Gửi gắm niềm tin từ những bữa cơm", "Trusted for everyday meals"],
  ["Chị Ngọc Hân", "Ngoc Han"],
  ["Khách hàng Quận 7", "Customer in District 7"],
  ["Anh Quốc Bảo", "Quoc Bao"],
  ["Dân văn phòng", "Office customer"],
  ["Chị Minh Tâm", "Minh Tam"],
  ["Khách hàng Thủ Đức", "Customer in Thu Duc"],
  ["Rau củ tươi, đóng gói sạch và giao đúng giờ. Tôi hay đặt trước giờ tan làm để tối về nấu ngay.", "Fresh vegetables, clean packaging, and on-time delivery. I often order before leaving work so dinner is ready to cook."],
  ["Web dễ chọn hàng, phần gợi ý bán chạy khá hữu ích. Giá và voucher hiển thị rõ nên đặt hàng nhanh hơn.", "The site is easy to shop, and best-seller suggestions are useful. Prices and vouchers are clear, so checkout is faster."],
  ["Tôi thích phần thịt cá và trái cây. Sản phẩm về tới nhà vẫn lạnh và nhìn rất tươi.", "I like the meat, fish, and fruit sections. Products arrive chilled and look very fresh."],
  ["Tính năng đặc biệt", "Special feature"],
  ["Không biết hôm nay ăn gì?", "Not sure what to eat today?"],
  ["Tạo thực đơn hằng tuần và danh sách mua sắm tự động chỉ trong vài bước.\n              Hoàn toàn miễn phí, chạy ngay trên trình duyệt.", "Create a weekly menu and shopping list in a few steps. Free and runs in your browser."],
  ["Chọn số người và ngân sách", "Choose people and budget"],
  ["Chọn mục tiêu sức khỏe", "Choose health goals"],
  ["Nhận thực đơn tuần và danh sách mua sắm", "Get a weekly menu and shopping list"],
  ["Đăng ký nhận ưu đãi", "Subscribe for deals"],
  ["Thông tin độc quyền, gửi thẳng hòm thư", "Exclusive updates in your inbox"],
  ["Đăng ký", "Subscribe"],
  ["Không spam. Hủy đăng ký bất cứ lúc nào.", "No spam. Unsubscribe anytime."],
  ["Về chúng tôi", "About us"],
  ["Chăm sóc khách hàng", "Customer care"],
  ["Cộng đồng & Đối tác", "Community & partners"],
  ["Liên hệ", "Contact"],
  ["Giới thiệu Bách Hóa Tươi", "About FreshMart"],
  ["Cửa hàng của chúng tôi", "Our stores"],
  ["Đội ngũ phát triển", "Development team"],
  ["Đồng hành cùng Bách Hóa Tươi", "Partner with FreshMart"],
  ["Blog ẩm thực", "Food blog"],
  ["Hướng dẫn mua hàng", "Shopping guide"],
  ["Chính sách giao hàng", "Shipping policy"],
  ["Chính sách đổi trả hoàn tiền", "Return and refund policy"],
  ["Chính sách bảo mật thông tin", "Privacy policy"],
  ["Cửa hàng Bách Hóa Tươi", "FreshMart stores"],
  ["Đồ án Phát triển Web Kinh doanh", "Business Web Development project"]
]);

function tr(value) {
  if (!isEnglish()) return value;
  return DIRECT_EN.get(value) || EN_TEXT.get(value) || value;
}

const MARKET_PRODUCT_LIMIT = 200;
const SUBCATEGORY_IMAGE_VARIANTS = {
  "vegetables-leafy": [
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80"
  ],
  "vegetables-fruit": [
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1566383444833-43e2ce4d7d7d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1603046891744-76e6481be1ea?auto=format&fit=crop&w=800&q=80"
  ],
  "vegetables-other": [
    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=800&q=80"
  ],
  "fruits-fresh": [
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=800&q=80"
  ],
  "meat-pork": [
    "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80"
  ],
  "meat-chicken": [
    "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80"
  ],
  "meat-beef": [
    "https://images.unsplash.com/photo-1603048297172-c92544798d1a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80"
  ],
  "seafood-fish": [
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=800&q=80"
  ],
  "seafood-other": [
    "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80"
  ],
  "rice-rice": [
    "https://images.unsplash.com/photo-1586201375761-83865011e356?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80"
  ]
};
const MARKET_CATEGORY_LABELS = {
  vegetables: "Rau - Củ",
  fruits: "Trái cây",
  meat: "Thịt",
  seafood: "Hải sản",
  "dairy-eggs": "Sữa - Trứng",
  beverages: "Đồ uống",
  bakery: "Bánh mì - Bakery",
  snacks: "Bánh kẹo - Ăn vặt",
  "rice-grains": "Gạo - Ngũ cốc",
  noodles: "Mì - Bún - Phở",
  condiments: "Gia vị - Nước sốt",
  frozen: "Đông lạnh",
  "tea-coffee": "Trà & cà phê",
  nutrition: "Dinh dưỡng",
  "baby-food": "Đồ ăn cho bé",
};

function cleanText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function toTitleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getProductSalePrice(product) {
  const salePrice = Number(product?.salePrice ?? product?.sale_price ?? 0);
  return Number.isFinite(salePrice) ? salePrice : 0;
}

function pickVariantImage(product, fallback = "") {
  const variants = SUBCATEGORY_IMAGE_VARIANTS[product?.subcategory];
  if (!variants?.length) return fallback;
  const seed = `${product?.id || ""}${product?.name || ""}`;
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[hash % variants.length] || fallback;
}

function getProductImage(product) {
  const image = product?.imageUrl || product?.image_url || product?.image || "";
  const categoryImage = CATEGORY_IMAGES[getProductCategory(product)] || "";
  const subcategoryImage = SUBCATEGORY_IMAGES[product?.subcategory] || "";
  if (!image) return pickVariantImage(product, subcategoryImage || "");
  if (image.startsWith("/assets/")) return `.${image}`;
  if (image === categoryImage && subcategoryImage) return pickVariantImage(product, subcategoryImage);
  return image || pickVariantImage(product, subcategoryImage);
}

function getProductReviewCount(product) {
  return Number(product?.reviewCount ?? product?.review_count ?? 0) || 0;
}

function getProductCategory(product) {
  const category = cleanText(product?.categoryId || product?.category || "");
  const text = cleanText(`${product?.name || ""} ${product?.description || ""} ${(product?.tags || []).join(" ")}`);
  if (MARKET_CATEGORY_LABELS[category]) return category;
  if (category === "cleaning") return "cleaning";
  if (category === "seafood" || /\b(tom|cua|muc|ech|surimi)\b/.test(text)) return "seafood";
  if (category === "meat" || /\b(thit|cha-ca|cha ca|ca basa|ga|bo|heo)\b/.test(text)) return "meat";
  if (category === "snacks" || /\b(banh|snack|keo|cookie|brownie|sponge|roll)\b/.test(text)) return "snacks";
  if (/\b(protein|formula|cereal|ngu coc|ngũ cóc|healthy meal|vitamin)\b/.test(text)) return "nutrition";
  if (category === "baby") return "baby-food";
  if (category === "coffee" || /\b(coffee|cafe|ca phe|cà phê|tea|tra|trà)\b/.test(text)) return "tea-coffee";
  if (category === "dairy-eggs" || category === "dairy") return "dairy-eggs";
  if (category === "rice-grains" || /\b(rice|gao|gạo|grain|yen mach|yến mạch)\b/.test(text)) return "rice-grains";
  if (/\b(syrup|maple|sauce|bot|bột)\b/.test(text)) return "condiments";
  if (category === "beverages" || /\b(juice|nuoc|nước|drink|beverage|milk|sua|sữa)\b/.test(text)) return "beverages";
  return category || "rice-grains";
}

function getProductCategoryLabel(product) {
  return String(product?.categoryName || product?.category || product?.categoryId || "Sản phẩm");
}

function isProductActive(product) {
  return product?.isActive !== false && product?.active !== false;
}

function isMarketProduct(product) {
  const category = getProductCategory(product);
  const text = cleanText(`${product?.name || ""} ${product?.description || ""} ${(product?.tags || []).join(" ")}`);
  if (category === "baby-food" && !/\b(formula|cereal|fruit|apricot|mixed|breakfast|dinner|meal|food|collation|discovery)\b/.test(text)) {
    return false;
  }
  return isProductActive(product) && category !== "cleaning" && category !== "others";
}

function getSubcategoryForProduct(product) {
  const category = getProductCategory(product);
  const text = cleanText(`${product?.name || ""} ${product?.description || ""} ${(product?.tags || []).join(" ")}`);
  const rules = {
    vegetables: [["ca chua|ot|dua leo|bap|dau bap", "Rau ăn quả"], ["rau|xa lach|hanh|ngo|thom", "Rau ăn lá"], ["ca rot|khoai|gung|nam|cu|dua chua", "Rau củ khác"]],
    fruits: [["xoai|chuoi|tao|thanh long|dao|cam|le|cherry|man", "Trái cây tươi"]],
    seafood: [["ca|basa|hoi|ngu", "Cá"], ["muc|cua|tom|ech|surimi", "Hải sản khác"]],
    meat: [["ga", "Thịt gà"], ["bo", "Thịt bò"], ["heo|ba chi|ba roi|suon|chan gio", "Thịt heo"]],
    beverages: [["nuoc suoi|nuoc loc|khoang|water", "Nước khoáng"], ["juice|cranberry|prune|fruit punch|milk|sua|protein|whey|syrup|maple|drink|beverage|bia", "Đồ uống khác"]],
    "tea-coffee": [["coffee|cafe|ca phe|maccoffee|starbucks|trung nguyen", "Cà phê"], ["tea|tra|lipton|brisk|earl grey", "Trà"], ["ngu coc|cereal", "Ngũ cốc"], ["kem dac|cream", "Kem đặc"]],
    nutrition: [["protein|whey", "Protein"], ["formula", "Sữa dinh dưỡng"], ["cereal|ngu coc", "Ngũ cốc"], ["vitamin", "Vitamin"]],
    "baby-food": [["cereal", "Bột ăn dặm"], ["formula", "Sữa cho bé"], ["fruit|apricot|mixed", "Trái cây nghiền"], ["breakfast|dinner|meal", "Bữa ăn cho bé"]],
    snacks: [["banh bong lan|sponge|delipie", "Bánh bông lan"], ["banh an sang|orion", "Bánh ăn sáng"], ["brownie|cookie", "Bánh ngọt"]],
    "rice-grains": [["rice|gao", "Gạo"], ["yen mach|oat|dau hu|dau nanh|bot|duong", "Đồ khô khác"]],
    condiments: [["dau an|oil", "Dầu ăn"], ["nuoc mam|nuoc tuong|sot|sa te|muoi|mat ong", "Nước sốt"]],
    "dairy-eggs": [["trung", "Trứng"], ["sua|pho mai|bo", "Sữa - bơ - phô mai"]],
    noodles: [["mi|bun|pho|banh trang", "Mì ăn liền"]]
  };

  for (const [pattern, label] of rules[category] || []) {
    if (new RegExp(pattern).test(text)) return label;
  }

  if (product?.subcategoryName) return product.subcategoryName;
  return product?.brand ? toTitleCase(product.brand).slice(0, 28) : (MARKET_CATEGORY_LABELS[category] || "Khác");
}

function getMarketCategoryLabel(product) {
  const id = getProductCategory(product);
  return MARKET_CATEGORY_LABELS[id] || toTitleCase(product?.categoryName || product?.category || product?.categoryId || "Sản phẩm");
}

function buildProductCategories(products) {
  const categoryMap = new Map();

  (products || []).filter(isProductActive).forEach((product) => {
    const rawName = String(product?.category || product?.categoryId || "Khác").trim() || "Khác";
    const id = getProductCategory(product);
    const existing = categoryMap.get(id);

    if (existing) {
      existing.productCount += 1;
      return;
    }

    categoryMap.set(id, {
      id,
      slug: id,
      name: toTitleCase(rawName),
      productCount: 1,
      subcategories: []
    });
  });

  return [...categoryMap.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

function sortProductsForMarket(products) {
  return [...(products || [])].sort((a, b) => {
    const featuredDiff = Number(!!b.isFeatured) - Number(!!a.isFeatured);
    if (featuredDiff) return featuredDiff;

    const stockDiff = Number(b.stock || 0) - Number(a.stock || 0);
    if (stockDiff) return stockDiff;

    const reviewDiff = getProductReviewCount(b) - getProductReviewCount(a);
    if (reviewDiff) return reviewDiff;

    return Number(b.rating || 0) - Number(a.rating || 0);
  });
}

function getMarketProducts(products, limit = MARKET_PRODUCT_LIMIT) {
  const curatedProducts = (products || []).filter(isMarketProduct);
  if (curatedProducts.length <= limit) return curatedProducts;
  const mealPlannerProducts = sortProductsForMarket(curatedProducts.filter((product) => product.baseIngredientId));

  const quotas = {
    vegetables: 15,
    fruits: 15,
    meat: 15,
    seafood: 15,
    "dairy-eggs": 15,
    beverages: 58,
    bakery: 15,
    snacks: 15,
    "rice-grains": 15,
    noodles: 15,
    condiments: 15,
    frozen: 15,
    "tea-coffee": 54,
    nutrition: 34,
    "baby-food": 22,
  };
  const selected = [];
  const selectedIds = new Set();
  const marketProducts = sortProductsForMarket(curatedProducts);
  const addProduct = (product) => {
    if (selectedIds.has(product.id) || selected.length >= limit) return;
    selected.push(product);
    selectedIds.add(product.id);
  };

  mealPlannerProducts.forEach(addProduct);

  Object.entries(quotas).forEach(([category, quota]) => {
    marketProducts
      .filter((product) => getProductCategory(product) === category)
      .slice(0, quota)
      .forEach(addProduct);
  });

  marketProducts.forEach(addProduct);

  return selected;
}

function buildMarketProductCategories(products, categorySource = []) {
  const categoryMap = new Map();
  const categoryMeta = new Map((categorySource || []).map((category) => [category.id, category]));

  (products || []).filter(isMarketProduct).forEach((product) => {
    const id = getProductCategory(product);
    const meta = categoryMeta.get(id);
    const metaSubs = meta?.subcategories || [];
    const productSubId = product?.subcategory || "";
    const productSubName = product?.subcategoryName || "";
    const matchedMetaSub = metaSubs.find((sub) =>
      sub.id === productSubId ||
      sub.slug === productSubId ||
      cleanText(sub.name) === cleanText(productSubName)
    ) || (metaSubs.length === 1 ? metaSubs[0] : null);
    const subName = matchedMetaSub?.name || getSubcategoryForProduct(product);
    const subId = matchedMetaSub?.id || `brand:${id}:${cleanText(subName).replace(/\s+/g, "-")}`;
    const existing = categoryMap.get(id);

    if (existing) {
      existing.productCount += 1;
      const sub = existing.subcategories.find((item) => item.id === subId);
      if (sub) sub.productCount += 1;
      else existing.subcategories.push({ id: subId, slug: subId, name: subName, productCount: 1 });
      return;
    }

    categoryMap.set(id, {
      id,
      slug: id,
      name: MARKET_CATEGORY_LABELS[id] || toTitleCase(product?.category || id),
      productCount: 1,
      subcategories: [{ id: subId, slug: subId, name: subName, productCount: 1 }]
    });
  });

  return [...categoryMap.values()]
    .map((cat) => ({
      ...cat,
      slug: categoryMeta.get(cat.id)?.slug || cat.slug,
      name: categoryMeta.get(cat.id)?.name || cat.name,
      imageUrl: categoryMeta.get(cat.id)?.imageUrl || cat.imageUrl,
      fallbackImageUrl: categoryMeta.get(cat.id)?.fallbackImageUrl || cat.fallbackImageUrl,
      subcategories: cat.subcategories
        .map((sub) => {
          const metaSub = (categoryMeta.get(cat.id)?.subcategories || []).find((item) => item.id === sub.id || item.name === sub.name);
          return metaSub ? { ...sub, imageUrl: metaSub.imageUrl || sub.imageUrl, fallbackImageUrl: metaSub.fallbackImageUrl || sub.fallbackImageUrl } : sub;
        })
        .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name, "vi"))
        .slice(0, 10)
    }))
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name, "vi"));
}

function getCartCount() {
  const cart = getActiveCart();
  if (!cart || !cart.items) return 0;
  return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function getDiscountPercent(product) {
  const salePrice = getProductSalePrice(product);
  if (!salePrice || salePrice >= product.price) return 0;
  return Math.round(((product.price - salePrice) / product.price) * 100);
}

/** Track setInterval so we can clear it on page unload */
function trackInterval(id) {
  window.__pageIntervals = window.__pageIntervals || [];
  window.__pageIntervals.push(id);
}

function showToast(message, type = "success") {
  const icons = { success: "✓", error: "!", warning: "!" };
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__icon">${icons[type] || "✓"}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast--exiting");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==================== HEADER ====================
function createHeaderHTML(activePage) {
  const cartCount = getCartCount();
  const siteName = langText("Bách Hóa Tươi", "FreshMart");
  const cartBadge = cartCount > 0
    ? `<span class="header-action-btn__badge">${cartCount > 99 ? "99+" : cartCount}</span>`
    : "";

  const categoryLinks = [
    { slug: "vegetables", img: "./assets/images/cat-vegetables.webp", name: "Rau - Củ" },
    { slug: "fruits", img: "./assets/images/cat-fruits.webp", name: "Trái cây" },
    { slug: "meat", img: "./assets/images/cat-meat.webp", name: "Thịt" },
    { slug: "seafood", img: "./assets/images/cat-seafood.webp", name: "Hải sản" },
    { slug: "rice-grains", img: "./assets/images/cat-pantry.webp", name: "Gạo - Mì" },
    { slug: "condiments", img: "./assets/images/cat-condiments.webp", name: "Gia vị" },
    { slug: "dairy-eggs", img: "./assets/images/cat-dairy.webp", name: "Sữa" },
    { slug: "beverages", img: "./assets/images/cat-beverages.webp", name: "Đồ uống" }
  ];

  return `
    <div class="header-main">
      <div class="container">
        <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Menu">
          <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
        </button>

        <a class="site-logo" href="./index.html">
          <img src="./assets/images/logo-icon.svg" alt="" />
          <span>${siteName}</span>
        </a>

        <nav class="header-nav">
          <a class="header-nav__link${activePage === "index" || activePage === "home" ? " is-active" : ""}" href="./index.html">${langText("Trang chủ", "Home")}</a>
          <a class="header-nav__link${activePage === "catalog" ? " is-active" : ""}" href="./catalog.html">${langText("Sản phẩm", "Products")}</a>
          <a class="header-nav__link${activePage === "meal-planner" ? " is-active" : ""}" href="./meal-planner.html">Meal Planner</a>
        </nav>

        <a class="header-location" href="./stores.html" aria-label="Stores">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span>Stores</span>
        </a>

        <form class="header-search" role="search" id="header-search-form">
          <svg class="header-search__icon" viewBox="0 0 24 24"><path d="M10 2a8 8 0 1 0 4.906 14.32l5.387 5.387a1 1 0 0 0 1.414-1.414l-5.387-5.387A8 8 0 0 0 10 2zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/></svg>
          <input class="header-search__input" type="search" name="q" placeholder="${langText("Tìm rau củ, trái cây, thịt cá...", "Search vegetables, fruits, meat...")}" />
        </form>

        <div class="header-actions">
          <a class="header-action-btn" href="./wishlist.html" aria-label="${langText("Yêu thích", "Wishlist")}">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </a>

          <a class="header-action-btn" href="./vouchers.html" aria-label="Voucher">
            <svg viewBox="0 0 24 24"><path d="M20 12a2 2 0 0 0-2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4a2 2 0 0 0-2 2 2 2 0 0 0 0 4 2 2 0 0 0 2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4a2 2 0 0 0 2-2 2 2 0 0 0 0-4zm-4 8H8v-3a3 3 0 0 1 0-6V8h8v3a3 3 0 0 1 0 6z"/></svg>
          </a>
          <a class="header-action-btn" href="./cart.html" aria-label="${langText("Giỏ hàng", "Cart")}">
            <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
            ${cartBadge}
          </a>

          <button class="header-action-btn header-lang-btn" type="button" aria-label="${langText("Ngôn ngữ", "Language")}" id="lang-toggle">
            <span class="header-lang-flag" id="lang-toggle-label">${getLanguageButtonLabel()}</span>
          </button>

          <a class="header-action-btn" href="./account.html" aria-label="${langText("Tài khoản", "Account")}">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </a>
        </div>
      </div>
    </div>

    <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>
    <div class="mobile-menu" id="mobile-menu">
      <div class="mobile-menu__header">
        <span class="mobile-menu__logo">${siteName}</span>
        <button class="mobile-menu__close" id="mobile-menu-close">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <form class="mobile-menu__search" role="search">
        <svg class="mobile-menu__search-icon" viewBox="0 0 24 24"><path d="M10 2a8 8 0 1 0 4.906 14.32l5.387 5.387a1 1 0 0 0 1.414-1.414l-5.387-5.387A8 8 0 0 0 10 2zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/></svg>
        <input type="search" name="q" placeholder="Tìm sản phẩm..." />
      </form>
      <nav class="mobile-menu__nav">
        <a class="mobile-menu__item" href="./index.html">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          Trang chủ
        </a>
        <a class="mobile-menu__item" href="./catalog.html">Tất cả sản phẩm</a>
        ${categoryLinks.map(cat => `
          <a class="mobile-menu__item" href="./catalog.html?category=${cat.slug}">
            <img src="${cat.img}" alt="" loading="lazy" /> ${cat.name}
          </a>
        `).join("")}
        <div class="mobile-menu__divider"></div>
        <a class="mobile-menu__item" href="./meal-planner.html">Meal Planner</a>
        <a class="mobile-menu__item" href="./cart.html">Giỏ hàng</a>
        <a class="mobile-menu__item" href="./wishlist.html">Yêu thích</a>
        <a class="mobile-menu__item" href="./orders.html">Đơn hàng</a>
        <a class="mobile-menu__item" href="./account.html">Tài khoản</a>
      </nav>
    </div>
  `;
}

// ==================== FOOTER ====================
function createFooterHTML() {
  const year = new Date().getFullYear();
  return `
    <div class="footer-main">
      <div class="container">
        <div>
          <h3 class="footer-heading">${tr("Về chúng tôi")}</h3>
          <div class="footer-links">
            <a href="./about.html">${tr("Giới thiệu Bách Hóa Tươi")}</a>
            <a href="./stores.html">${tr("Cửa hàng của chúng tôi")}</a>
            <a href="./team.html">${tr("Đội ngũ phát triển")}</a>
            <a href="./partner.html">${tr("Đồng hành cùng Bách Hóa Tươi")}</a>
          </div>
        </div>

        <div>
          <h3 class="footer-heading">${tr("Chăm sóc khách hàng")}</h3>
          <div class="footer-links">
            <a href="./blog.html">${tr("Blog ẩm thực")}</a>
            <a href="./guide.html">${tr("Hướng dẫn mua hàng")}</a>
            <a href="./shipping-policy.html">${tr("Chính sách giao hàng")}</a>
            <a href="./return-policy.html">${tr("Chính sách đổi trả hoàn tiền")}</a>
            <a href="./privacy-policy.html">${tr("Chính sách bảo mật thông tin")}</a>
          </div>
        </div>

        <div>
          <h3 class="footer-heading">${tr("Cộng đồng & Đối tác")}</h3>
          <div class="footer-social">
            <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
            <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></a>
            <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
          </div>
        </div>

        <div>
          <h3 class="footer-heading">${tr("Liên hệ")}</h3>
          <div class="footer-contact__list">
            <p>${tr("Cửa hàng Bách Hóa Tươi")}</p>
            <p>Mã số thuế: 079088013113</p>
            <p>63 Đường Số 1, P. Tân Hưng, TP. HCM</p>
            <p><strong>038 369 0006</strong> (7:00 - 22:00)</p>
            <p><a href="mailto:support@bachhoatuoi.local">support@bachhoatuoi.local</a></p>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container">
        <span class="footer-bottom__copy">© ${year} ${langText("Bách Hóa Tươi", "FreshMart")}</span>
        <span style="color:#6a7a6a;font-size:13px;">${tr("Đồ án Phát triển Web Kinh doanh")}</span>
      </div>
    </div>
  `;
}

// ==================== PRODUCT CARD ====================
function renderProductCard(product) {
  const discount = getDiscountPercent(product);
  const salePrice = getProductSalePrice(product);
  const displayPrice = salePrice && salePrice < product.price ? salePrice : product.price;

  let badgesHTML = "";
  if (discount > 0) badgesHTML += `<span class="badge badge--sale">-${discount}%</span>`;
  if (product.isFeatured) badgesHTML += `<span class="badge badge--hot">HOT</span>`;

  const productImage = PRODUCT_IMAGES[product.id]
    || ((getProductImage(product) && !getProductImage(product).includes("placeholder"))
      ? getProductImage(product)
      : (SUBCATEGORY_IMAGES[product.subcategory] || CATEGORY_IMAGES[getProductCategory(product)] || "./assets/images/placeholder-product.svg"));
  const productFallbackImage = SUBCATEGORY_IMAGES[product.subcategory]
    || CATEGORY_IMAGES[getProductCategory(product)]
    || "./assets/images/placeholder-product.svg";

  return `
    <div class="product-card" data-product-id="${product.id}">
      <a href="./product-detail.html?slug=${encodeURIComponent(product.slug)}" class="product-card__image-wrap">
        ${badgesHTML ? `<div class="product-card__badges">${badgesHTML}</div>` : ""}
        <img src="${productImage}" alt="${escapeHTML(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='${productFallbackImage}'" />
      </a>
      <div class="product-card__body">
        <a href="./product-detail.html?slug=${encodeURIComponent(product.slug)}" class="product-card__name">
          ${escapeHTML(product.name)}
        </a>
        <span class="product-card__unit">${escapeHTML(product.brand || "")} · ${escapeHTML(product.unit)}</span>
        <div class="product-card__rating">
          <span class="product-card__rating-star">★</span>
          ${(product.rating || 0).toFixed(1)}
          <span class="text-muted">(${getProductReviewCount(product)})</span>
        </div>
        <div class="product-card__footer">
          <div class="price">
            <span class="price__current ${discount > 0 ? 'price__current--sale' : ''}">${formatCurrency(displayPrice)}</span>
            ${salePrice && salePrice < product.price ? `<span class="price__original">${formatCurrency(product.price)}</span>` : ""}
          </div>
          <div class="product-card__actions">
            ${renderWishlistButton(product.id)}
            <button class="product-card__add-btn" data-action="add-to-cart" data-product-id="${product.id}" title="Thêm vào giỏ">Thêm vào giỏ</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==================== HOME SECTIONS ====================
function renderHero() {
  return `
    <div class="hero" id="hero-carousel">
      <div class="hero__pattern"></div>
      <div class="hero__slides">
        ${HERO_SLIDES.map((slide, i) => `
            <div class="hero__slide ${i === 0 ? "is-active" : ""}" role="group" aria-label="Slide ${i + 1}: ${tr(slide.title)}" aria-hidden="${i !== 0}">
            <div class="hero__visual">
              <img class="hero__visual-img" src="${slide.image}" alt="${tr(slide.title)}" ${i > 0 ? 'loading="lazy"' : 'fetchpriority="high"'} />
            </div>
            <div class="container hero__slide-inner">
              <div class="hero__content">
                <span class="hero__label">${tr(slide.badge)}</span>
                <h1 class="hero__title">${tr(slide.title)}</h1>
                <p class="hero__desc">${tr(slide.subtitle)}</p>
                <div class="hero__actions">
                  <a class="btn btn--accent btn--lg" href="${slide.btnLink}">${tr(slide.btnText)}</a>
                </div>
              </div>
            </div>
            <div class="hero__progress"></div>
          </div>
        `).join("")}
      </div>
      <div class="hero__nav">
        ${HERO_SLIDES.map((_, i) => `<button class="hero__dot ${i === 0 ? "is-active" : ""}" data-slide="${i}"></button>`).join("")}
      </div>
      <button class="hero__arrow hero__arrow--prev" data-dir="prev"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
      <button class="hero__arrow hero__arrow--next" data-dir="next"><svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg></button>
    </div>
  `;
}

function renderFeaturesStrip() {
  return `
    <div class="features-strip">
      <div class="container">
        <div class="features-strip__grid">
          ${FEATURES.map((f, i) => `
            <div class="features-strip__item features-strip__item--${i + 1} reveal reveal-delay-${i + 1}" data-bg="${f.image}" role="img" aria-label="${f.title}">
              <div class="features-strip__text">
                <span class="features-strip__label">${tr(f.title)}</span>
                <span class="features-strip__sub">${tr(f.desc)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderVoucherSection(vouchers) {
  const prioritized = ["WELCOME10", "FREESHIP", "SAVE30K", "PROTEIN20", "FRESH20", "NEWUSER20"];
  const sorted = [...vouchers].sort((a, b) => {
    const ai = prioritized.indexOf(a.code);
    const bi = prioritized.indexOf(b.code);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return `
    <section class="voucher-section reveal">
      <div class="container">
        <div class="section-header">
          <div class="section-header__text">
            <span class="eyebrow">Khuyến mãi</span>
            <h2 class="section-header__title">Voucher giảm giá hôm nay</h2>
          </div>
          <a class="btn btn--outline btn--sm" href="./catalog.html">Xem tất cả</a>
        </div>
        <div class="voucher-grid">
          ${sorted.slice(0, 6).map((v) => {
            v = {
              ...v,
              minOrder: Number(v.minOrder ?? v.minOrderValue ?? 0) || 0,
              expiresAt: v.expiresAt || v.endDate || ""
            };
            const discountLabel = v.discountType === "percent"
              ? `${v.discountValue}%`
              : formatCurrency(v.discountValue);
            const saved = !!getCurrentUser()?.id && isVoucherSaved(v.id);

            return `
              <div class="voucher-card">
                <div class="voucher-card__discount">
                  <span class="voucher-card__amount">${discountLabel}</span>
                  <span class="voucher-card__min">${v.minOrder ? 'Đơn tối thiểu ' + formatCurrency(v.minOrder) : 'Không yêu cầu'}</span>
                </div>
                <div class="voucher-card__info">
                  <span class="voucher-card__code">${escapeHTML(v.code)}</span>
                  <span class="voucher-card__desc">${escapeHTML(v.description || v.title)}</span>
                  <span class="voucher-card__expiry">${v.expiresAt ? 'HSD: 31/12/2026' : ''}</span>
                </div>
                <div class="voucher-card__action">
                  <button class="btn ${saved ? "btn--outline" : "btn--primary"} btn--sm voucher-card__btn" data-action="save-voucher" data-voucher-id="${escapeHTML(v.id)}" type="button">
                    ${saved ? "Đã lưu" : "Lưu voucher"}
                  </button>
                  <a class="btn btn--ghost btn--sm voucher-card__btn" href="./catalog.html">Dùng ngay</a>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderCategorySection(categories, products) {
  return `
    <section class="category-section reveal">
      <div class="container">
        <div class="section-header">
          <div class="section-header__text">
            <span class="eyebrow">Danh mục</span>
            <h2 class="section-header__title">Mua sắm theo nhóm hàng</h2>
          </div>
        </div>
        <div class="category-grid">
          ${categories.map((cat, i) => {
            const count = products.filter((p) => getProductCategory(p) === cat.id).length;
            const img = cat.imageUrl || CATEGORY_IMAGES[cat.id] || "./assets/images/placeholder-banner.svg";
            const fallbackImg = cat.fallbackImageUrl || CATEGORY_IMAGES[cat.id] || "./assets/images/placeholder-banner.svg";
            const delayClass = ` reveal reveal-delay-${(i % 6) + 1}`;
            return `
              <a class="category-card${delayClass}" href="./catalog.html?category=${encodeURIComponent(cat.slug || cat.id)}">
                <div class="category-card__bg">
                  <img src="${img}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImg}'" />
                </div>
                <div class="category-card__content">
                  <span class="category-card__name">${escapeHTML(cat.name)}</span>
                  <span class="category-card__count">${count} sản phẩm</span>
                </div>
              </a>
            `;
          }).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderFlashSale(products) {
  let saleProducts = products
    .filter((p) => {
      const salePrice = getProductSalePrice(p);
      return salePrice && salePrice < p.price;
    })
    .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
    .slice(0, 10);
  if (!saleProducts.length) {
    saleProducts = products
      .filter((p) => Number(p.price || 0) > 0)
      .sort((a, b) => getProductReviewCount(b) - getProductReviewCount(a))
      .slice(0, 10)
      .map((p) => ({ ...p, sale_price: Math.round(Number(p.price) * 0.85 / 1000) * 1000 }));
  }

  return `
    <section class="flash-sale-section reveal">
      <div class="container">
        <div class="flash-sale-header">
          <div class="flash-sale-header__left">
            <h2 class="flash-sale-header__title">Flash Sale</h2>
            <div class="flash-sale-header__timer">
              <div class="flash-sale-timer" id="flash-countdown">
                <div class="flash-sale-timer__unit">
                  <span class="flash-sale-timer__num" id="countdown-h">05</span>
                  <span class="flash-sale-timer__label">Giờ</span>
                </div>
                <span class="flash-sale-timer__sep">:</span>
                <div class="flash-sale-timer__unit">
                  <span class="flash-sale-timer__num" id="countdown-m">30</span>
                  <span class="flash-sale-timer__label">Phút</span>
                </div>
                <span class="flash-sale-timer__sep">:</span>
                <div class="flash-sale-timer__unit">
                  <span class="flash-sale-timer__num" id="countdown-s">00</span>
                  <span class="flash-sale-timer__label">Giây</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flash-sale-actions">
            <button class="flash-sale-nav__btn" id="flash-scroll-prev" aria-label="Trước"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
            <button class="flash-sale-nav__btn" id="flash-scroll-next" aria-label="Sau"><svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg></button>
            <a class="btn btn--sale btn--sm" href="./catalog.html">Xem tất cả →</a>
          </div>
        </div>
        <div class="product-scroll">
          ${saleProducts.map(p => renderProductCard(p)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderProductSection(title, icon, products, sectionClass = "") {
  const sectionId = "accordion-" + title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  return `
    <section class="products-section ${sectionClass}">
      <div class="container">
        <div class="product-accordion is-open" data-accordion-id="${sectionId}">
          <div class="product-accordion__header" data-accordion-trigger>
            <span class="product-accordion__title">
              <span class="product-accordion__icon">${icon.replace(/["']/g,'') || '★'}</span>
              ${title}
            </span>
            <span class="product-accordion__toggle">
              <svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
            </span>
          </div>
          <div class="product-accordion__content">
            <div class="product-accordion__grid">
              ${products.map(p => renderProductCard(p)).join("")}
            </div>
          </div>
        </div>
        <div style="text-align:center;margin-top:8px;">
          <a class="btn btn--outline btn--sm" href="./catalog.html">Xem tất cả sản phẩm →</a>
        </div>
      </div>
    </section>
  `;
}

function renderPromoBanners() {
  const promoImages = {
    green: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    orange: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    blue: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    purple: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    pantry: "https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80",
    fruit: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80"
  };
  const promoItems = [
    ...PROMO_BANNERS,
    { theme: "pantry", title: "Gian bếp gọn", desc: "Gia vị và hàng khô cho bữa ăn nhanh", link: "./catalog.html?category=gia-vi-nuoc-sot" },
    { theme: "fruit", title: "Trái cây mỗi ngày", desc: "Chọn trọn vị ngọt tươi cho cả nhà", link: "./catalog.html?category=trai-cay" }
  ];
  return `
    <section class="promo-section reveal">
      <div class="container">
        <div class="promo-grid">
          ${promoItems.map(p => `
            <a class="promo-banner promo-banner--${p.theme}" href="${p.link}">
              <div class="promo-banner__bg">
                <img src="${promoImages[p.theme] || promoImages.green}" alt="" loading="lazy" />
              </div>
              <div class="promo-banner__content">
                <span class="promo-banner__title">${tr(p.title)}</span>
                <span class="promo-banner__desc">${tr(p.desc)}</span>
                <span class="btn btn--white btn--sm">${tr("Xem ngay →")}</span>
              </div>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderTrustBanner() {
  return `
    <section class="trust-section" role="region" aria-label="Thống kê">
      <div class="trust-section__inner">
        <div class="trust-section__bg">
          <picture><source srcset="./assets/images/hero-fresh.webp" type="image/webp"><source srcset="./assets/images/hero-fresh.jpg" type="image/jpeg"><img src="./assets/images/hero-fresh.jpg" alt="" role="presentation" loading="lazy" /></picture>
        </div>
        <div class="trust-section__content">
          <h2 class="trust-section__title">${tr("Siêu thị trực tuyến cho gia đình Việt")}</h2>
          <p class="trust-section__desc">${tr("200 sản phẩm chọn lọc, 12 cửa hàng tại TP.HCM, giao nhanh trong 2 giờ nội thành.")}</p>
          <div class="trust-grid" role="list">
            ${TRUST_STATS.map(s => `
              <div class="trust-item" role="listitem">
                <div class="trust-item__number" data-count="${s.num}" data-suffix="${s.suffix}" aria-label="${tr(s.label)}">0</div>
                <div class="trust-item__label">${tr(s.label)}</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderBenefits() {
  return `
    <section class="benefits-section reveal">
      <div class="container">
        <div class="section-header">
          <div class="section-header__text">
            <span class="eyebrow">${tr("Tại sao chọn chúng tôi")}</span>
            <h2 class="section-header__title">${tr("Cam kết với gia đình bạn")}</h2>
          </div>
        </div>
        <div class="benefits-grid">
          ${BENEFITS.map((b, i) => `
            <div class="benefit-card reveal reveal-delay-${i + 1}">
              <div class="benefit-card__bg">
                <img src="${b.image}" alt="" loading="lazy" />
              </div>
              <div class="benefit-card__content">
                <h3 class="benefit-card__title">${tr(b.title)}</h3>
                <p class="benefit-card__desc">${tr(b.desc)}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderMealPlannerCTA() {
  return `
    <section class="meal-cta-section reveal">
      <div class="container">
        <div class="meal-cta">
          <div class="meal-cta__content">
            <span class="meal-cta__eyebrow">${tr("Tính năng đặc biệt")}</span>
            <h2 class="meal-cta__title">${tr("Không biết hôm nay ăn gì?")}</h2>
            <p class="meal-cta__desc">${tr("Tạo thực đơn hằng tuần và danh sách mua sắm tự động chỉ trong vài bước.\n              Hoàn toàn miễn phí, chạy ngay trên trình duyệt.")}</p>
            <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px;">
              ${MEAL_STEPS.map((step, i) => `
                <div style="display:flex;align-items:center;gap:14px;">
                  <span style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.12);color:var(--color-accent);font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</span>
                  <span style="font-size:15px;color:rgba(255,255,255,0.8);">${tr(step)}</span>
                </div>
              `).join("")}
            </div>
            <a class="btn btn--accent btn--lg" href="./meal-planner.html" style="font-size:17px;padding:20px 44px;gap:14px;">
              <span>${tr("Khám phá Meal Planner")}</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
          <div class="meal-cta__visual">
            <picture><source srcset="./assets/images/hero-mealplan.webp" type="image/webp"><source srcset="./assets/images/hero-mealplan.jpg" type="image/jpeg"><img src="./assets/images/hero-mealplan.jpg" alt="Meal Planner" loading="lazy" /></picture>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderTestimonials() {
  return `
    <section class="testimonials-section reveal">
      <div class="container">
        <div class="section-header" style="text-align:center">
          <div class="section-header__text">
            <span class="eyebrow">${tr("Khách hàng nói gì")}</span>
            <h2 class="section-header__title">${tr("Gửi gắm niềm tin từ những bữa cơm")}</h2>
          </div>
        </div>
        <div class="testimonials-carousel" id="testimonials-carousel" aria-live="polite" aria-label="Khách hàng đánh giá">
          <div class="testimonials-slides">
            ${TESTIMONIALS.map((t, i) => `
              <div class="testimonials-slide ${i === 0 ? 'is-active' : ''}" data-testimonial="${i}">
                <div class="testimonials-slide__inner">
                  <div class="testimonials-slide__avatar">
                    <img src="${t.image}" alt="${t.name}" loading="lazy" />
                  </div>
                  <div class="testimonials-slide__content">
                    <div class="testimonials-slide__stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
                    <blockquote class="testimonials-slide__text">"${tr(t.text)}"</blockquote>
                    <div class="testimonials-slide__author">
                      <span class="testimonials-slide__name">${tr(t.name)}</span>
                      <span class="testimonials-slide__title">${tr(t.title)}</span>
                    </div>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
          <div class="testimonials-nav">
            ${TESTIMONIALS.map((_, i) => `
              <button class="testimonials-dot ${i === 0 ? 'is-active' : ''}" data-testimonial-slide="${i}" aria-label="Khách hàng ${i + 1}"></button>
            `).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderNewsletter() {
  return `
    <section class="newsletter-section reveal" aria-labelledby="newsletter-title">
      <div class="container">
        <div class="newsletter">
          <div class="newsletter__copy">
            <span class="newsletter__eyebrow">${tr("Đăng ký nhận ưu đãi")}</span>
            <h2 class="newsletter__title" id="newsletter-title">${tr("Thông tin độc quyền, gửi thẳng hòm thư")}</h2>
            <p class="newsletter__desc">Voucher mỗi tuần, deal theo mùa, và mẹo chọn rau củ trái cây tươi ngon - không rác, chỉ giá trị.</p>
          </div>
          <form class="newsletter__form" id="newsletter-form">
            <label for="newsletter-email" class="visually-hidden">Email của bạn</label>
            <input class="newsletter__input" id="newsletter-email" type="email" name="email" placeholder="your@email.com" required autocomplete="email" />
            <button class="newsletter__btn" type="submit">
              <span>${tr("Đăng ký")}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>
          <p class="newsletter__message" id="newsletter-message" aria-live="polite"></p>
          <p class="newsletter__trust">${tr("Không spam. Hủy đăng ký bất cứ lúc nào.")} <a href="./privacy-policy.html" target="_blank" rel="noopener">${tr("Chính sách bảo mật thông tin")}</a></p>
        </div>
      </div>
    </section>
  `;
}

// ==================== INTERACTIONS ====================
function bindHeroCarousel() {
  const slides = document.querySelectorAll(".hero__slide");
  const dots = document.querySelectorAll(".hero__dot");
  if (!slides.length) return;

  let current = 0;
  let interval = null;
  const SLIDE_DURATION = 8000; // match CSS animation duration

  function goTo(index) {
    slides.forEach((s, i) => {
      s.classList.remove("is-active");
      s.setAttribute("aria-hidden", "true");
      // Reset progress bar
      const progress = s.querySelector(".hero__progress");
      if (progress) { progress.style.animation = 'none'; progress.offsetHeight; progress.style.animation = ''; }
    });
    dots.forEach(d => d.classList.remove("is-active"));
    current = (index + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    slides[current].setAttribute("aria-hidden", "false");
    dots[current].classList.add("is-active");
    const focusable = slides[current].querySelector('a, button');
    if (focusable && document.activeElement === carousel) focusable.focus();
  }

  function startAuto() {
    if (interval) clearInterval(interval);
    interval = setInterval(() => goTo(current + 1), SLIDE_DURATION);
    trackInterval(interval);
  }

  function resetAuto() {
    startAuto();
  }

  function stopAuto() {
    if (interval) clearInterval(interval);
    interval = null;
  }

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      goTo(Number(dot.dataset.slide));
      resetAuto();
    });
  });

  const prevBtn = document.querySelector(".hero__arrow--prev");
  const nextBtn = document.querySelector(".hero__arrow--next");
  prevBtn?.addEventListener("click", () => { goTo(current - 1); resetAuto(); });
  nextBtn?.addEventListener("click", () => { goTo(current + 1); resetAuto(); });

  const carousel = document.getElementById("hero-carousel");
  // Pause auto-play on hover
  carousel?.addEventListener("mouseenter", stopAuto);
  carousel?.addEventListener("mouseleave", startAuto);
  // Touch support for mobile swipe
  let touchStartX = 0;
  carousel?.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches[0].screenX; stopAuto(); }, { passive: true });
  carousel?.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 50) { diff < 0 ? goTo(current + 1) : goTo(current - 1); }
    startAuto();
  }, { passive: true });

  startAuto();
}

function bindFlashCountdown() {
  const hEl = document.getElementById("countdown-h");
  const mEl = document.getElementById("countdown-m");
  const sEl = document.getElementById("countdown-s");
  if (!hEl) return;

  function getSecondsToMidnight() {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    return Math.max(0, Math.floor((endOfDay - now) / 1000));
  }

  function update() {
    const totalSeconds = getSecondsToMidnight();
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    hEl.textContent = String(h).padStart(2, "0");
    mEl.textContent = String(m).padStart(2, "0");
    sEl.textContent = String(s).padStart(2, "0");
  }

  update();
  const interval = setInterval(update, 1000);
  trackInterval(interval);

  // Flash sale scroll navigation
  const scrollContainer = document.querySelector(".flash-sale-section .product-scroll");
  const prevBtn = document.getElementById("flash-scroll-prev");
  const nextBtn = document.getElementById("flash-scroll-next");
  if (scrollContainer && prevBtn && nextBtn) {
    const scrollAmount = 250;
    prevBtn.addEventListener("click", () => scrollContainer.scrollBy({ left: -scrollAmount, behavior: "smooth" }));
    nextBtn.addEventListener("click", () => scrollContainer.scrollBy({ left: scrollAmount, behavior: "smooth" }));
  }

  const trendingScroll = document.querySelector(".trending-section .product-scroll");
  const trendingPrev = document.getElementById("trending-scroll-prev");
  const trendingNext = document.getElementById("trending-scroll-next");
  if (trendingScroll && trendingPrev && trendingNext) {
    const scrollAmount = 320;
    trendingPrev.addEventListener("click", () => trendingScroll.scrollBy({ left: -scrollAmount, behavior: "smooth" }));
    trendingNext.addEventListener("click", () => trendingScroll.scrollBy({ left: scrollAmount, behavior: "smooth" }));
  }
}

function bindNewsletter() {
  const form = document.getElementById("newsletter-form");
  const msg = document.getElementById("newsletter-message");
  if (!form || !msg) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = new FormData(form).get("email")?.toString().trim();
    if (!email) {
      msg.textContent = "Vui lòng nhập email.";
      msg.style.color = "var(--color-sale)";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.textContent = "Email không hợp lệ.";
      msg.style.color = "var(--color-sale)";
      return;
    }
    msg.textContent = `Cảm ơn! Đã ghi nhận email ${email}.`;
    msg.style.color = "var(--color-primary)";
    form.reset();
  });
}

function bindTrustCountUp() {
  const numbers = document.querySelectorAll(".trust-item__number[data-count]");
  if (!numbers.length) return;

  let observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || "";
        observer.unobserve(el);

        if (target <= 0) { el.textContent = "0" + suffix; return; }

        const duration = 1500;
        const start = performance.now();

        function step(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          let current = Math.floor(eased * target);
          if (progress < 1 && current === target) current = target - 1; // ensure animation reaches exact target
          el.textContent = current.toLocaleString() + suffix;
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = target.toLocaleString() + suffix;
          }
        }
        requestAnimationFrame(step);
      }
    });
  }, { threshold: 0.5 });

  numbers.forEach(el => observer.observe(el));
}

function bindScrollReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  els.forEach(el => observer.observe(el));
}

function bindHeroKeyboardNav() {
  const carousel = document.getElementById("hero-carousel");
  if (!carousel) return;

  carousel.addEventListener("keydown", (e) => {
    const prevBtn = carousel.querySelector(".hero__arrow--prev");
    const nextBtn = carousel.querySelector(".hero__arrow--next");
    if (e.key === "ArrowLeft") { prevBtn?.click(); e.preventDefault(); }
    if (e.key === "ArrowRight") { nextBtn?.click(); e.preventDefault(); }
  });

  // Make carousel focusable
  if (!carousel.hasAttribute("tabindex")) carousel.setAttribute("tabindex", "0");
  carousel.setAttribute("role", "region");
  carousel.setAttribute("aria-label", "Hero carousel");
}

function bindTestimonialsTouch() {
  const carousel = document.getElementById("testimonials-carousel");
  if (!carousel) return;

  let startX = 0;
  let isDragging = false;

  carousel.addEventListener("touchstart", (e) => {
    startX = e.changedTouches[0].screenX;
    isDragging = true;
  }, { passive: true });

  carousel.addEventListener("touchend", (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diff = e.changedTouches[0].screenX - startX;
    if (Math.abs(diff) > 50) {
      const activeDot = carousel.querySelector(".testimonials-dot.is-active");
      if (!activeDot) return;
      const dots = carousel.querySelectorAll(".testimonials-dot");
      const idx = Array.from(dots).indexOf(activeDot);
      let next = diff < 0 ? idx + 1 : idx - 1;
      if (next < 0) next = dots.length - 1;
      if (next >= dots.length) next = 0;
      dots[next]?.click();
    }
  }, { passive: true });
}

function bindBackToTop() {
  const btn = document.createElement("button");
  btn.className = "back-to-top";
  btn.setAttribute("aria-label", "Về đầu trang");
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;
  document.body.appendChild(btn);

  const showThreshold = 300;
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > showThreshold) {
          btn.classList.add("is-visible");
        } else {
          btn.classList.remove("is-visible");
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
}

function bindTestimonialsSlider() {
  const carousel = document.getElementById("testimonials-carousel");
  if (!carousel) return;

  const slides = carousel.querySelectorAll(".testimonials-slide");
  const dots = carousel.querySelectorAll(".testimonials-dot");
  if (!slides.length) return;

  let current = 0;
  let autoTimer = null;
  const autoDelay = 5000;

  function goTo(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    current = index;

    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === current);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === current);
    });
  }

  function next() {
    goTo(current + 1);
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, autoDelay);
    trackInterval(autoTimer);
  }

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      goTo(i);
      startAuto();
    });
  });

  carousel.addEventListener("mouseenter", stopAuto);
  carousel.addEventListener("mouseleave", startAuto);

  startAuto();
}

function bindMobileMenu() {
  const toggle = document.getElementById("mobile-menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const overlay = document.getElementById("mobile-menu-overlay");
  const close = document.getElementById("mobile-menu-close");
  if (!toggle || !menu) return;

  let lastFocused = null;

  function openMenu() {
    lastFocused = document.activeElement;
    menu.classList.add("is-open");
    overlay?.classList.add("is-open");
    document.body.style.overflow = "hidden";
    // Focus trap: focus first focusable element
    const focusable = menu.querySelector("a, button, input");
    focusable?.focus();
  }

  function closeMenu() {
    menu.classList.remove("is-open");
    overlay?.classList.remove("is-open");
    document.body.style.overflow = "";
    // Return focus to toggle
    lastFocused?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      closeMenu();
      return;
    }
    if (e.key === "Tab") {
      const focusable = menu.querySelectorAll("a, button, input");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  toggle.addEventListener("click", openMenu);
  close?.addEventListener("click", closeMenu);
  overlay?.addEventListener("click", closeMenu);
  menu.addEventListener("keydown", handleKeyDown);
}

function bindSearchForm() {
  const forms = document.querySelectorAll("#header-search-form, .mobile-menu__search");
  forms.forEach((form) => {
    if (form.dataset.searchBound === "true") return;
    form.dataset.searchBound = "true";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = new FormData(form).get("q")?.toString().trim();
      window.location.href = q ? `./catalog.html?q=${encodeURIComponent(q)}` : "./catalog.html";
    });
  });
}

function bindAddToCart() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='add-to-cart']");
    if (!btn) return;
    // Compare page handles its own add-to-cart to avoid double-add
    if (btn.closest(".compare-page, #compare-root")) return;
    e.preventDefault();

    const productId = btn.dataset.productId;
    if (!productId) return;

    const cart = getActiveCart();
    if (!cart.items) cart.items = [];
    const existing = cart.items.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.items.push({ productId, quantity: 1 });
    }
    cart.updatedAt = new Date().toISOString();
    setActiveCart(cart);

    btn.textContent = "✓";
    setTimeout(() => { btn.textContent = "+"; }, 1000);
    showToast("Đã thêm vào giỏ hàng!");

    const badge = document.querySelector(".header-action-btn__badge");
    const newCount = cart.items.reduce((s, i) => s + i.quantity, 0);
    if (badge) {
      badge.textContent = newCount > 99 ? "99+" : newCount;
    }
  });
}

function bindAddToCompare() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='add-to-compare']");
    if (!btn) return;
    e.preventDefault();

    const productId = btn.dataset.productId;
    if (!productId) return;

    const before = getCompareProducts();
    const updated = addToCompare(productId);

    if (updated.length > before.length) {
      btn.textContent = "✓";
      setTimeout(() => { btn.textContent = "+"; }, 1000);
      showToast("Đã thêm vào so sánh!");
    } else if (before.length >= 4) {
      showToast("Tối đa 4 sản phẩm để so sánh");
    } else {
      showToast("Sản phẩm đã có trong so sánh");
    }
  });
}

function bindProductAccordions() {
  document.querySelectorAll("[data-accordion-trigger]").forEach(trigger => {
    trigger.addEventListener("click", () => {
      const accordion = trigger.closest(".product-accordion");
      if (!accordion) return;
      accordion.classList.toggle("is-open");
    });
  });
}

// ==================== SEARCH AUTOCOMPLETE ====================
function bindSearchAutocomplete() {
  const input = document.querySelector(".header-search__input");
  if (!input) return;
  if (input.dataset.autocompleteBound === "true") return;
  input.dataset.autocompleteBound = "true";

  let debounceTimer = null;
  let productsCache = null;

  // Create dropdown
  const dropdown = document.createElement("div");
  dropdown.className = "search-autocomplete";
  dropdown.style.cssText = "position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);z-index:999;max-height:400px;overflow-y:auto;display:none;margin-top:4px;";
  input.parentElement.style.position = "relative";
  input.parentElement.appendChild(dropdown);

  async function fetchProducts() {
    if (productsCache) return productsCache;
    try {
      const raw = await fetchJSON(DATA_PATHS.products);
      productsCache = getMarketProducts(mergeAdminProducts(raw || []));
      return productsCache;
    } catch { return []; }
  }

  function renderSuggestions(query, products) {
    if (!query || query.length < 1) { dropdown.style.display = "none"; return; }
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizeSearchValue = (value) => String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const getSearchRank = (product) => {
      const name = normalizeSearchValue(product.name);
      const brand = normalizeSearchValue(product.brand);
      const category = normalizeSearchValue(getMarketCategoryLabel(product));
      const subcategory = normalizeSearchValue(getSubcategoryForProduct(product));
      if (name.startsWith(q)) return 0;
      if (name.split(/\s+/).some((word) => word.startsWith(q))) return 1;
      if (brand.startsWith(q) || category.startsWith(q) || subcategory.startsWith(q)) return 2;
      return 3;
    };
    const matches = products.filter(p => {
      const text = normalizeSearchValue(`${p.name || ""} ${p.brand || ""} ${getMarketCategoryLabel(p)} ${getSubcategoryForProduct(p)} ${(p.tags || []).join(" ")}`);
      return text.includes(q);
    }).sort((a, b) => {
      const rankDiff = getSearchRank(a) - getSearchRank(b);
      if (rankDiff) return rankDiff;
      return String(a.name || "").localeCompare(String(b.name || ""), "vi", { sensitivity: "base" });
    }).slice(0, 8);

    if (!matches.length) {
      dropdown.style.display = "none";
      return;
    }

    dropdown.innerHTML = matches.map(p => {
      const salePrice = getProductSalePrice(p);
      const displayPrice = salePrice && salePrice < p.price ? salePrice : p.price;
      const img = PRODUCT_IMAGES[p.id] || getProductImage(p) || "";
      return `
        <a class="search-autocomplete__item" href="./product-detail.html?slug=${encodeURIComponent(p.slug)}" style="display:flex;align-items:center;gap:12px;padding:10px 16px;text-decoration:none;color:var(--color-text);transition:background 0.15s;border-bottom:1px solid var(--color-border);">
          <img src="${img || "./assets/images/placeholder-product.svg"}" alt="" style="width:40px;height:40px;border-radius:var(--radius-sm);object-fit:cover;flex-shrink:0;" onerror="this.src='./assets/images/placeholder-product.svg'" />
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(p.name)}</div>
            <div style="font-size:13px;color:var(--color-muted);">${escapeHTML(p.brand || "")} · ${escapeHTML(p.unit)}</div>
          </div>
          <span style="font-size:14px;font-weight:700;color:var(--color-primary);white-space:nowrap;">${formatCurrency(displayPrice)}</span>
        </a>
      `;
    }).join("");

    // Hover effect via CSS
    dropdown.querySelectorAll(".search-autocomplete__item").forEach(item => {
      item.addEventListener("mouseenter", () => { item.style.background = "var(--color-surface-alt)"; });
      item.addEventListener("mouseleave", () => { item.style.background = ""; });
    });

    dropdown.style.display = "block";
  }

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const value = input.value.trim();
    if (value.length < 1) { dropdown.style.display = "none"; return; }
    debounceTimer = setTimeout(async () => {
      const products = await fetchProducts();
      renderSuggestions(value, products);
    }, 250);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { dropdown.style.display = "none"; }, 200);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim().length >= 1) {
      dropdown.style.display = "block";
    }
  });

  // Close on Escape
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") dropdown.style.display = "none";
  });
}

// ==================== TRENDING / SUGGESTED PRODUCTS ====================
function renderTrendingSection(products) {
  const trending = [...products]
    .sort((a, b) => Number(b.sold_count || 0) - Number(a.sold_count || 0) || getProductReviewCount(b) - getProductReviewCount(a))
    .slice(0, 10);
  if (!trending.length) return "";

  return `
    <section class="trending-section reveal">
      <div class="container">
        <div class="section-header">
          <div class="section-header__text">
            <span class="eyebrow">Gợi ý hôm nay</span>
            <h2 class="section-header__title">Sản phẩm bán chạy</h2>
          </div>
          <div class="trending-actions">
            <button class="trending-nav__btn" id="trending-scroll-prev" aria-label="Trước"><svg viewBox="0 0 24 24"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
            <button class="trending-nav__btn" id="trending-scroll-next" aria-label="Sau"><svg viewBox="0 0 24 24"><path d="m10 6-1.41 1.41L13.17 12l-4.58 4.59L10 18l6-6z"/></svg></button>
            <a class="btn btn--outline btn--sm" href="./catalog.html">Xem tất cả</a>
          </div>
        </div>
        <div class="product-scroll">
          ${trending.map(p => renderProductCard(p)).join("")}
        </div>
      </div>
    </section>
  `;
}

// ==================== SAVE-FOR-LATER (WISHLIST CARD BUTTON) ====================
function renderWishlistButton(productId) {
  const isFav = !!getCurrentUser()?.id && isWishlisted(productId);
  return `
    <button class="product-card__wishlist ${isFav ? 'is-active' : ''}" data-action="toggle-wishlist" data-product-id="${productId}" aria-label="${isFav ? 'Bỏ yêu thích' : 'Yêu thích'}" title="${isFav ? 'Bỏ yêu thích' : 'Yêu thích'}">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="${isFav ? 'var(--color-sale)' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    </button>
  `;
}

function bindWishlistToggle() {
  if (document.body.dataset.wishlistToggleBound === "true") return;
  document.body.dataset.wishlistToggleBound = "true";
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='toggle-wishlist']");
    if (!btn) return;
    e.preventDefault();
    const productId = btn.dataset.productId;
    if (!productId) return;

    if (!getCurrentUser()?.id) {
      showToast("Vui lòng đăng nhập để lưu sản phẩm yêu thích", "warning");
      setTimeout(() => {
        window.location.href = "./login.html?redirect=wishlist";
      }, 700);
      return;
    }

    toggleWishlist(productId);
    const nowFav = isWishlisted(productId);
    btn.classList.toggle("is-active", nowFav);
    btn.setAttribute("aria-label", nowFav ? "Bỏ yêu thích" : "Yêu thích");
    btn.querySelector("svg")?.setAttribute("fill", nowFav ? "var(--color-sale)" : "none");
    showToast(nowFav ? "Đã thêm vào yêu thích" : "Đã bỏ khỏi yêu thích");
  });
}

function bindVoucherSave() {
  if (document.body.dataset.voucherSaveBound === "true") return;
  document.body.dataset.voucherSaveBound = "true";
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='save-voucher']");
    if (!button) return;
    event.preventDefault();

    if (!getCurrentUser()?.id) {
      showToast("Vui lòng đăng nhập để lưu voucher vào ví", "warning");
      setTimeout(() => {
        window.location.href = "./login.html?redirect=vouchers";
      }, 700);
      return;
    }

    const voucherId = button.dataset.voucherId;
    if (!voucherId) return;
    saveVoucher(voucherId);
    button.textContent = "Đã lưu";
    button.classList.remove("btn--primary");
    button.classList.add("btn--outline");
    showToast("Đã lưu voucher vào ví của bạn");
  });
}

function bindLanguageToggle() {
  const button = document.getElementById("lang-toggle");
  if (!button) return;
  button.addEventListener("click", () => {
    toggleLanguage();
    window.location.reload();
  });
}

const EN_TEXT = new Map([
  ["Bách Hóa Tươi", "FreshMart"],
  ["FreshMart", "FreshMart"],
  ["Trang chủ", "Home"],
  ["Sản phẩm", "Products"],
  ["Sản phẩm bán chạy", "Best sellers"],
  ["Sản phẩm nổi bật", "Featured products"],
  ["Danh mục sản phẩm", "Product categories"],
  ["Tất cả sản phẩm", "All products"],
  ["Danh mục", "Categories"],
  ["Rau - Củ", "Vegetables"],
  ["Rau củ", "Vegetables"],
  ["Trái cây", "Fruits"],
  ["Thịt", "Meat"],
  ["Hải sản", "Seafood"],
  ["Sữa - Trứng", "Dairy & eggs"],
  ["Đồ uống", "Drinks"],
  ["Bánh mì - Bakery", "Bakery"],
  ["Bánh kẹo - Ăn vặt", "Snacks"],
  ["Gạo - Ngũ cốc", "Rice & grains"],
  ["Mì - Bún - Phở", "Noodles"],
  ["Gia vị - Nước sốt", "Seasoning & sauces"],
  ["Đông lạnh", "Frozen"],
  ["Trà & cà phê", "Tea & coffee"],
  ["Giỏ hàng", "Cart"],
  ["Giỏ hàng đang trống", "Your cart is empty"],
  ["Mua sắm ngay", "Shop now"],
  ["Chọn tất cả", "Select all"],
  ["Xóa tất cả", "Clear all"],
  ["Tạm tính", "Subtotal"],
  ["Phí vận chuyển", "Shipping fee"],
  ["Miễn phí", "Free"],
  ["Giảm giá", "Discount"],
  ["Tổng cộng", "Total"],
  ["Tiến hành thanh toán", "Proceed to checkout"],
  ["Đơn hàng", "Order"],
  ["Đơn hàng của bạn", "Your order"],
  ["Thanh toán", "Checkout"],
  ["Thông tin nhận hàng", "Delivery information"],
  ["Họ và tên *", "Full name *"],
  ["Số điện thoại *", "Phone number *"],
  ["Ghi chú cho người giao hàng", "Note for courier"],
  ["Kho voucher của tôi", "My voucher wallet"],
  ["Voucher khác có thể lưu", "More vouchers to save"],
  ["Sẵn sàng dùng khi thanh toán", "Ready at checkout"],
  ["Bạn chưa lưu voucher nào", "You have not saved any vouchers"],
  ["Voucher đã lưu", "Saved vouchers"],
  ["Lưu thêm voucher", "Save more vouchers"],
  ["Bạn chưa lưu voucher nào.", "You have not saved any vouchers yet."],
  ["Chỉ hiển thị các mã bạn đã lưu", "Only your saved vouchers are shown"],
  ["Địa chỉ giao hàng *", "Delivery address *"],
  ["Chưa có địa chỉ giao hàng", "No delivery address yet"],
  ["Thay đổi", "Change"],
  ["Nhập địa chỉ", "Enter address"],
  ["Xác nhận", "Confirm"],
  ["Phương thức thanh toán", "Payment method"],
  ["Đặt hàng", "Place order"],
  ["Quay lại giỏ hàng", "Back to cart"],
  ["Tiếp tục mua sắm", "Continue shopping"],
  ["Yêu thích", "Wishlist"],
  ["Tài khoản", "Account"],
  ["Giới thiệu", "About"],
  ["Cửa hàng", "Stores"],
  ["Đơn mua", "Orders"],
  ["Lưu voucher", "Save voucher"],
  ["Đã lưu", "Saved"],
  ["Đã lưu trong ví", "Saved"],
  ["Bỏ lưu", "Remove"],
  ["Dùng ngay", "Use now"],
  ["Có thể lưu", "Available"],
  ["Gợi ý hôm nay", "Today picks"],
  ["Gợi ý thêm", "More picks"],
  ["Xem tất cả", "View all"],
  ["Xem chi tiết", "View details"],
  ["Thêm vào giỏ", "Add to cart"],
  ["Thêm sản phẩm vào giỏ", "Add products to cart"],
  ["Tìm sản phẩm", "Search products"],
  ["Tìm kiếm", "Search"],
  ["Meal Planner", "Meal Planner"],
  ["Meal Planner", "Meal Planner"],
  ["Nguyên liệu bạn đang có", "Ingredients you have"],
  ["Tìm nguyên liệu", "Search ingredients"],
  ["Đã chọn:", "Selected:"],
  ["Tiêu chí món ăn", "Recipe preferences"],
  ["Phong cách nấu ăn", "Cuisine"],
  ["Loại món", "Meal type"],
  ["Độ khó", "Difficulty"],
  ["Thời gian", "Time"],
  ["Khẩu phần", "Servings"],
  ["Yêu cầu", "Preferences"],
  ["Tạo món ngay", "Generate recipe"],
  ["Đặt lại", "Reset"],
  ["Kết quả gợi ý", "Suggested recipes"],
  ["Cách làm", "Steps"],
  ["Thông tin dinh dưỡng", "Nutrition"],
  ["Mẹo nấu ăn", "Cooking tips"],
  ["Không tìm thấy món phù hợp", "No matching recipes found"],
  ["Quay lại bộ lọc", "Back to filters"],
  ["Chọn sản phẩm thêm vào giỏ", "Choose products to add"],
  ["Hủy", "Cancel"]
]);

function translateStaticText() {
  if (!isEnglish()) return;
  document.title = "FreshMart";
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const entries = [...EN_TEXT.entries()].sort((a, b) => b[0].length - a[0].length);
  nodes.forEach((node) => {
    const parent = node.parentElement;
    if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) return;
    let next = node.nodeValue;
    entries.forEach(([vi, en]) => {
      next = next.replaceAll(vi, en);
    });
    if (next !== node.nodeValue) {
      node.nodeValue = next;
    }
  });
  document.querySelectorAll("[placeholder]").forEach((el) => {
    const value = el.getAttribute("placeholder");
    if (!value) return;
    if (value.includes("Tìm") || value.includes("Nhập")) el.setAttribute("placeholder", "Search or enter information...");
    if (value.includes("số nhà")) el.setAttribute("placeholder", "Enter house number, street, ward, district...");
  });
}

function observeEnglishTranslation() {
  if (!isEnglish() || document.body.dataset.enObserverBound === "true") return;
  document.body.dataset.enObserverBound = "true";
  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(() => {
      pending = false;
      translateStaticText();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function renderCategorySidebar(categories, activeCategory = "") {
  return `
    <aside class="category-sidebar" id="category-sidebar">
      <div class="category-sidebar__header">
        <span class="category-sidebar__header-text">Danh mục sản phẩm</span>
      </div>
      <div class="category-sidebar__list">
        <a class="category-sidebar__item category-sidebar__item--all ${!activeCategory ? 'is-active' : ''}" href="./catalog.html" data-cat-filter="">
          <span class="category-sidebar__item-text">
            <span class="category-sidebar__item-name">Tất cả sản phẩm</span>
          </span>
        </a>
        ${categories.map(cat => {
          const img = cat.imageUrl || CATEGORY_IMAGES[cat.id] || "./assets/images/placeholder-banner.svg";
          const fallbackImg = cat.fallbackImageUrl || CATEGORY_IMAGES[cat.id] || "./assets/images/placeholder-banner.svg";
          const isActive = activeCategory === cat.id || activeCategory?.startsWith(`brand:${cat.id}:`);
          const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
          return `
            <div class="category-sidebar__item-wrapper" data-category-id="${cat.id}">
              <a class="category-sidebar__item ${isActive ? 'is-active' : ''}" href="./catalog.html?category=${encodeURIComponent(cat.slug || cat.id)}" data-cat-filter="${cat.id}">
                <span class="category-sidebar__item-img"><img src="${img}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImg}'" /></span>
                <span class="category-sidebar__item-text">
                  <span class="category-sidebar__item-name">${escapeHTML(cat.name)}</span>
                  ${cat.productCount ? `<span class="category-sidebar__item-count">${cat.productCount} sp</span>` : ''}
                </span>
              </a>
              ${hasSubcategories ? `
                <div class="category-sidebar__flyout">
                  <div class="category-sidebar__flyout-header">
                    <span class="category-sidebar__flyout-header-img"><img src="${img}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImg}'" /></span>
                    <span class="category-sidebar__flyout-header-title">${escapeHTML(cat.name)}</span>
                    <button class="category-sidebar__flyout-header-close" aria-label="Đóng">
                      <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                  </div>
                  <div class="category-sidebar__flyout-content">
                    ${cat.subcategories.map(sub => {
                      const subFilter = `brand:${cat.id}:${cleanText(sub.name).replace(/\s+/g, "-")}`;
                      const subImg = sub.imageUrl || SUBCATEGORY_IMAGES[sub.id] || img;
                      const subFallbackImg = sub.fallbackImageUrl || SUBCATEGORY_IMAGES[sub.id] || fallbackImg;
                      return `
                      <a class="category-sidebar__flyout-item" href="./catalog.html?category=${encodeURIComponent(subFilter)}" data-cat-filter="${subFilter}">
                        <span class="category-sidebar__flyout-item-img"><img src="${subImg}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${subFallbackImg}'" /></span>
                        <span class="category-sidebar__flyout-item-name">${escapeHTML(sub.name)}</span>
                        ${sub.productCount ? `<span class="category-sidebar__flyout-item-count">${sub.productCount}</span>` : ''}
                      </a>
                    `;
                    }).join('')}
                  </div>
                  <a class="category-sidebar__flyout-view-all" href="./catalog.html?category=${encodeURIComponent(cat.slug || cat.id)}" data-cat-filter="${cat.id}">
                    <span>Xem tất cả ${escapeHTML(cat.name)}</span>
                    <span class="category-sidebar__flyout-view-all-arrow">→</span>
                  </a>
                </div>
              ` : ''}
            </div>
          `;
        }).join("")}
      </div>
    </aside>
    <div class="category-sidebar__flyout-overlay"></div>
  `;
}

function bindSidebarHover() {
  const sidebar = document.getElementById("category-sidebar");
  if (!sidebar || sidebar.dataset.sidebarBound === "true") return;
  sidebar.dataset.sidebarBound = "true";

  const overlay = document.querySelector(".category-sidebar__flyout-overlay");
  const pageLayout = document.querySelector(".page-layout");
  let activeFlyout = null;
  let closeTimer = null;

  function positionFlyout(wrapper, flyoutEl) {
    if (!wrapper || !flyoutEl) return;
    const sidebarRect = sidebar.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const flyoutHeight = Math.min(flyoutEl.offsetHeight || 460, window.innerHeight - 32);
    const minTop = 12;
    const maxTop = Math.max(minTop, window.innerHeight - flyoutHeight - 16 - sidebarRect.top);
    const desiredTop = wrapperRect.top - sidebarRect.top;
    const nextTop = Math.max(minTop, Math.min(desiredTop, maxTop));
    flyoutEl.style.setProperty("--flyout-offset", `${Math.round(nextTop)}px`);
  }

  function openFlyout(flyoutEl, wrapper) {
    if (activeFlyout === flyoutEl) return;
    if (activeFlyout) activeFlyout.classList.remove("is-visible");
    if (!flyoutEl) return;
    positionFlyout(wrapper, flyoutEl);
    flyoutEl.classList.add("is-visible");
    overlay?.classList.add("is-visible");
    pageLayout?.classList.add("has-active-flyout");
    activeFlyout = flyoutEl;
  }

  function closeFlyout() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (activeFlyout) {
      activeFlyout.classList.remove("is-visible");
      activeFlyout = null;
    }
    overlay?.classList.remove("is-visible");
    pageLayout?.classList.remove("has-active-flyout");
  }

  function scheduleClose(wrapper, relatedTarget) {
    const flyout = wrapper?.querySelector(".category-sidebar__flyout");
    if (!flyout) return;
    if (relatedTarget && (wrapper.contains(relatedTarget) || flyout.contains(relatedTarget))) return;
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (activeFlyout === flyout) closeFlyout();
    }, 80);
  }

  sidebar.querySelectorAll(".category-sidebar__item-wrapper").forEach((wrapper) => {
    const flyout = wrapper.querySelector(".category-sidebar__flyout");
    wrapper.addEventListener("mouseenter", () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      wrapper.classList.add("is-hovered");
      if (flyout) openFlyout(flyout, wrapper);
    });
    wrapper.addEventListener("mouseleave", (e) => {
      wrapper.classList.remove("is-hovered");
      scheduleClose(wrapper, e.relatedTarget);
    });
    flyout?.addEventListener("mouseenter", () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      wrapper.classList.add("is-hovered");
    });
    flyout?.addEventListener("mouseleave", (e) => {
      wrapper.classList.remove("is-hovered");
      scheduleClose(wrapper, e.relatedTarget);
    });
  });

  sidebar.addEventListener("mouseover", (event) => {
    const wrapper = event.target.closest(".category-sidebar__item-wrapper");
    if (!wrapper || !sidebar.contains(wrapper)) return;
    const flyout = wrapper.querySelector(".category-sidebar__flyout");
    if (!flyout) return;
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    sidebar.querySelectorAll(".category-sidebar__item-wrapper.is-hovered").forEach((item) => {
      if (item !== wrapper) item.classList.remove("is-hovered");
    });
    wrapper.classList.add("is-hovered");
    openFlyout(flyout, wrapper);
  });

  sidebar.addEventListener("focusin", (event) => {
    const wrapper = event.target.closest(".category-sidebar__item-wrapper");
    if (!wrapper || !sidebar.contains(wrapper)) return;
    const flyout = wrapper.querySelector(".category-sidebar__flyout");
    if (flyout) openFlyout(flyout, wrapper);
  });

  sidebar.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("category-sidebar__flyout-header-close") || target.closest(".category-sidebar__flyout-header-close")) {
      e.stopPropagation();
      closeFlyout();
    }
  }, true);

  overlay?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeFlyout();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFlyout();
  });
}

// ==================== INIT ====================
async function initHomePage() {
  const main = document.querySelector(".home-page");
  if (!main) return;

  // Loading state
  main.innerHTML = `<div class="page-loading" style="display:flex;align-items:center;justify-content:center;min-height:400px;font-family:var(--font-display);font-size:24px;color:var(--color-muted);">Đang tải...</div>`;

  try {
    const [productsRaw, categoriesRaw, vouchersRaw] = await Promise.all([
      fetchJSON(DATA_PATHS.products),
      fetchJSON(DATA_PATHS.categories),
      fetchJSON(DATA_PATHS.vouchers)
    ]);

    const products = getMarketProducts(mergeAdminProducts(productsRaw || []));
    const categories = buildMarketProductCategories(products, categoriesRaw || []);
    const vouchers = mergeAdminVouchers(vouchersRaw || []).filter(v => v.isActive !== false);

    main.innerHTML = [
      renderHero(),
      renderFeaturesStrip(),
      renderVoucherSection(vouchers),
      renderPromoBanners(),
      renderCategorySection(categories, products),
      renderFlashSale(products),
      renderTrendingSection(products),
      renderTrustBanner(),
      renderBenefits(),
      renderTestimonials(),
      renderMealPlannerCTA(),
      renderNewsletter()
    ].join("");

    bindHeroCarousel();
    bindFlashCountdown();
    bindTestimonialsSlider();
    bindNewsletter();
    bindTrustCountUp();
    bindScrollReveal();
    bindHeroKeyboardNav();
    bindTestimonialsTouch();
    bindSearchAutocomplete();
    bindWishlistToggle();
    bindVoucherSave();
    bindProductAccordions();
    bindSkeletonLoading();
  } catch (error) {
    console.error("Failed to load homepage data:", error);
    main.innerHTML = `<div class="page-error" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;gap:16px;padding:40px;text-align:center;">
      <p style="font-size:18px;color:var(--color-text);">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
      <button class="btn btn--primary" onclick="location.reload()">Tải lại trang</button>
    </div>`;
  }
}

/** Add .loaded class to skeleton elements after images load */
function bindSkeletonLoading() {
  const SKELETON_TIMEOUT = 5000; // 5s fallback

  // Category cards - wait for bg images to load
  document.querySelectorAll(".category-card").forEach(card => {
    const img = card.querySelector(".category-card__bg img");
    const markLoaded = () => card.classList.add("loaded");
    if (img) {
      if (img.complete) {
        markLoaded();
      } else {
        img.addEventListener("load", markLoaded, { once: true });
        img.addEventListener("error", markLoaded, { once: true });
      }
    } else {
      markLoaded();
    }
    // Fallback: remove skeleton after timeout even if image hasn't loaded
    setTimeout(markLoaded, SKELETON_TIMEOUT);
  });

  // Features strip items - wait for background images
  document.querySelectorAll(".features-strip__item").forEach(item => {
    const bgUrl = item.dataset.bg;
    const markLoaded = () => item.classList.add("loaded");
    if (bgUrl) {
      const img = new Image();
      img.src = bgUrl;
      if (img.complete) {
        item.style.backgroundImage = `url('${bgUrl}')`;
        markLoaded();
      } else {
        img.addEventListener("load", () => {
          item.style.backgroundImage = `url('${bgUrl}')`;
          markLoaded();
        }, { once: true });
        img.addEventListener("error", () => {
          item.style.backgroundImage = `url('${bgUrl}')`;
          markLoaded();
        }, { once: true });
      }
    } else {
      markLoaded();
    }
    // Fallback: remove skeleton after timeout even if image hasn't loaded
    setTimeout(markLoaded, SKELETON_TIMEOUT);
  });
}

async function mountSharedLayout() {
  try {
    initLanguage();
    const activePage = document.body.dataset.page || "home";
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");

    if (header) header.innerHTML = createHeaderHTML(activePage);
    if (footer) footer.innerHTML = createFooterHTML();

    bindSearchForm();
    bindLanguageToggle();
    bindMobileMenu();
    bindAddToCart();
    bindAddToCompare();
    bindWishlistToggle();
    bindVoucherSave();
    bindBackToTop();
    bindSearchAutocomplete();

    if (activePage === "home") {
      await initHomePage();
    }
    translateStaticText();
    observeEnglishTranslation();
    window.setTimeout(translateStaticText, 100);
    window.setTimeout(translateStaticText, 600);
  } catch (error) {
    console.error("Failed to mount layout:", error);
  }
}


// Cleanup all tracked intervals on page unload
window.addEventListener("beforeunload", () => {
  const all = window.__pageIntervals || [];
  all.forEach(id => clearInterval(id));
  window.__pageIntervals = [];
});

document.addEventListener("DOMContentLoaded", () => {
  void mountSharedLayout();
});

export {
  createHeaderHTML,
  createFooterHTML,
  renderProductCard,
  showToast,
  mountSharedLayout,
  initHomePage,
  CATEGORY_IMAGES,
  PRODUCT_IMAGES,
  renderCategorySidebar,
  bindSidebarHover,
  buildMarketProductCategories as buildProductCategories,
  getMarketProducts,
  getProductCategory,
  getMarketCategoryLabel as getProductCategoryLabel,
  getProductSalePrice,
  getProductReviewCount,
  getProductImage,
  getSubcategoryForProduct,
  isProductActive,
  cleanText
};

