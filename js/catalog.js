import { fetchJSON, formatCurrency, getQueryParam, escapeHTML, renderBreadcrumb, createBreadcrumbItems } from "./utils.js";
import { getActiveCart, setActiveCart, toggleWishlist, isWishlisted, getCatalogFilters, setCatalogFilters } from "./storage.js";
import { renderProductCard, showToast, CATEGORY_IMAGES, renderCategorySidebar } from "./main.js";

const DATA_PATHS = {
  products: "./data/products.json",
  categories: "./data/categories.json"
};

let state = {
  products: [],
  categories: [],
  query: "",
  category: "",
  sort: "featured",
  onlySale: false,
  onlyHealthy: false,
  maxPrice: 500000
};

function normalizeText(v) {
  return String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function getActivePrice(p) {
  return p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
}

function getFiltered() {
  const q = normalizeText(state.query);
  return state.products
    .filter(p => {
      if (q && !normalizeText(p.name).includes(q) && !normalizeText(p.description).includes(q) && !normalizeText((p.tags||[]).join(" ")).includes(q)) return false;
      if (state.category && p.categoryId !== state.category) return false;
      if (state.onlySale && !(p.salePrice && p.salePrice < p.price)) return false;
      if (state.onlyHealthy && !(p.tags||[]).some(t => ["healthy","high-protein","protein","organic"].includes(t))) return false;
      if (getActivePrice(p) > state.maxPrice) return false;
      return true;
    })
    .sort((a, b) => {
      if (state.sort === "price-asc") return getActivePrice(a) - getActivePrice(b);
      if (state.sort === "price-desc") return getActivePrice(b) - getActivePrice(a);
      if (state.sort === "rating") return (b.rating||0) - (a.rating||0);
      return Number(!!b.isFeatured) - Number(!!a.isFeatured) || (b.reviewCount||0) - (a.reviewCount||0);
    });
}

function getCategoryName(id) {
  const cat = state.categories.find(c => c.id === id || c.slug === id);
  return cat ? cat.name : "";
}

function renderSidebar() {
  const categoryHtml = renderCategorySidebar(state.categories, state.category);
  // Inject filter controls after the category list via sidebar-filters
  const filtersHtml = `
      <div class="sidebar-filters">
        <div class="sidebar-filters__header">
          <span>Bộ lọc</span>
          <button class="btn btn--sm btn--ghost" id="filter-reset">Xóa lọc</button>
        </div>

        <div class="filter-group">
          <span class="filter-group__label">Khoảng giá</span>
          <div class="price-range">
            <input type="range" min="0" max="500000" step="10000" value="${state.maxPrice}" id="price-range" />
            <div class="price-range__labels">
              <span>0đ</span>
              <span id="price-range-value">${formatCurrency(state.maxPrice)}</span>
            </div>
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-group__label">Bộ lọc nhanh</span>
          <div class="filter-group__options">
            <label class="filter-checkbox">
              <input type="checkbox" id="filter-sale" ${state.onlySale ? 'checked' : ''} /> Đang giảm giá
            </label>
            <label class="filter-checkbox">
              <input type="checkbox" id="filter-healthy" ${state.onlyHealthy ? 'checked' : ''} /> Healthy
            </label>
          </div>
        </div>
      </div>`;
  return categoryHtml.replace('</aside>', filtersHtml + '\n    </aside>');
}

function renderFilterTags() {
  const tags = [];
  if (state.query) tags.push(`<span class="filter-tag">"${escapeHTML(state.query)}" <span class="filter-tag__remove" data-clear="query">✕</span></span>`);
  if (state.category) tags.push(`<span class="filter-tag">${escapeHTML(getCategoryName(state.category))} <span class="filter-tag__remove" data-clear="category">✕</span></span>`);
  if (state.onlySale) tags.push(`<span class="filter-tag">Đang sale <span class="filter-tag__remove" data-clear="onlySale">✕</span></span>`);
  if (state.onlyHealthy) tags.push(`<span class="filter-tag">Healthy <span class="filter-tag__remove" data-clear="onlyHealthy">✕</span></span>`);
  if (!tags.length) return "";
  return `<div class="filter-tags" id="filter-tags">${tags.join("")}</div>`;
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

    <div class="page-layout">
      ${renderSidebar()}

      <div class="page-content catalog-main">
        ${renderFilterTags()}

        <div class="catalog-toolbar">
          <span class="catalog-toolbar__count">${filtered.length} sản phẩm</span>
          <div class="catalog-toolbar__sort">
            <span>Sắp xếp:</span>
            <select id="sort-select">
              <option value="featured" ${state.sort==='featured'?'selected':''}>Nổi bật</option>
              <option value="price-asc" ${state.sort==='price-asc'?'selected':''}>Giá tăng dần</option>
              <option value="price-desc" ${state.sort==='price-desc'?'selected':''}>Giá giảm dần</option>
              <option value="rating" ${state.sort==='rating'?'selected':''}>Đánh giá cao</option>
            </select>
          </div>
        </div>

        <div class="catalog-grid">
          ${filtered.length
            ? filtered.map(p => renderProductCard(p)).join("")
            : `<div class="catalog-empty">
                <div class="catalog-empty__icon">🔍</div>
                <h3 class="catalog-empty__title">Không tìm thấy sản phẩm</h3>
                <p class="catalog-empty__desc">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                <button class="btn btn--primary" id="empty-reset">Xóa bộ lọc</button>
              </div>`
          }
        </div>
      </div>
    </div>
  `;
}

function render() {
  const root = document.getElementById("catalog-root");
  if (!root) return;
  root.innerHTML = renderCatalog();
  bindEvents();
}

function bindEvents() {
  // Category sidebar links - use data-cat-filter attribute
  document.querySelectorAll('.category-sidebar__item[data-cat-filter]').forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const catId = el.dataset.catFilter;
      state.category = catId;
      render();
    });
  });

  document.getElementById("price-range")?.addEventListener("input", (e) => {
    state.maxPrice = Number(e.target.value);
    const label = document.getElementById("price-range-value");
    if (label) label.textContent = formatCurrency(state.maxPrice);
  });

  document.getElementById("price-range")?.addEventListener("change", () => render());

  document.getElementById("filter-sale")?.addEventListener("change", (e) => {
    state.onlySale = e.target.checked;
    render();
  });

  document.getElementById("filter-healthy")?.addEventListener("change", (e) => {
    state.onlyHealthy = e.target.checked;
    render();
  });

  document.getElementById("sort-select")?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });

  document.getElementById("filter-reset")?.addEventListener("click", resetFilters);
  document.getElementById("empty-reset")?.addEventListener("click", resetFilters);

  document.getElementById("filter-tags")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-clear]");
    if (!btn) return;
    const key = btn.dataset.clear;
    if (key === "query") state.query = "";
    if (key === "category") state.category = "";
    if (key === "onlySale") state.onlySale = false;
    if (key === "onlyHealthy") state.onlyHealthy = false;
    render();
  });

  document.getElementById("mobile-filter-btn")?.addEventListener("click", () => {
    document.getElementById("catalog-sidebar")?.classList.toggle("is-open");
  });
}

function resetFilters() {
  state.query = "";
  state.category = "";
  state.sort = "featured";
  state.onlySale = false;
  state.onlyHealthy = false;
  state.maxPrice = 500000;
  setCatalogFilters({ query: "", category: "", sort: "featured", onlySale: false, onlyHealthy: false });
  render();
}

async function initCatalogPage() {
  const [productsRaw, categoriesRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.categories)
  ]);

  state.products = (productsRaw || []).filter(p => p.isActive !== false);
  state.categories = (categoriesRaw || []).filter(c => c.isActive !== false).sort((a, b) => (a.sortOrder||0) - (b.sortOrder||0));

  const saved = getCatalogFilters();
  state.query = getQueryParam("q") || saved.query || "";
  // Convert slug from URL to category id if needed
  const categoryParam = getQueryParam("category") || saved.category || "";
  if (categoryParam) {
    const found = state.categories.find(c => c.slug === categoryParam);
    state.category = found ? found.id : categoryParam;
  } else {
    state.category = "";
  }
  state.sort = saved.sort || "featured";
  state.onlySale = saved.onlySale || false;
  state.onlyHealthy = saved.onlyHealthy || false;

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "catalog") {
    initCatalogPage();
  }
});

export { initCatalogPage };
