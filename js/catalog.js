import { fetchJSON, formatCurrency, getQueryParam, escapeHTML, renderBreadcrumb, createBreadcrumbItems } from "./utils.js";
import { getCatalogFilters, setCatalogFilters, mergeAdminProducts } from "./storage.js";
import {
  renderProductCard,
  renderCategorySidebar,
  bindSidebarHover,
  buildProductCategories,
  getProductCategory,
  getProductSalePrice,
  isProductActive,
  cleanText,
  getMarketProducts,
  getSubcategoryForProduct
} from "./main.js";

const MARKET_PRODUCT_LIMIT = 200;

const DATA_PATHS = {
  products: "./data/products.json",
  categories: "./data/categories.json"
};

const DEFAULT_FILTERS = {
  query: "",
  category: "",
  sort: "featured",
  onlySale: false,
  onlyHealthy: false,
  onlyInStock: false,
  onlyPopular: false,
  onlyTopRated: false,
  onlyFresh: false,
  onlyLocal: false,
  under50k: false,
  maxPrice: 1000000
};

let state = {
  products: [],
  categories: [],
  ...DEFAULT_FILTERS
};

function normalizeCatalogText(v) {
  return cleanText(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getActivePrice(product) {
  const salePrice = getProductSalePrice(product);
  return salePrice && salePrice < product.price ? salePrice : product.price;
}

function productMatchesSearch(product, q) {
  if (!q) return true;
  const haystack = [
    product.name,
    product.brand,
    product.description,
    product.categoryName,
    product.subcategoryName,
    ...(product.tags || [])
  ].map(normalizeCatalogText).join(" ");
  return haystack.includes(q);
}

function productMatchesCategory(product) {
  if (!state.category) return true;
  if (state.category.startsWith("brand:")) {
    const [, category, subcategory] = state.category.split(":");
    const productSub = cleanText(getSubcategoryForProduct(product)).replace(/\s+/g, "-");
    return getProductCategory(product) === category && productSub === subcategory;
  }
  return getProductCategory(product) === state.category;
}

function getFiltered() {
  const q = normalizeCatalogText(state.query);
  return state.products
    .filter((product) => {
      if (!productMatchesSearch(product, q)) return false;
      if (!productMatchesCategory(product)) return false;
      if (state.onlySale && !(getProductSalePrice(product) && getProductSalePrice(product) < product.price)) return false;
      if (state.onlyHealthy) {
        const healthyCategories = ["vegetables", "fruits", "seafood", "dairy-eggs"];
        const hasHealthyTag = (product.tags || []).some((tag) => ["healthy", "high-protein", "protein", "organic"].includes(normalizeCatalogText(tag)));
        if (!healthyCategories.includes(getProductCategory(product)) && !hasHealthyTag) return false;
      }
      if (state.onlyInStock && product.in_stock === false) return false;
      if (state.onlyPopular && Number(product.sold_count || 0) < 800) return false;
      if (state.onlyTopRated && Number(product.rating || 0) < 4.5) return false;
      if (state.onlyFresh && !(product.badges || []).some((tag) => ["fresh", "hot"].includes(tag))) return false;
      if (state.onlyLocal && !/việt nam|viet nam/i.test(cleanText(product.origin || ""))) return false;
      if (state.under50k && getActivePrice(product) > 50000) return false;
      if (getActivePrice(product) > state.maxPrice) return false;
      return true;
    })
    .sort((a, b) => {
      if (state.sort === "price-asc") return getActivePrice(a) - getActivePrice(b);
      if (state.sort === "price-desc") return getActivePrice(b) - getActivePrice(a);
      if (state.sort === "rating") return (b.rating || 0) - (a.rating || 0);
      return Number(!!b.isFeatured) - Number(!!a.isFeatured)
        || Number(b.review_count || b.reviewCount || 0) - Number(a.review_count || a.reviewCount || 0);
    });
}

function getCategoryName(id) {
  if (id?.startsWith("brand:")) {
    const [, category, subcategory] = id.split(":");
    const cat = state.categories.find((item) => item.id === category);
    const sub = cat?.subcategories?.find((item) => cleanText(item.name).replace(/\s+/g, "-") === subcategory);
    return sub ? `${sub.name} · ${cat.name}` : id;
  }
  const cat = state.categories.find((item) => item.id === id || item.slug === id);
  return cat ? cat.name : "";
}

function renderQuickFilter(id, label, checked) {
  return `
    <label class="filter-chip">
      <input type="checkbox" id="${id}" ${checked ? "checked" : ""} />
      <span>${label}</span>
    </label>`;
}

function renderSidebar() {
  const categoryHtml = renderCategorySidebar(state.categories, state.category);
  const filtersHtml = `
      <div class="sidebar-filters">
        <div class="sidebar-filters__header">
          <span>Bộ lọc</span>
          <button class="btn btn--sm btn--ghost" id="filter-reset">Xóa lọc</button>
        </div>

        <div class="filter-group">
          <span class="filter-group__label">Khoảng giá</span>
          <div class="price-range">
            <input type="range" min="0" max="1000000" step="10000" value="${state.maxPrice}" id="price-range" />
            <div class="price-range__labels">
              <span>0đ</span>
              <span id="price-range-value">${formatCurrency(state.maxPrice)}</span>
            </div>
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-group__label">Bộ lọc nhanh</span>
          <div class="filter-chip-grid">
            ${renderQuickFilter("filter-sale", "Đang giảm giá", state.onlySale)}
            ${renderQuickFilter("filter-in-stock", "Còn hàng", state.onlyInStock)}
            ${renderQuickFilter("filter-popular", "Bán chạy", state.onlyPopular)}
            ${renderQuickFilter("filter-top-rated", "Đánh giá cao", state.onlyTopRated)}
            ${renderQuickFilter("filter-fresh", "Hàng tươi", state.onlyFresh)}
            ${renderQuickFilter("filter-local", "Hàng Việt Nam", state.onlyLocal)}
            ${renderQuickFilter("filter-under-50k", "Dưới 50.000đ", state.under50k)}
            ${renderQuickFilter("filter-healthy", "Healthy", state.onlyHealthy)}
          </div>
        </div>
      </div>`;
  return categoryHtml.replace("</aside>", `${filtersHtml}\n    </aside>`);
}

function renderFilterTags() {
  const tags = [];
  const push = (key, label) => tags.push(`<span class="filter-tag">${escapeHTML(label)} <span class="filter-tag__remove" data-clear="${key}">×</span></span>`);
  if (state.query) push("query", `"${state.query}"`);
  if (state.category) push("category", getCategoryName(state.category));
  if (state.onlySale) push("onlySale", "Đang sale");
  if (state.onlyHealthy) push("onlyHealthy", "Healthy");
  if (state.onlyInStock) push("onlyInStock", "Còn hàng");
  if (state.onlyPopular) push("onlyPopular", "Bán chạy");
  if (state.onlyTopRated) push("onlyTopRated", "Đánh giá cao");
  if (state.onlyFresh) push("onlyFresh", "Hàng tươi");
  if (state.onlyLocal) push("onlyLocal", "Hàng Việt Nam");
  if (state.under50k) push("under50k", "Dưới 50.000đ");
  return tags.length ? `<div class="filter-tags" id="filter-tags">${tags.join("")}</div>` : "";
}

function renderCatalog() {
  const filtered = getFiltered();
  const catName = state.category ? getCategoryName(state.category) : "Tất cả sản phẩm";
  const breadcrumbItems = state.category
    ? createBreadcrumbItems({ pageType: "category", data: { categoryName: catName } })
    : createBreadcrumbItems({ pageType: "catalog" });

  return `
    ${renderBreadcrumb(breadcrumbItems)}

    <button class="btn btn--outline btn--sm mobile-filter-toggle" id="mobile-filter-btn">Bộ lọc</button>
    <div class="catalog-filter-overlay" aria-hidden="true"></div>

    <div class="page-layout">
      ${renderSidebar()}

      <div class="page-content catalog-main">
        ${renderFilterTags()}

        <div class="catalog-toolbar">
          <span class="catalog-toolbar__count">${filtered.length} sản phẩm</span>
          <div class="catalog-toolbar__sort">
            <span>Sắp xếp:</span>
            <select id="sort-select">
              <option value="featured" ${state.sort === "featured" ? "selected" : ""}>Nổi bật</option>
              <option value="price-asc" ${state.sort === "price-asc" ? "selected" : ""}>Giá tăng dần</option>
              <option value="price-desc" ${state.sort === "price-desc" ? "selected" : ""}>Giá giảm dần</option>
              <option value="rating" ${state.sort === "rating" ? "selected" : ""}>Đánh giá cao</option>
            </select>
          </div>
        </div>

        <div class="catalog-grid">
          ${filtered.length
            ? filtered.map((product) => renderProductCard(product)).join("")
            : `<div class="catalog-empty">
                <div class="catalog-empty__icon">🔍</div>
                <h3 class="catalog-empty__title">Không tìm thấy sản phẩm</h3>
                <p class="catalog-empty__desc">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                <button class="btn btn--primary" id="empty-reset">Xóa bộ lọc</button>
              </div>`}
        </div>
      </div>
    </div>
  `;
}

function saveFilters() {
  setCatalogFilters({
    query: state.query,
    category: state.category,
    sort: state.sort,
    onlySale: state.onlySale,
    onlyHealthy: state.onlyHealthy,
    onlyInStock: state.onlyInStock,
    onlyPopular: state.onlyPopular,
    onlyTopRated: state.onlyTopRated,
    onlyFresh: state.onlyFresh,
    onlyLocal: state.onlyLocal,
    under50k: state.under50k,
    maxPrice: state.maxPrice
  });
}

function render() {
  const root = document.getElementById("catalog-root");
  if (!root) return;
  root.innerHTML = renderCatalog();
  bindEvents();
  bindSidebarHover?.();
}

function updateFilter(key, value) {
  state[key] = value;
  saveFilters();
  render();
}

function bindCheckbox(id, key) {
  document.getElementById(id)?.addEventListener("change", (event) => {
    updateFilter(key, event.target.checked);
  });
}

function bindEvents() {
  const closeMobileFilters = () => {
    document.getElementById("category-sidebar")?.classList.remove("is-open");
    document.querySelector(".catalog-filter-overlay")?.classList.remove("is-open");
    document.body.classList.remove("catalog-filter-open");
  };

  document.querySelectorAll(".category-sidebar__item[data-cat-filter]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      updateFilter("category", el.dataset.catFilter);
      closeMobileFilters();
    });
  });

  document.getElementById("price-range")?.addEventListener("input", (event) => {
    state.maxPrice = Number(event.target.value);
    const label = document.getElementById("price-range-value");
    if (label) label.textContent = formatCurrency(state.maxPrice);
  });

  document.getElementById("price-range")?.addEventListener("change", () => {
    saveFilters();
    render();
  });

  bindCheckbox("filter-sale", "onlySale");
  bindCheckbox("filter-healthy", "onlyHealthy");
  bindCheckbox("filter-in-stock", "onlyInStock");
  bindCheckbox("filter-popular", "onlyPopular");
  bindCheckbox("filter-top-rated", "onlyTopRated");
  bindCheckbox("filter-fresh", "onlyFresh");
  bindCheckbox("filter-local", "onlyLocal");
  bindCheckbox("filter-under-50k", "under50k");

  document.getElementById("sort-select")?.addEventListener("change", (event) => updateFilter("sort", event.target.value));
  document.getElementById("filter-reset")?.addEventListener("click", resetFilters);
  document.getElementById("empty-reset")?.addEventListener("click", resetFilters);

  document.getElementById("filter-tags")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-clear]");
    if (!btn) return;
    const key = btn.dataset.clear;
    state[key] = DEFAULT_FILTERS[key];
    saveFilters();
    render();
  });

  document.getElementById("mobile-filter-btn")?.addEventListener("click", () => {
    const sidebar = document.getElementById("category-sidebar");
    const isOpen = !sidebar?.classList.contains("is-open");
    sidebar?.classList.toggle("is-open", isOpen);
    document.querySelector(".catalog-filter-overlay")?.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("catalog-filter-open", isOpen);
  });

  document.querySelector(".catalog-filter-overlay")?.addEventListener("click", closeMobileFilters);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMobileFilters();
  });
}

