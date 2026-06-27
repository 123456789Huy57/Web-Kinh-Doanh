import { fetchJSON, formatCurrency, escapeHTML, renderBreadcrumb, createBreadcrumbItems, formatNumber } from "./utils.js";
import { getActiveCart, setActiveCart, getCompareProducts, setCompareProducts, addToCompare, removeFromCompare, clearCompare } from "./storage.js";
import { showToast, PRODUCT_IMAGES, CATEGORY_IMAGES } from "./main.js";

const DATA_PATHS = {
  products: "./data/products.json",
  categories: "./data/categories.json"
};

let state = {
  products: [],
  categories: [],
  compareIds: []
};

function getProduct(id) {
  return state.products.find(p => p.id === id);
}

function getActivePrice(p) {
  return p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
}

function getDiscountPercent(p) {
  if (!p.salePrice || p.salePrice >= p.price) return 0;
  return Math.round((1 - p.salePrice / p.price) * 100);
}

function getProductImage(product) {
  return PRODUCT_IMAGES[product.id]
    || (product.imageUrl && !product.imageUrl.includes('placeholder')
      ? product.imageUrl
      : (CATEGORY_IMAGES[product.categoryId] || './assets/images/placeholder-product.svg'));
}

function getCategoryName(id) {
  const cat = state.categories.find(c => c.id === id || c.slug === id);
  return cat ? cat.name : "";
}

function renderComparePage() {
  const compareProducts = state.compareIds.map(id => getProduct(id)).filter(Boolean);

  if (!compareProducts.length) {
    return `
      ${renderBreadcrumb(createBreadcrumbItems({ pageType: "compare" }))}
      <div class="compare-empty">
        <div class="compare-empty__icon">📊</div>
        <h1 class="compare-empty__title">Chưa có sản phẩm để so sánh</h1>
        <p class="compare-empty__desc">Thêm sản phẩm từ trang danh mục hoặc chi tiết để so sánh thông số.</p>
        <a class="btn btn--primary btn--lg" href="./catalog.html">Đi đến danh mục</a>
      </div>
    `;
  }

  const maxProducts = 4;
  const canAddMore = compareProducts.length < maxProducts;

  return `
    ${renderBreadcrumb(createBreadcrumbItems({ pageType: "compare" }))}
    <div class="orders-header">
      <h1 class="orders-header__title">So sánh sản phẩm</h1>
      <p style="color:var(--color-muted);">So sánh thông số, giá và dinh dưỡng để chọn sản phẩm phù hợp nhất.</p>
    </div>

    <div class="compare-header">
      <h2 class="compare-header__title">Đang so sánh <span class="compare-header__count">${compareProducts.length}/${maxProducts} sản phẩm</span></h2>
      ${compareProducts.length > 1 ? `
        <button class="btn btn--sale btn--sm" id="compare-clear-btn" type="button">Xóa tất cả</button>
      ` : ""}
    </div>

    <div class="compare-table-wrap" id="compare-table-wrap">
      <table class="compare-table" role="table">
        <thead>
          <tr>
            <th>Thông số</th>
            ${compareProducts.map(p => `
              <th scope="col">
                <div class="compare-product" data-product-id="${p.id}">
                  <button class="compare-product__remove" data-action="remove-compare" data-product-id="${p.id}" aria-label="Xóa ${escapeHTML(p.name)}">✕</button>
                  <img class="compare-product__image" src="${getProductImage(p)}" alt="${escapeHTML(p.name)}" loading="lazy" />
                  <div class="compare-product__name">${escapeHTML(p.name)}</div>
                  <div class="compare-product__brand">${escapeHTML(p.brand || "")}</div>
                  <div class="compare-product__price">
                    <span class="price__current ${getDiscountPercent(p) > 0 ? 'price__current--sale' : ''}">${formatCurrency(getActivePrice(p))}</span>
                    ${p.salePrice && p.salePrice < p.price ? `<span class="price__original">${formatCurrency(p.price)}</span>` : ""}
                    ${getDiscountPercent(p) > 0 ? `<span class="badge badge--sale">-${getDiscountPercent(p)}%</span>` : ""}
                  </div>
                  <button class="btn btn--primary btn--sm compare-product__add-btn" data-action="add-to-cart" data-product-id="${p.id}" type="button">Thêm giỏ</button>
                </div>
              </th>
            `).join("")}
            ${canAddMore ? `
              <th scope="col">
                <button class="compare-add-more" id="compare-add-more" type="button" aria-label="Thêm sản phẩm để so sánh">
                  <span>+</span>
                  <span>Thêm sản phẩm</span>
                </button>
              </th>
            ` : ""}
          </tr>
        </thead>
        <tbody>
          ${renderCompareRows(compareProducts)}
        </tbody>
      </table>
    </div>

    ${canAddMore ? `
      <div style="margin-top:24px;text-align:center;color:var(--color-muted);font-size:13px;">
        Bạn có thể thêm tối đa ${maxProducts} sản phẩm. Nhấn nút "+" ở trên hoặc chọn "So sánh" trên thẻ sản phẩm.
      </div>
    ` : ""}
  `;
}

