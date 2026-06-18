import { fetchJSON, formatCurrency, getQueryParam, escapeHTML } from "./utils.js";
import { getActiveCart, setActiveCart, toggleWishlist, isWishlisted } from "./storage.js";
import { renderProductCard, showToast } from "./main.js";

const DATA_PATHS = {
  products: "./data/products.json",
  categories: "./data/categories.json"
};

function getDiscountPercent(product) {
  if (!product.salePrice || product.salePrice >= product.price) return 0;
  return Math.round(((product.price - product.salePrice) / product.price) * 100);
}

function getProductPrice(product) {
  return product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
}

function addToCart(productId, quantity = 1) {
  const cart = getActiveCart();
  cart.items = cart.items || [];
  const existing = cart.items.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }
  cart.updatedAt = new Date().toISOString();
  setActiveCart(cart);
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

function renderRelatedProducts(products, currentProduct) {
  const related = products
    .filter((item) => item.id !== currentProduct.id && item.categoryId === currentProduct.categoryId && item.isActive !== false)
    .slice(0, 4);

  if (!related.length) return "";

  return `
    <section class="related-section">
      <div class="section-header">
        <h2 class="section-header__title">Sản phẩm liên quan</h2>
      </div>
      <div class="product-grid product-grid--4">
        ${related.map((p) => renderProductCard(p)).join("")}
      </div>
    </section>
  `;
}

function renderProductDetail(product, products, categories) {
  const category = categories.find((item) => item.id === product.categoryId);
  const discount = getDiscountPercent(product);
  const wishlisted = isWishlisted(product.id);
  const displayPrice = getProductPrice(product);
  const savings = discount ? product.price - product.salePrice : 0;

  return `
    <nav class="breadcrumb">
      <a href="./index.html">Trang chủ</a>
      <span class="breadcrumb__sep">›</span>
      <a href="./catalog.html">Sản phẩm</a>
      <span class="breadcrumb__sep">›</span>
      ${category ? `<a href="./catalog.html?category=${category.id}">${escapeHTML(category.name)}</a><span class="breadcrumb__sep">›</span>` : ""}
      <span>${escapeHTML(product.name)}</span>
    </nav>

    <div class="product-detail">
      <div class="product-gallery">
        <div class="product-gallery__main">
          <img src="${product.imageUrl}" alt="${escapeHTML(product.name)}" />
        </div>
        <div class="product-gallery__benefits">
          <div class="gallery-benefit">
            <span class="gallery-benefit__icon">🚛</span>
            <span class="gallery-benefit__text">Giao nhanh 2h</span>
          </div>
          <div class="gallery-benefit">
            <span class="gallery-benefit__icon">✅</span>
            <span class="gallery-benefit__text">100% tươi sạch</span>
          </div>
          <div class="gallery-benefit">
            <span class="gallery-benefit__icon">🔄</span>
            <span class="gallery-benefit__text">Đổi trả dễ</span>
          </div>
        </div>
      </div>

      <div class="product-info">
        <div class="product-info__badges">
          ${product.badges?.map((b) => `<span class="badge badge--${b === "sale" ? "sale" : b === "hot" ? "accent" : "primary"}">${escapeHTML(b === "sale" ? "Giảm " + discount + "%" : b === "hot" ? "Bán chạy" : b)}</span>`).join(" ") || ""}
          <span class="badge badge--primary">${escapeHTML(category?.name || "Sản phẩm")}</span>
        </div>

        <h1 class="product-info__name">${escapeHTML(product.name)}</h1>

        <div class="product-info__rating">
          <span class="product-info__stars">${renderStars(product.rating || 0)}</span>
          <span>${Number(product.rating || 0).toFixed(1)}</span>
          <span style="color:var(--color-muted)">· ${product.reviewCount || 0} đánh giá</span>
        </div>

        <div class="product-info__price-box">
          <div class="price">
            <span class="price__current">${formatCurrency(displayPrice)}</span>
            ${product.salePrice ? `<span class="price__original">${formatCurrency(product.price)}</span>` : ""}
          </div>
          ${savings > 0 ? `<div class="product-info__savings">Tiết kiệm ${formatCurrency(savings)}</div>` : ""}
        </div>

        <p style="line-height:1.7;color:var(--color-muted);">${escapeHTML(product.description)}</p>

        <div class="product-info__meta">
          <div class="product-info__meta-row">
            <span class="product-info__meta-label">Thương hiệu</span>
            <strong>${escapeHTML(product.brand)}</strong>
          </div>
          <div class="product-info__meta-row">
            <span class="product-info__meta-label">Đơn vị</span>
            <strong>${escapeHTML(product.unit)}</strong>
          </div>
          <div class="product-info__meta-row">
            <span class="product-info__meta-label">Tình trạng</span>
            <strong class="${product.stock > 0 ? "product-info__stock--in" : "product-info__stock--out"}">${product.stock > 0 ? "Còn hàng (" + product.stock + ")" : "Hết hàng"}</strong>
          </div>
        </div>

        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <div class="quantity-control">
            <button class="quantity-control__btn" id="qty-minus" type="button">−</button>
            <input class="quantity-control__value" id="product-quantity" type="number" min="1" value="1" />
            <button class="quantity-control__btn" id="qty-plus" type="button">+</button>
          </div>
        </div>

        <div class="product-info__actions">
          <button class="btn btn--primary btn--lg" id="add-to-cart-btn" data-product-id="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>
            🛒 Thêm vào giỏ hàng
          </button>
          <button class="btn ${wishlisted ? "btn--accent" : "btn--outline"} btn--lg" id="wishlist-btn" data-product-id="${product.id}">
            ${wishlisted ? "❤️ Đã lưu" : "🤍 Yêu thích"}
          </button>
        </div>

        ${product.tags?.length ? `
        <div class="product-info__tags">
          ${product.tags.map((tag) => `<span class="product-tag">${escapeHTML(tag)}</span>`).join("")}
        </div>` : ""}
      </div>
    </div>

    <div class="product-tabs">
      <div class="product-tabs__nav">
        <button class="product-tabs__btn is-active" data-tab="desc">Mô tả</button>
        <button class="product-tabs__btn" data-tab="nutrition">Dinh dưỡng</button>
        <button class="product-tabs__btn" data-tab="reviews">Đánh giá</button>
      </div>
      <div class="product-tabs__panel is-active" data-panel="desc">
        <p>${escapeHTML(product.description)}</p>
        <p><strong>Thương hiệu:</strong> ${escapeHTML(product.brand)}<br>
        <strong>Đơn vị tính:</strong> ${escapeHTML(product.unit)}<br>
        <strong>Danh mục:</strong> ${escapeHTML(category?.name || "")}</p>
      </div>
      <div class="product-tabs__panel" data-panel="nutrition">
        <table class="nutrition-table">
          <thead><tr><th>Thành phần</th><th>Giá trị</th></tr></thead>
          <tbody>
            <tr><td>Calories</td><td>${product.nutrition?.calories || 0} kcal</td></tr>
            <tr><td>Protein</td><td>${product.nutrition?.protein || 0} g</td></tr>
            <tr><td>Carbohydrate</td><td>${product.nutrition?.carbs || 0} g</td></tr>
            <tr><td>Chất béo</td><td>${product.nutrition?.fat || 0} g</td></tr>
          </tbody>
        </table>
      </div>
      <div class="product-tabs__panel" data-panel="reviews">
        <p style="color:var(--color-muted);">★ ${Number(product.rating || 0).toFixed(1)} trung bình từ ${product.reviewCount || 0} đánh giá. Hệ thống đánh giá sẽ được cập nhật trong phiên bản tới.</p>
      </div>
    </div>

    ${renderRelatedProducts(products, product)}
  `;
}

