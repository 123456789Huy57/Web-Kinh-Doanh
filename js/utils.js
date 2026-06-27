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
