export function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function generateId(prefix = "id") {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${randomPart}`;
}

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function debounce(fn, delay = 200) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

export function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function normalizeRedirectTarget(value, fallback = "./account.html") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (/^(https?:)?\/\//i.test(raw)) return fallback;

  const clean = raw.replace(/^\.?\//, "");
  const knownPages = new Set([
    "account", "admin", "cart", "catalog", "checkout", "compare", "index", "login",
    "meal-planner", "orders", "product-detail", "register", "vouchers", "wishlist"
  ]);

  if (clean.endsWith(".html") || clean.includes(".html?") || clean.includes(".html#")) {
    return `./${clean}`;
  }
  if (knownPages.has(clean)) return `./${clean}.html`;
  if (clean.startsWith("#")) return `./account.html${clean}`;
  return fallback;
}

export function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

export async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }
  return response.json();
}

export function convertToProductUnit(quantity, recipeUnit, productUnit, productUnitWeight) {
  if (!recipeUnit || !productUnit || recipeUnit === productUnit) return quantity;

  if (productUnitWeight && productUnitWeight > 0) {
    if (recipeUnit === "g") {
      if (productUnit === "kg") return quantity / 1000;
      return quantity / productUnitWeight;
    }
    if (recipeUnit === "ml") {
      if (productUnit === "lít") return quantity / 1000;
      return quantity / productUnitWeight;
    }
    const gramEstimate = {
      "muỗng": 15,
      "chén": 200,
      "quả": 150,
      "củ": 150,
      "cây": 200,
      "bó": 300,
      "nải": 1500,
      "lát": 30
    };
    if (gramEstimate[recipeUnit]) {
      return quantity * gramEstimate[recipeUnit] / productUnitWeight;
    }
  }

  if (recipeUnit === "g" && productUnit === "kg") return quantity / 1000;
  if (recipeUnit === "g" && productUnit === "5kg") return quantity / 5000;
  if (recipeUnit === "g" && productUnit === "gói") return quantity / 500;
  if (recipeUnit === "ml" && productUnit === "lít") return quantity / 1000;
  if (recipeUnit === "ml" && (productUnit === "chai" || productUnit === "hộp")) return quantity / 1000;
  if (recipeUnit === "muỗng" && productUnit === "chai") return quantity * 15 / 1000;
  if (recipeUnit === "muỗng" && productUnit === "kg") return quantity * 10 / 1000;
  if (recipeUnit === "muỗng" && productUnit === "gói") return quantity * 10 / 500;
  if (recipeUnit === "quả" && productUnit === "kg") return quantity * 0.15;
  if (recipeUnit === "quả" && productUnit === "nải") return quantity / 10;
  if (recipeUnit === "củ" && productUnit === "kg") return quantity * 0.15;
  if (recipeUnit === "cây" && productUnit === "kg") return quantity * 0.2;
  if (recipeUnit === "bó" && productUnit === "kg") return quantity * 0.3;
  if (recipeUnit === "chén" && productUnit === "kg") return quantity * 0.2;
  if (recipeUnit === "chén" && productUnit === "5kg") return quantity * 0.2 / 5;

  return quantity;
}

export function getDisplayUnit(quantity, productUnit, productUnitWeight) {
  const fmt = (n) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(n);
  if (!productUnit) return fmt(quantity);

  if (productUnitWeight && productUnitWeight > 0) {
    const baseWeight = productUnitWeight;

    if (productUnit === "chai" || productUnit === "hộp") {
      const ml = quantity * baseWeight;
      if (ml < 1) return `< 1ml`;
      if (ml < 1000) return `${Math.round(ml)}ml`;
      return `${fmt(ml / 1000)} lít`;
    }

    if (productUnit === "5kg" || productUnit === "gói" || productUnit === "kg") {
      const g = quantity * baseWeight;
      if (g < 1000) return `${Math.round(g)}g`;
      if (g < 10000) return `${fmt(g / 1000)}kg`;
      if (productUnit === "5kg") return `${fmt(g / 5000)} bao`;
      if (productUnit === "gói") return `${fmt(g / baseWeight)} gói`;
      return `${fmt(g / 1000)}kg`;
    }
  }

  if (productUnit === "kg") {
    if (quantity < 0.01) return `${Math.round(quantity * 1000000)}mg`;
    if (quantity < 1) return `${Math.round(quantity * 1000)}g`;
    return `${fmt(quantity)}kg`;
  }

  if (productUnit === "chai") {
    const ml = quantity * 1000;
    if (ml < 1) return `< 1ml`;
    if (ml < 1000) return `${Math.round(ml)}ml`;
    return `${fmt(ml / 1000)} lít`;
  }

  if (productUnit === "5kg") {
    const g = quantity * 5000;
    if (g < 1000) return `${Math.round(g)}g`;
    if (g < 10000) return `${fmt(g / 1000)}kg`;
    return `${fmt(g / 5000)} bao`;
  }

  if (productUnit === "gói") {
    const g = quantity * 500;
    if (g < 1000) return `${Math.round(g)}g`;
    return `${fmt(g / 500)} gói`;
  }

  if (productUnit === "hộp") {
    const ml = quantity * 1000;
    if (ml < 1000) return `${Math.round(ml)}ml`;
    return `${fmt(ml / 1000)} lít`;
  }

  if (productUnit === "cây") return `${fmt(quantity)} cây`;
  if (productUnit === "củ") return `${fmt(quantity)} củ`;
  if (productUnit === "bó") return `${fmt(quantity)} bó`;
  if (productUnit === "quả") return `${fmt(quantity)} quả`;
  if (productUnit === "nải") {
    if (quantity < 1) {
      const bananas = Math.round(quantity * 10);
      return `${bananas} quả`;
    }
    return `${fmt(quantity)} nải`;
  }
  if (productUnit === "muỗng") return `${fmt(quantity)} muỗng`;
  if (productUnit === "chén") return `${fmt(quantity)} chén`;
  return `${fmt(quantity)} ${productUnit}`;
}

/**
 * Breadcrumb item type
 * @typedef {Object} BreadcrumbItem
 * @property {string} label - Display label
 * @property {string} [href] - Optional link (if not provided, renders as current page)
 * @property {boolean} [isCurrent] - Whether this is the current page
 */

/**
 * Generate breadcrumb HTML from items
 * @param {BreadcrumbItem[]} items - Array of breadcrumb items
 * @returns {string} HTML string for breadcrumb navigation
 */
export function renderBreadcrumb(items) {
  if (!items || !items.length) return "";
  
  return `
    <nav class="breadcrumb" aria-label="Vị trí trang">
      ${items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isCurrent = item.isCurrent || isLast;
        const sep = isLast ? "" : `<span class="breadcrumb__sep" aria-hidden="true">›</span>`;
        
        if (isCurrent || !item.href) {
          return `<span class="breadcrumb__current" aria-current="page">${escapeHTML(item.label)}</span>${sep}`;
        }
        return `<a href="${item.href}" class="breadcrumb__link">${escapeHTML(item.label)}</a>${sep}`;
      }).join("")}
    </nav>
  `;
}

/**
 * Create standard breadcrumb items for common page types
 * @param {Object} options - Breadcrumb options
 * @param {string} options.pageType - Type of page: 'home', 'catalog', 'product', 'category', 'search', 'account', 'cart', 'checkout', 'orders', 'wishlist', 'meal-planner', 'blog', 'guide', 'about', 'stores', 'team', 'partner', 'policy'
 * @param {Object} [options.data] - Additional data for dynamic breadcrumbs
 * @returns {BreadcrumbItem[]} Array of breadcrumb items
 */
export function createBreadcrumbItems(options) {
  const { pageType, data = {} } = options;
  const home = { label: "Trang chủ", href: "./index.html" };
  
  switch (pageType) {
    case "home":
      return [{ label: "Trang chủ", isCurrent: true }];
      
    case "catalog":
      return [
        home,
        { label: "Sản phẩm", href: "./catalog.html", isCurrent: true }
      ];
      
    case "category":
      return [
        home,
        { label: "Sản phẩm", href: "./catalog.html" },
        { label: data.categoryName || "Danh mục", isCurrent: true }
      ];
      
    case "search":
      return [
        home,
        { label: "Sản phẩm", href: "./catalog.html" },
        { label: `Tìm kiếm: "${data.query || ""}"`, isCurrent: true }
      ];
      
    case "product":
      return [
        home,
        { label: "Sản phẩm", href: "./catalog.html" },
        ...(data.categoryName ? [{ label: data.categoryName, href: `./catalog.html?category=${data.categoryId}` }] : []),
        { label: data.productName || "Chi tiết sản phẩm", isCurrent: true }
      ];
      
    case "account":
      return [
        home,
        { label: "Tài khoản", isCurrent: true }
      ];
      
    case "cart":
      return [
        home,
        { label: "Giỏ hàng", isCurrent: true }
      ];
      
    case "checkout":
      return [
        home,
        { label: "Giỏ hàng", href: "./cart.html" },
        { label: "Thanh toán", isCurrent: true }
      ];
      
    case "orders":
      return [
        home,
        { label: "Tài khoản", href: "./account.html" },
        { label: "Đơn hàng", isCurrent: true }
      ];
      
    case "wishlist":
      return [
        home,
        { label: "Yêu thích", isCurrent: true }
      ];

    case "compare":
      return [
        home,
        { label: "So sánh sản phẩm", isCurrent: true }
      ];

    case "meal-planner":
      return [
        home,
        { label: "Meal Planner", isCurrent: true }
      ];
      
    case "blog":
      return [
        home,
        { label: "Blog", isCurrent: true }
      ];
      
    case "guide":
      return [
        home,
        { label: "Hướng dẫn", isCurrent: true }
      ];
      
    case "about":
      return [
        home,
        { label: "Về chúng tôi", isCurrent: true }
      ];
      
    case "stores":
      return [
        home,
        { label: "Hệ thống cửa hàng", isCurrent: true }
      ];
      
    case "team":
      return [
        home,
        { label: "Đội ngũ", isCurrent: true }
      ];
      
    case "partner":
      return [
        home,
        { label: "Đối tác", isCurrent: true }
      ];
      
    case "policy":
      return [
        home,
        { label: data.policyName || "Chính sách", isCurrent: true }
      ];
      
    default:
      return [{ label: "Trang chủ", isCurrent: true }];
  }
}

