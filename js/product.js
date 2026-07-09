import { fetchJSON, formatCurrency, getQueryParam, escapeHTML, renderBreadcrumb, createBreadcrumbItems } from "./utils.js";
import { getActiveCart, setActiveCart, toggleWishlist, isWishlisted, getCurrentUser, mergeAdminProducts } from "./storage.js";
import {
  renderProductCard,
  showToast,
  PRODUCT_IMAGES,
  getProductCategory,
  getProductCategoryLabel,
  getProductSalePrice,
  getProductReviewCount,
  getProductImage,
  isProductActive
} from "./main.js";
import { ICONS } from "./icons.js";

const DATA_PATHS = {
  products: "./data/products.json",
  categories: "./data/categories.json"
};

function getDiscountPercent(product) {
  const salePrice = getProductSalePrice(product);
  if (!salePrice || salePrice >= product.price) return 0;
  return Math.round(((product.price - salePrice) / product.price) * 100);
}

function getProductPrice(product) {
  const salePrice = getProductSalePrice(product);
  return salePrice && salePrice < product.price ? salePrice : product.price;
}

function addToCart(productId, quantity = 1) {
  const cart = getActiveCart();
  cart.items = cart.items || [];
  const existing = cart.items.find((item) => item.productId === productId);
  if (existing) existing.quantity += quantity;
  else cart.items.push({ productId, quantity });
  cart.updatedAt = new Date().toISOString();
  setActiveCart(cart);
}

function updateAddToCartButton(state = "idle") {
  const button = document.getElementById("add-to-cart-btn");
  if (!button) return;

  if (state === "adding") {
    button.disabled = true;
    button.innerHTML = `<span class="btn-icon">${ICONS.shoppingCart}</span> Đang thêm...`;
    button.classList.add("btn--loading");
    return;
  }

  if (state === "added") {
    button.disabled = true;
    button.innerHTML = `<span class="btn-icon">${ICONS.checkCircle}</span> Đã thêm vào giỏ`;
    button.classList.remove("btn--loading");
    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = `<span class="btn-icon">${ICONS.shoppingCart}</span> Thêm vào giỏ hàng`;
    }, 1200);
    return;
  }

  button.disabled = false;
  button.innerHTML = `<span class="btn-icon">${ICONS.shoppingCart}</span> Thêm vào giỏ hàng`;
  button.classList.remove("btn--loading");
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  let html = "";
  for (let i = 0; i < full; i += 1) html += `<span class="star-icon star-icon--filled">${ICONS.starFilled}</span>`;
  if (half) html += `<span class="star-icon star-icon--filled">${ICONS.starFilled}</span>`;
  for (let i = 0; i < empty; i += 1) html += `<span class="star-icon">${ICONS.star}</span>`;
  return html;
}

function getProductGalleryImages(product) {
  const mainImage = PRODUCT_IMAGES[product.id] || getProductImage(product);
  const gallery = Array.isArray(product.gallery) ? product.gallery : [];
  const images = [mainImage, ...gallery]
    .map((src) => String(src || "").trim())
    .filter(Boolean);

  return [...new Set(images)].slice(0, 4);
}

function renderProductGallery(product) {
  const images = getProductGalleryImages(product);
  const mainImage = images[0] || getProductImage(product);

  return `
    <div class="product-gallery__main" data-gallery-main>
      <img src="${escapeHTML(mainImage)}" alt="${escapeHTML(product.name)}" data-gallery-main-img />
    </div>
    <div class="product-gallery__thumbs" aria-label="Ảnh sản phẩm">
      ${images.map((src, index) => `
        <button class="product-gallery__thumb ${index === 0 ? "is-active" : ""}" type="button" data-gallery-thumb data-gallery-src="${escapeHTML(src)}" aria-label="Xem ảnh ${index + 1}">
          <img src="${escapeHTML(src)}" alt="${escapeHTML(product.name)} - ảnh ${index + 1}" />
        </button>
      `).join("")}
    </div>
  `;
}