function renderCompareRows(products) {
  const rows = [];

  // Price row
  rows.push(renderRow("Giá bán", products, p => formatCurrency(getActivePrice(p)), "price"));

  // Original price if any on sale
  if (products.some(p => p.salePrice && p.salePrice < p.price)) {
    rows.push(renderRow("Giá gốc", products, p => p.salePrice && p.salePrice < p.price ? formatCurrency(p.price) : "—", "text"));
  }

  // Discount
  if (products.some(p => getDiscountPercent(p) > 0)) {
    rows.push(renderRow("Giảm giá", products, p => getDiscountPercent(p) > 0 ? `-${getDiscountPercent(p)}%` : "—", "text"));
  }

  // Unit
  rows.push(renderRow("Đơn vị", products, p => p.unit || "—", "text"));

  // Brand
  rows.push(renderRow("Thương hiệu", products, p => p.brand || "—", "text"));

  // Category
  rows.push(renderRow("Danh mục", products, p => getCategoryName(p.categoryId), "text"));

  // Rating
  rows.push(renderRow("Đánh giá", products, p => p.rating ? `★ ${p.rating.toFixed(1)} (${p.reviewCount || 0})` : "—", "text"));

  // Stock
  rows.push(renderRow("Tồn kho", products, p => p.stock ? `${formatNumber(p.stock)} ${p.unit || "sp"}` : "Hết hàng", "text"));

  // Nutrition
  if (products.some(p => p.nutrition)) {
    rows.push(renderRow("Năng lượng (kcal/100g)", products, p => p.nutrition?.calories || "—", "nutrition", "calories"));
    rows.push(renderRow("Protein (g/100g)", products, p => p.nutrition?.protein || "—", "nutrition", "protein"));
    rows.push(renderRow("Carbs (g/100g)", products, p => p.nutrition?.carbs || "—", "nutrition", "carbs"));
    rows.push(renderRow("Fat (g/100g)", products, p => p.nutrition?.fat || "—", "nutrition", "fat"));
  }

  // Tags
  if (products.some(p => p.tags?.length)) {
    rows.push(renderRow("Thẻ", products, p => (p.tags || []).map(t => `<span class="badge badge--tag">${escapeHTML(t)}</span>`).join(" "), "html"));
  }

  // Badges
  if (products.some(p => p.badges?.length)) {
    rows.push(renderRow("Huy hiệu", products, p => (p.badges || []).map(b => `<span class="badge badge--${b}">${escapeHTML(b)}</span>`).join(" "), "html"));
  }

  // Description (truncated)
  rows.push(renderRow("Mô tả", products, p => p.description ? escapeHTML(p.description).slice(0, 100) + (p.description.length > 100 ? "…" : "") : "—", "text"));

  return rows.join("");
}