function resetFilters() {
  state = { ...state, ...DEFAULT_FILTERS };
  saveFilters();
  render();
}

function normalizeSavedFilters(savedFilters) {
  const saved = { ...DEFAULT_FILTERS, ...savedFilters };
  const hasActiveNonPriceFilter = Boolean(
    saved.query ||
    saved.category ||
    saved.onlySale ||
    saved.onlyHealthy ||
    saved.onlyInStock ||
    saved.onlyPopular ||
    saved.onlyTopRated ||
    saved.onlyFresh ||
    saved.onlyLocal ||
    saved.under50k ||
    saved.sort !== DEFAULT_FILTERS.sort
  );

  if (!hasActiveNonPriceFilter && (!savedFilters?.maxPrice || savedFilters.maxPrice === 500000)) {
    saved.maxPrice = DEFAULT_FILTERS.maxPrice;
  }

  return saved;
}

async function initCatalogPage() {
  const [productsRaw, categoriesRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.categories)
  ]);

  state.products = getMarketProducts(mergeAdminProducts(productsRaw || []), MARKET_PRODUCT_LIMIT);
  const categoryMeta = new Map((categoriesRaw || []).map((category) => [category.id, category]));
  state.categories = buildProductCategories(state.products).map((category) => {
    const meta = categoryMeta.get(category.id);
    if (!meta) return category;
    return {
      ...category,
      slug: meta.slug || category.slug,
      name: meta.name || category.name,
      imageUrl: meta.imageUrl || category.imageUrl,
      fallbackImageUrl: meta.fallbackImageUrl || category.fallbackImageUrl,
      subcategories: category.subcategories.map((sub) => {
        const metaSub = (meta.subcategories || []).find((item) => item.id === sub.id || item.name === sub.name);
        return metaSub ? { ...sub, imageUrl: metaSub.imageUrl || sub.imageUrl, fallbackImageUrl: metaSub.fallbackImageUrl || sub.fallbackImageUrl } : sub;
      })
    };
  });

  const saved = normalizeSavedFilters(getCatalogFilters());
  state = { ...state, ...saved };
  state.query = getQueryParam("q") || saved.query || "";

  const categoryParam = getQueryParam("category") || saved.category || "";
  if (categoryParam) {
    const found = state.categories.find((item) => item.slug === categoryParam || item.id === categoryParam);
    state.category = found ? found.id : categoryParam;
  } else {
    state.category = "";
  }

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "catalog") {
    initCatalogPage();
  }
});

export { initCatalogPage };