async function initProductPage() {
  const slug = getQueryParam("slug");
  const [productsRaw, categoriesRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.categories)
  ]);

  const product = productsRaw.find((item) => item.slug === slug);
  const main = document.querySelector("main");
  if (!main) return;

  if (!product) {
    main.innerHTML = `
      <div class="container" style="padding:60px 0;text-align:center;">
        <h1>Không tìm thấy sản phẩm</h1>
        <p style="color:var(--color-muted);margin-bottom:24px;">Sản phẩm này không có trong dữ liệu hiện tại.</p>
        <a class="btn btn--primary" href="./catalog.html">Quay lại danh mục</a>
      </div>
    `;
    return;
  }

  document.title = product.name + " | Bách Hóa Tươi";

  const container = main.querySelector(".container") || main;
  container.innerHTML = renderProductDetail(product, productsRaw, categoriesRaw);

  const qtyInput = document.getElementById("product-quantity");
  document.getElementById("qty-minus")?.addEventListener("click", () => {
    const val = Math.max(1, Number(qtyInput.value) - 1);
    qtyInput.value = val;
  });
  document.getElementById("qty-plus")?.addEventListener("click", () => {
    qtyInput.value = Number(qtyInput.value) + 1;
  });

  document.getElementById("add-to-cart-btn")?.addEventListener("click", () => {
    const quantity = Math.max(1, Number(qtyInput?.value || 1));
    addToCart(product.id, quantity);
    showToast("Đã thêm " + product.name + " vào giỏ hàng");
    const badge = document.querySelector(".header-action-btn__badge");
    if (badge) {
      const cart = getActiveCart();
      const total = (cart.items || []).reduce((s, i) => s + i.quantity, 0);
      badge.textContent = total;
    }
  });

  document.getElementById("wishlist-btn")?.addEventListener("click", () => {
    toggleWishlist(product.id);
    const btn = document.getElementById("wishlist-btn");
    const now = isWishlisted(product.id);
    btn.innerHTML = now ? "❤️ Đã lưu" : "🤍 Yêu thích";
    btn.className = "btn " + (now ? "btn--accent" : "btn--outline") + " btn--lg";
    showToast(now ? "Đã thêm vào yêu thích" : "Đã xóa khỏi yêu thích");
  });

  main.querySelectorAll(".product-tabs__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      main.querySelectorAll(".product-tabs__btn").forEach((b) => b.classList.remove("is-active"));
      main.querySelectorAll(".product-tabs__panel").forEach((p) => p.classList.remove("is-active"));
      btn.classList.add("is-active");
      main.querySelector('[data-panel="' + btn.dataset.tab + '"]')?.classList.add("is-active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "product") {
    initProductPage();
  }
});

export { initProductPage };