function renderRow(label, products, getValue, type = "text", nutritionKey = null) {
  const values = products.map(p => getValue(p));
  const isNumeric = type === "price" || type === "nutrition";

  let winnerIdx = -1;
  if (isNumeric && type !== "price") {
    // For nutrition, higher is better for protein, lower for calories/carbs/fat
    const numericValues = products.map((p, i) => {
      const v = getValue(p);
      const num = parseFloat(String(v).replace(/[^\d.]/g, ""));
      return isNaN(num) ? null : { idx: i, val: num };
    }).filter(Boolean);

    if (numericValues.length >= 2) {
      if (nutritionKey === "protein") {
        winnerIdx = numericValues.reduce((a, b) => a.val > b.val ? a : b).idx;
      } else {
        winnerIdx = numericValues.reduce((a, b) => a.val < b.val ? a : b).idx;
      }
    }
  } else if (type === "price") {
    const numericValues = products.map((p, i) => {
      const v = getActivePrice(p);
      return { idx: i, val: v };
    });
    if (numericValues.length >= 2) {
      winnerIdx = numericValues.reduce((a, b) => a.val < b.val ? a : b).idx;
    }
  }

  const cells = products.map((p, i) => {
    const val = getValue(p);
    const isWinner = i === winnerIdx && winnerIdx >= 0;
    const isNA = val === "—" || val === "" || val === null || val === undefined;

    let cellContent = "";
    if (type === "html") {
      cellContent = val;
    } else if (type === "nutrition" && !isNA) {
      const num = parseFloat(String(val).replace(/[^\d.]/g, ""));
      const maxVal = Math.max(...products.map(p => parseFloat(String(getValue(p)).replace(/[^\d.]/g, ""))).filter(v => !isNaN(v)));
      const pct = maxVal > 0 ? Math.round((num / maxVal) * 100) : 0;
      cellContent = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <span>${val}</span>
          <div class="compare-nutrition-bar">
            <div class="compare-nutrition-bar__fill" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    } else {
      cellContent = escapeHTML(String(val));
    }

    const classes = ["compare-table__cell"];
    if (isWinner) classes.push("compare-winner");
    if (isNA) classes.push("compare-na");

    return `<td class="${classes.join(" ")}">${cellContent}</td>`;
  }).join("");

  return `
    <tr>
      <th class="compare-row-label">${label}</th>
      ${cells}
    </tr>
  `;
}

async function initComparePage() {
  const [productsRaw, categoriesRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.categories)
  ]);

  state.products = productsRaw.filter(p => p.isActive !== false);
  state.categories = categoriesRaw;
  state.compareIds = getCompareProducts();

  const root = document.getElementById("compare-root");
  if (!root) return;

  root.innerHTML = renderComparePage();
  attachCompareHandlers();
}

function attachCompareHandlers() {
  // Remove from compare
  document.querySelectorAll('[data-action="remove-compare"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      const productId = e.currentTarget.dataset.productId;
      removeFromCompare(productId);
      state.compareIds = getCompareProducts();
      showToast("Đã xóa khỏi so sánh");
      initComparePage();
    });
  });

  // Add to cart from compare
  document.querySelectorAll('[data-action="add-to-cart"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      const productId = e.currentTarget.dataset.productId;
      const cart = getActiveCart();
      cart.items = cart.items || [];
      const existing = cart.items.find(item => item.productId === productId);
      if (existing) existing.quantity += 1;
      else cart.items.push({ productId, quantity: 1 });
      cart.updatedAt = new Date().toISOString();
      setActiveCart(cart);
      showToast("Đã thêm vào giỏ hàng");
    });
  });

  // Clear all
  document.getElementById("compare-clear-btn")?.addEventListener("click", () => {
    clearCompare();
    state.compareIds = [];
    showToast("Đã xóa tất cả sản phẩm so sánh");
    initComparePage();
  });

  // Add more button
  document.getElementById("compare-add-more")?.addEventListener("click", () => {
    window.location.href = "./catalog.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "compare") {
    initComparePage();
  }
});

export { initComparePage };