function renderRelatedProducts(products, currentProduct) {
  const related = products
    .filter((item) => item.id !== currentProduct.id && getProductCategory(item) === getProductCategory(currentProduct) && isProductActive(item))
    .slice(0, 4);

  if (!related.length) return "";

  return `
    <section class="related-section">
      <div class="section-header">
        <h2 class="section-header__title">Sản phẩm liên quan</h2>
      </div>
      <div class="product-grid product-grid--4">
        ${related.map((product) => renderProductCard(product)).join("")}
      </div>
    </section>
  `;
}

function renderBadges(product, categoryName, discount) {
  const badges = product.badges || [];
  const badgeLabels = {
    sale: `Giảm ${discount}%`,
    hot: "Bán chạy",
    fresh: "Tươi mới",
    popular: "Phổ biến"
  };
  return `
    <div class="product-info__badges">
      ${badges.map((badge) => `<span class="badge badge--${badge === "sale" ? "sale" : badge === "hot" ? "accent" : "primary"}">${escapeHTML(badgeLabels[badge] || badge)}</span>`).join(" ")}
      <span class="badge badge--primary">${escapeHTML(categoryName || "Sản phẩm")}</span>
    </div>
  `;
}

function renderProductDetail(product, products, categories) {
  const categoryLabel = getProductCategoryLabel(product);
  const category = categories.find((item) => item.id === getProductCategory(product) || item.slug === getProductCategory(product));
  const categoryName = category?.name || categoryLabel;
  const discount = getDiscountPercent(product);
  const wishlisted = isWishlisted(product.id);
  const displayPrice = getProductPrice(product);
  const salePrice = getProductSalePrice(product);
  const savings = discount ? product.price - salePrice : 0;
  const stockLabel = product.stock > 0 ? `Còn hàng (${product.stock})` : "Hết hàng";

  return `
    ${renderBreadcrumb(createBreadcrumbItems({
      pageType: "product",
      data: {
        productName: product.name,
        categoryName,
        categoryId: category?.id || getProductCategory(product)
      }
    }))}

    <div class="product-detail">
      <div class="product-gallery">
        ${renderProductGallery(product)}
        <div class="product-gallery__benefits">
          <div class="gallery-benefit">
            <span class="gallery-benefit__icon">${ICONS.truck}</span>
            <span class="gallery-benefit__text">Giao nhanh 2h</span>
          </div>
          <div class="gallery-benefit">
            <span class="gallery-benefit__icon">${ICONS.checkCircle}</span>
            <span class="gallery-benefit__text">Tươi mỗi ngày</span>
          </div>
          <div class="gallery-benefit">
            <span class="gallery-benefit__icon">${ICONS.refreshCw}</span>
            <span class="gallery-benefit__text">Đổi trả dễ</span>
          </div>
        </div>
      </div>

      <div class="product-info">
        ${renderBadges(product, categoryName, discount)}
        <h1 class="product-info__name">${escapeHTML(product.name)}</h1>

        <div class="product-info__rating">
          <span class="product-info__stars">${renderStars(product.rating || 0)}</span>
          <span>${Number(product.rating || 0).toFixed(1)}</span>
          <span style="color:var(--color-muted)">· ${getProductReviewCount(product)} đánh giá</span>
        </div>

        <div class="product-info__price-box">
          <div class="price">
            <span class="price__current">${formatCurrency(displayPrice)}</span>
            ${salePrice && salePrice < product.price ? `<span class="price__original">${formatCurrency(product.price)}</span>` : ""}
          </div>
          ${savings > 0 ? `<div class="product-info__savings">Tiết kiệm ${formatCurrency(savings)}</div>` : ""}
        </div>

        <p style="line-height:1.75;color:#5f5a52;">${escapeHTML(product.description || "Sản phẩm được chọn lọc cho bữa ăn gia đình và giao nhanh trong ngày.")}</p>

        <div class="product-shipping-offer">
          <strong>Miễn phí giao hàng cho đơn từ 300.000 đ</strong>
          <span>Thêm sản phẩm vào giỏ để đạt ưu đãi giao nhanh nội thành.</span>
        </div>

        <div class="product-info__meta">
          <div class="product-info__meta-row">
            <span class="product-info__meta-label">Thương hiệu</span>
            <strong>${escapeHTML(product.brand || "Bách Hóa Tươi")}</strong>
          </div>
          <div class="product-info__meta-row">
            <span class="product-info__meta-label">Đơn vị</span>
            <strong>${escapeHTML(product.unit || "gói")}</strong>
          </div>
          <div class="product-info__meta-row">
            <span class="product-info__meta-label">Tình trạng</span>
            <strong class="${product.stock > 0 ? "product-info__stock--in" : "product-info__stock--out"}">${stockLabel}</strong>
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
            <span class="btn-icon">${ICONS.shoppingCart}</span> Thêm vào giỏ hàng
          </button>
          <button class="btn ${wishlisted ? "btn--accent" : "btn--outline"} btn--lg" id="wishlist-btn" data-product-id="${product.id}">
            <span class="btn-icon">${wishlisted ? ICONS.heartFilled : ICONS.heart}</span> ${wishlisted ? "Đã lưu" : "Yêu thích"}
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
        <p>${escapeHTML(product.detailDescription || product.description || "Sản phẩm phù hợp cho bữa ăn tươi ngon mỗi ngày.")}</p>
        <ul class="product-detail__summary">
          <li><strong>Thương hiệu:</strong> ${escapeHTML(product.brand || "Bách Hóa Tươi")}</li>
          <li><strong>Đơn vị tính:</strong> ${escapeHTML(product.unit || "gói")}</li>
          <li><strong>Danh mục:</strong> ${escapeHTML(categoryName || "")}</li>
          ${product.stock !== undefined ? `<li><strong>Tình trạng:</strong> ${stockLabel}</li>` : ""}
        </ul>
      </div>
      <div class="product-tabs__panel" data-panel="nutrition">
        <table class="nutrition-table">
          <thead><tr><th>Thành phần</th><th>Giá trị</th></tr></thead>
          <tbody>
            <tr><td>Calories</td><td>${product.nutrition?.calories || product.nutrition?.energy_kcal || 0} kcal</td></tr>
            <tr><td>Protein</td><td>${product.nutrition?.protein || 0} g</td></tr>
            <tr><td>Carbohydrate</td><td>${product.nutrition?.carbs || product.nutrition?.carbohydrates || 0} g</td></tr>
            <tr><td>Chất béo</td><td>${product.nutrition?.fat || 0} g</td></tr>
          </tbody>
        </table>
      </div>
      <div class="product-tabs__panel" data-panel="reviews">
        <p style="color:var(--color-muted);"><span class="star-icon star-icon--filled">${ICONS.starFilled}</span> ${Number(product.rating || 0).toFixed(1)} trung bình từ ${getProductReviewCount(product)} đánh giá. Hệ thống đánh giá chi tiết sẽ được cập nhật trong phiên bản tới.</p>
      </div>
    </div>

    ${renderRelatedProducts(products, product)}
    ${renderDishSection(product)}
  `;
}

function renderDishSection(product) {
  if (!product.dish) return "";
  return `
    <section class="dish-section">
      <div class="section-header">
        <h2 class="section-header__title">Gợi ý món ăn</h2>
      </div>
      <div class="dish-card">
        <div class="dish-card__label">Gợi ý</div>
        <h3 class="dish-card__name">${escapeHTML(product.dish)}</h3>
        <p class="dish-card__text">${escapeHTML(product.detailDescription || product.description || "Sản phẩm phù hợp cho món ăn tươi ngon.")}</p>
      </div>
    </section>
  `;
}

function bindProductGallery(root) {
  const mainImage = root.querySelector("[data-gallery-main-img]");
  if (!mainImage) return;

  mainImage.addEventListener("error", () => {
    mainImage.onerror = null;
    mainImage.src = "./assets/images/placeholder-product.svg";
  });

  root.querySelectorAll("[data-gallery-thumb]").forEach((button) => {
    const thumbImage = button.querySelector("img");
    thumbImage?.addEventListener("error", () => {
      thumbImage.onerror = null;
      thumbImage.src = "./assets/images/placeholder-product.svg";
    });

    button.addEventListener("click", () => {
      const src = button.dataset.gallerySrc;
      if (!src) return;
      root.querySelectorAll("[data-gallery-thumb]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      mainImage.src = src;
    });
  });
}

async function initProductPage() {
  const slug = getQueryParam("slug");
  const [productsRaw, categoriesRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.categories)
  ]);

  const activeProducts = mergeAdminProducts(productsRaw || []).filter(isProductActive);
  const product = activeProducts.find((item) => item.slug === slug);
  const root = document.getElementById("product-root");
  if (!root) return;

  if (!product) {
    root.innerHTML = `
      <div class="container" style="padding:60px 0;text-align:center;">
        <h1>Không tìm thấy sản phẩm</h1>
        <p style="color:var(--color-muted);margin-bottom:24px;">Sản phẩm này không có trong dữ liệu hiện tại.</p>
        <a class="btn btn--primary" href="./catalog.html">Quay lại danh mục</a>
      </div>
    `;
    return;
  }

  document.title = `${product.name} | Bách Hóa Tươi`;
  root.innerHTML = renderProductDetail(product, activeProducts, categoriesRaw || []);
  bindProductGallery(root);

  const qtyInput = document.getElementById("product-quantity");
  document.getElementById("qty-minus")?.addEventListener("click", () => {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.getElementById("qty-plus")?.addEventListener("click", () => {
    qtyInput.value = Number(qtyInput.value) + 1;
  });

  document.getElementById("add-to-cart-btn")?.addEventListener("click", () => {
    const quantity = Math.max(1, Number(qtyInput?.value || 1));
    updateAddToCartButton("adding");
    addToCart(product.id, quantity);
    updateAddToCartButton("added");
    showToast(`Đã thêm ${product.name} vào giỏ hàng`);
    const badge = document.querySelector(".header-action-btn__badge");
    if (badge) {
      const cart = getActiveCart();
      badge.textContent = (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);
    }
  });

  document.getElementById("wishlist-btn")?.addEventListener("click", () => {
    if (!getCurrentUser()?.id) {
      showToast("Vui lòng đăng nhập để lưu sản phẩm yêu thích", "warning");
      setTimeout(() => {
        window.location.href = "./login.html?redirect=wishlist";
      }, 700);
      return;
    }

    toggleWishlist(product.id);
    const btn = document.getElementById("wishlist-btn");
    const now = isWishlisted(product.id);
    btn.innerHTML = `<span class="btn-icon">${now ? ICONS.heartFilled : ICONS.heart}</span>${now ? "Đã lưu" : "Yêu thích"}`;
    btn.className = `btn ${now ? "btn--accent" : "btn--outline"} btn--lg`;
    showToast(now ? "Đã thêm vào yêu thích" : "Đã xóa khỏi yêu thích");
  });

  root.querySelectorAll(".product-tabs__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".product-tabs__btn").forEach((item) => item.classList.remove("is-active"));
      root.querySelectorAll(".product-tabs__panel").forEach((panel) => panel.classList.remove("is-active"));
      btn.classList.add("is-active");
      root.querySelector(`[data-panel="${btn.dataset.tab}"]`)?.classList.add("is-active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "product") {
    initProductPage();
  }
});

export { initProductPage };
