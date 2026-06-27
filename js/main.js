import { fetchJSON, formatCurrency, formatDate, escapeHTML, getQueryParam, formatNumber } from "./utils.js";
import { getActiveCart, toggleWishlist, isWishlisted, addToCompare } from "./storage.js";
import { CATEGORY_IMAGES, PRODUCT_IMAGES, HERO_SLIDES, FEATURES, BENEFITS, PROMO_BANNERS, TESTIMONIALS, TRUST_STATS, MEAL_STEPS } from "./constants.js";

const DATA_PATHS = {
  products: "./data/products.json",
  categories: "./data/categories.json",
  vouchers: "./data/vouchers.json"
};

function getCartCount() {
  const cart = getActiveCart();
  if (!cart || !cart.items) return 0;
  return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function getDiscountPercent(product) {
  if (!product?.salePrice || product.salePrice >= product.price) return 0;
  return Math.round(((product.price - product.salePrice) / product.price) * 100);
}

/** Track setInterval so we can clear it on page unload */
function trackInterval(id) {
  window.__pageIntervals = window.__pageIntervals || [];
  window.__pageIntervals.push(id);
}

function showToast(message, type = "success") {
  const icons = { success: "✅", error: "❌", warning: "⚠️" };
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__icon">${icons[type] || "✅"}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast--exiting");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==================== HEADER ====================
function createHeaderHTML(activePage) {
  const cartCount = getCartCount();
  const cartBadge = cartCount > 0
    ? `<span class="header-action-btn__badge">${cartCount > 99 ? "99+" : cartCount}</span>`
    : "";

  const categoryLinks = [
    { slug: "vegetables", img: "./assets/images/cat-vegetables.webp", name: "Rau - Củ" },
    { slug: "fruits", img: "./assets/images/cat-fruits.webp", name: "Trái Cây" },
    { slug: "meat", img: "./assets/images/cat-meat.webp", name: "Thịt" },
    { slug: "seafood", img: "./assets/images/cat-seafood.webp", name: "Hải Sản" },
    { slug: "pantry", img: "./assets/images/cat-pantry.webp", name: "Gạo - Mì" },
    { slug: "condiments", img: "./assets/images/cat-condiments.webp", name: "Gia Vị" },
    { slug: "dairy", img: "./assets/images/cat-dairy.webp", name: "Sữa" },
    { slug: "beverages", img: "./assets/images/cat-beverages.webp", name: "Đồ Uống" }
  ];

  return `
    <div class="header-main">
      <div class="container">
        <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Menu">
          <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
        </button>

        <a class="site-logo" href="./index.html">
          <img src="./assets/images/logo-icon.svg" alt="" />
          <span>Bách Hóa Tươi</span>
        </a>

        <nav class="header-nav">
          <a class="header-nav__link${activePage === "index" || activePage === "home" ? " is-active" : ""}" href="./index.html">Trang chủ</a>
          <a class="header-nav__link${activePage === "catalog" ? " is-active" : ""}" href="./catalog.html">Sản phẩm</a>
          <a class="header-nav__link${activePage === "meal-planner" ? " is-active" : ""}" href="./meal-planner.html">Meal Planner</a>
        </nav>

        <form class="header-search" role="search" id="header-search-form">
          <svg class="header-search__icon" viewBox="0 0 24 24"><path d="M10 2a8 8 0 1 0 4.906 14.32l5.387 5.387a1 1 0 0 0 1.414-1.414l-5.387-5.387A8 8 0 0 0 10 2zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/></svg>
          <input class="header-search__input" type="search" name="q" placeholder="Tìm rau củ, trái cây, thịt cá..." />
        </form>

        <div class="header-actions">
          <a class="header-action-btn" href="./cart.html" aria-label="Giỏ hàng">
            <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
            ${cartBadge}
          </a>

          <button class="header-action-btn header-lang-btn" type="button" aria-label="Ngôn ngữ" id="lang-toggle">
            <span class="header-lang-flag">🇻🇳</span>
          </button>

          <a class="header-action-btn" href="./account.html" aria-label="Tài khoản">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </a>
        </div>
      </div>
    </div>

    <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>
    <div class="mobile-menu" id="mobile-menu">
      <div class="mobile-menu__header">
        <span class="mobile-menu__logo">Bách Hóa Tươi</span>
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
        <a class="mobile-menu__item" href="./catalog.html">📦 Tất cả sản phẩm</a>
        ${categoryLinks.map(cat => `
          <a class="mobile-menu__item" href="./catalog.html?category=${cat.slug}">
            <img src="${cat.img}" alt="" loading="lazy" /> ${cat.name}
          </a>
        `).join("")}
        <div class="mobile-menu__divider"></div>
        <a class="mobile-menu__item" href="./meal-planner.html">🍽️ Meal Planner</a>
        <a class="mobile-menu__item" href="./cart.html">🛒 Giỏ hàng</a>
        <a class="mobile-menu__item" href="./wishlist.html">♡ Yêu thích</a>
        <a class="mobile-menu__item" href="./orders.html">📋 Đơn hàng</a>
        <a class="mobile-menu__item" href="./account.html">👤 Tài khoản</a>
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
          <h3 class="footer-heading">Về chúng tôi</h3>
          <div class="footer-links">
            <a href="./about.html">Giới thiệu Bách Hóa Tươi</a>
            <a href="./stores.html">Cửa hàng của chúng tôi</a>
            <a href="./team.html">Đội ngũ phát triển</a>
            <a href="./partner.html">Đồng hành cùng Bách Hóa Tươi</a>
          </div>
        </div>

        <div>
          <h3 class="footer-heading">Chăm sóc khách hàng</h3>
          <div class="footer-links">
            <a href="./blog.html">Blog ẩm thực</a>
            <a href="./guide.html">Hướng dẫn mua hàng</a>
            <a href="./shipping-policy.html">Chính sách giao hàng</a>
            <a href="./return-policy.html">Chính sách đổi trả hoàn tiền</a>
            <a href="./privacy-policy.html">Chính sách bảo mật thông tin</a>
          </div>
        </div>

        <div>
          <h3 class="footer-heading">Cộng đồng & Đối tác</h3>
          <div class="footer-social">
            <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
            <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></a>
            <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
          </div>
        </div>

        <div>
          <h3 class="footer-heading">Liên hệ</h3>
          <div class="footer-contact__list">
            <p>Cửa hàng Bách Hóa Tươi</p>
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
        <span class="footer-bottom__copy">© ${year} Bách Hóa Tươi — AI Nutrition Commerce</span>
        <span style="color:#6a7a6a;font-size:13px;">Đồ án Phát triển Web Kinh doanh</span>
      </div>
    </div>
  `;
}

// ==================== PRODUCT CARD ====================
function renderProductCard(product) {
  const discount = getDiscountPercent(product);
  const displayPrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;

  let badgesHTML = "";
  if (discount > 0) badgesHTML += `<span class="badge badge--sale">-${discount}%</span>`;
  if (product.isFeatured) badgesHTML += `<span class="badge badge--hot">HOT</span>`;

  const productImage = PRODUCT_IMAGES[product.id]
    || ((product.imageUrl && !product.imageUrl.includes('placeholder'))
      ? product.imageUrl
      : (CATEGORY_IMAGES[product.categoryId] || './assets/images/placeholder-product.svg'));

  return `
    <div class="product-card" data-product-id="${product.id}">
      <a href="./product-detail.html?slug=${encodeURIComponent(product.slug)}" class="product-card__image-wrap">
        ${badgesHTML ? `<div class="product-card__badges">${badgesHTML}</div>` : ""}
        <img src="${productImage}" alt="${escapeHTML(product.name)}" loading="lazy" />
      </a>
      <div class="product-card__body">
        <a href="./product-detail.html?slug=${encodeURIComponent(product.slug)}" class="product-card__name">
          ${escapeHTML(product.name)}
        </a>
        <span class="product-card__unit">${escapeHTML(product.brand || "")} · ${escapeHTML(product.unit)}</span>
        <div class="product-card__rating">
          <span class="product-card__rating-star">★</span>
          ${(product.rating || 0).toFixed(1)}
          <span class="text-muted">(${product.reviewCount || 0})</span>
        </div>
        <div class="product-card__footer">
          <div class="price">
            <span class="price__current ${discount > 0 ? 'price__current--sale' : ''}">${formatCurrency(displayPrice)}</span>
            ${product.salePrice && product.salePrice < product.price ? `<span class="price__original">${formatCurrency(product.price)}</span>` : ""}
          </div>
          <div class="product-card__actions">
            ${renderWishlistButton(product.id)}
            <button class="product-card__add-btn" data-action="add-to-cart" data-product-id="${product.id}" title="Thêm vào giỏ">+</button>
            <button class="product-card__compare-btn" data-action="add-to-compare" data-product-id="${product.id}" title="So sánh" aria-label="So sánh ${escapeHTML(product.name)}">⊕</button>
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
          <div class="hero__slide ${i === 0 ? "is-active" : ""}" role="group" aria-label="Slide ${i + 1}: ${slide.title}" aria-hidden="${i !== 0}">
            <div class="hero__visual">
              <img class="hero__visual-img" src="${slide.image}" alt="${slide.title}" ${i > 0 ? 'loading="lazy"' : 'fetchpriority="high"'} />
            </div>
            <div class="container hero__slide-inner">
              <div class="hero__content">
                <span class="hero__label">${slide.badge}</span>
                <h1 class="hero__title">${slide.title}</h1>
                <p class="hero__desc">${slide.subtitle}</p>
                <div class="hero__actions">
                  <a class="btn btn--accent btn--lg" href="${slide.btnLink}">${slide.btnText}</a>
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
            <div class="features-strip__item reveal reveal-delay-${i + 1}" data-bg="${f.image}" role="img" aria-label="${f.title}">
              <div class="features-strip__text">
                <span class="features-strip__label">${f.title}</span>
                <span class="features-strip__sub">${f.desc}</span>
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
            const discountLabel = v.discountType === "percent"
              ? `${v.discountValue}%`
              : formatCurrency(v.discountValue);

            return `
              <div class="voucher-card">
                <div class="voucher-card__discount">
                  <span class="voucher-card__amount">${discountLabel}</span>
                  <span class="voucher-card__min">${v.minOrder ? 'Đơn tối thiểu ' + formatCurrency(v.minOrder) : 'Không yêu cầu'}</span>
                </div>
                <div class="voucher-card__info">
                  <span class="voucher-card__code">${escapeHTML(v.code)}</span>
                  <span class="voucher-card__desc">${escapeHTML(v.description || v.title)}</span>
                  <span class="voucher-card__expiry">${v.expiresAt ? 'HSD: ' + formatDate(v.expiresAt) : ''}</span>
                </div>
                <div class="voucher-card__action" style="display:flex;align-items:center;padding:0 20px;">
                  <a class="btn btn--primary btn--sm voucher-card__btn" href="./catalog.html">Dùng ngay</a>
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
            const count = products.filter(p => p.categoryId === cat.id).length;
            const img = CATEGORY_IMAGES[cat.id] || "./assets/images/placeholder-banner.svg";
            const delayClass = ` reveal reveal-delay-${(i % 6) + 1}`;
            return `
              <a class="category-card${delayClass}" href="./catalog.html?category=${encodeURIComponent(cat.slug || cat.id)}">
                <div class="category-card__bg">
                  <img src="${img}" alt="" loading="lazy" />
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
  const saleProducts = products
    .filter(p => p.salePrice && p.salePrice < p.price)
    .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
    .slice(0, 10);

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
    purple: "https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  };
  return `
    <section class="promo-section reveal">
      <div class="container">
        <div class="promo-grid">
          ${PROMO_BANNERS.map(p => `
            <a class="promo-banner promo-banner--${p.theme}" href="${p.link}">
              <div class="promo-banner__bg">
                <img src="${promoImages[p.theme]}" alt="" loading="lazy" />
              </div>
              <div class="promo-banner__content">
                <span class="promo-banner__title">${p.title}</span>
                <span class="promo-banner__desc">${p.desc}</span>
                <span class="btn btn--white btn--sm">Xem ngay →</span>
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
          <h2 class="trust-section__title">Siêu thị trực tuyến hàng đầu cho gia đình Việt</h2>
          <p class="trust-section__desc">Hơn 1,000 sản phẩm tươi ngon, giao nhanh toàn quốc, chất lượng đảm bảo</p>
          <div class="trust-grid" role="list">
            ${TRUST_STATS.map(s => `
              <div class="trust-item" role="listitem">
                <div class="trust-item__number" data-count="${s.num}" data-suffix="${s.suffix}" aria-label="${s.label}">0</div>
                <div class="trust-item__label">${s.label}</div>
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
            <span class="eyebrow">Tại sao chọn chúng tôi</span>
            <h2 class="section-header__title">Cam kết với gia đình bạn</h2>
          </div>
        </div>
        <div class="benefits-grid">
          ${BENEFITS.map((b, i) => `
            <div class="benefit-card reveal reveal-delay-${i + 1}">
              <div class="benefit-card__bg">
                <img src="${b.image}" alt="" loading="lazy" />
              </div>
              <div class="benefit-card__content">
                <h3 class="benefit-card__title">${b.title}</h3>
                <p class="benefit-card__desc">${b.desc}</p>
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
            <span class="meal-cta__eyebrow">Tính năng đặc biệt</span>
            <h2 class="meal-cta__title">Không biết hôm nay ăn gì?</h2>
            <p class="meal-cta__desc">
              Tạo thực đơn hàng tuần và danh sách mua sắm tự động chỉ trong vài bước.
              Hoàn toàn miễn phí, chạy ngay trên trình duyệt.
            </p>
            <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px;">
              ${MEAL_STEPS.map((step, i) => `
                <div style="display:flex;align-items:center;gap:14px;">
                  <span style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.12);color:var(--color-accent);font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</span>
                  <span style="font-size:15px;color:rgba(255,255,255,0.8);">${step}</span>
                </div>
              `).join("")}
            </div>
            <a class="btn btn--accent btn--lg" href="./meal-planner.html" style="font-size:17px;padding:20px 44px;gap:14px;">
              <span>Khám phá Meal Planner</span>
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
            <span class="eyebrow">Khách hàng nói gì</span>
            <h2 class="section-header__title">Gửi gắm niềm tin từ những bữa cơm</h2>
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
                    <blockquote class="testimonials-slide__text">"${t.text}"</blockquote>
                    <div class="testimonials-slide__author">
                      <span class="testimonials-slide__name">${t.name}</span>
                      <span class="testimonials-slide__title">${t.title}</span>
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
            <span class="newsletter__eyebrow">Đăng ký nhận ưu đãi</span>
            <h2 class="newsletter__title" id="newsletter-title">Thông tin độc quyền, gửi thẳng hòm thư</h2>
            <p class="newsletter__desc">Voucher mỗi tuần, deal theo mùa, và mẹo chọn rau củ trái cây tươi ngon — không rác, chỉ giá trị.</p>
          </div>
          <form class="newsletter__form" id="newsletter-form">
            <label for="newsletter-email" class="visually-hidden">Email của bạn</label>
            <input class="newsletter__input" id="newsletter-email" type="email" name="email" placeholder="your@email.com" required autocomplete="email" />
            <button class="newsletter__btn" type="submit">
              <span>Đăng ký</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>
          <p class="newsletter__message" id="newsletter-message" aria-live="polite"></p>
          <p class="newsletter__trust">Không spam. Hủy đăng ký bất cứ lúc nào. <a href="./privacy-policy.html" target="_blank" rel="noopener">Chính sách bảo mật</a></p>
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
  const form = document.getElementById("header-search-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = new FormData(form).get("q")?.toString().trim();
    window.location.href = q ? `./catalog.html?q=${encodeURIComponent(q)}` : "./catalog.html";
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

    const { getActiveCart: gac, setActiveCart: sac } = window.__storageExports || {};
    if (!gac || !sac) return;

    const cart = gac();
    if (!cart.items) cart.items = [];
    const existing = cart.items.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.items.push({ productId, quantity: 1 });
    }
    cart.updatedAt = new Date().toISOString();
    sac(cart);

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

    const { addToCompare: atc, getCompareProducts: gcp } = window.__storageExports || {};
    if (!atc || !gcp) return;

    const before = gcp();
    const updated = atc(productId);

    if (updated.length > before.length) {
      btn.textContent = "✓";
      setTimeout(() => { btn.textContent = "⊕"; }, 1000);
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
      productsCache = (raw || []).filter(p => p.isActive !== false);
      return productsCache;
    } catch { return []; }
  }

  function renderSuggestions(query, products) {
    if (!query || query.length < 2) { dropdown.style.display = "none"; return; }
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matches = products.filter(p => {
      const name = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return name.includes(q);
    }).slice(0, 8);

    if (!matches.length) {
      dropdown.style.display = "none";
      return;
    }

    dropdown.innerHTML = matches.map(p => {
      const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
      const img = PRODUCT_IMAGES[p.id] || "";
      return `
        <a class="search-autocomplete__item" href="./catalog.html?q=${encodeURIComponent(p.name)}" style="display:flex;align-items:center;gap:12px;padding:10px 16px;text-decoration:none;color:var(--color-text);transition:background 0.15s;border-bottom:1px solid var(--color-border);">
          ${img ? `<img src="${img}" alt="" style="width:40px;height:40px;border-radius:var(--radius-sm);object-fit:cover;flex-shrink:0;" />` : ""}
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
    if (value.length < 2) { dropdown.style.display = "none"; return; }
    debounceTimer = setTimeout(async () => {
      const products = await fetchProducts();
      renderSuggestions(value, products);
    }, 250);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { dropdown.style.display = "none"; }, 200);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim().length >= 2) {
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
  const trending = products.filter(p => p.isFeatured || p.stock > 50).slice(0, 5);
  if (!trending.length) return "";

  return `
    <section class="trending-section reveal">
      <div class="container">
        <div class="section-header">
          <div class="section-header__text">
            <span class="eyebrow">Gợi ý hôm nay</span>
            <h2 class="section-header__title">Sản phẩm bán chạy</h2>
          </div>
          <a class="btn btn--outline btn--sm" href="./catalog.html">Xem tất cả</a>
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
  const isFav = isWishlisted(productId);
  return `
    <button class="product-card__wishlist ${isFav ? 'is-active' : ''}" data-action="toggle-wishlist" data-product-id="${productId}" aria-label="${isFav ? 'Bỏ yêu thích' : 'Yêu thích'}" title="${isFav ? 'Bỏ yêu thích' : 'Yêu thích'}">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="${isFav ? 'var(--color-sale)' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    </button>
  `;
}

function bindWishlistToggle() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='toggle-wishlist']");
    if (!btn) return;
    e.preventDefault();
    const productId = btn.dataset.productId;
    if (!productId) return;

    const { toggleWishlist: tw, isWishlisted: iw } = window.__storageExports || {};
    if (!tw || !iw) return;

    tw(productId);
    const nowFav = iw(productId);
    btn.classList.toggle("is-active", nowFav);
    btn.setAttribute("aria-label", nowFav ? "Bỏ yêu thích" : "Yêu thích");
    btn.querySelector("svg")?.setAttribute("fill", nowFav ? "var(--color-sale)" : "none");
    showToast(nowFav ? "Đã thêm vào yêu thích" : "Đã bỏ khỏi yêu thích");
  });
}

function renderCategorySidebar(categories, activeCategory = "") {
  return `
    <aside class="category-sidebar">
      <div class="category-sidebar__header">Danh mục sản phẩm</div>
      <div class="category-sidebar__list">
        <a class="category-sidebar__item ${!activeCategory ? 'is-active' : ''}" href="./catalog.html">
          <span class="category-sidebar__item-text">Tất cả sản phẩm</span>
        </a>
        ${categories.map(cat => {
          const img = CATEGORY_IMAGES[cat.id] || "./assets/images/placeholder-banner.svg";
          const isActive = activeCategory === cat.id;
          return `
            <a class="category-sidebar__item ${isActive ? 'is-active' : ''}" href="./catalog.html?category=${encodeURIComponent(cat.slug || cat.id)}" data-cat-filter="${cat.id}">
              <span class="category-sidebar__item-img"><img src="${img}" alt="" loading="lazy" /></span>
              <span class="category-sidebar__item-text">
                <span class="category-sidebar__item-name">${escapeHTML(cat.name)}</span>
              </span>
            </a>
          `;
        }).join("")}
      </div>
    </aside>
  `;
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

    const products = (productsRaw || []).filter(p => p.isActive !== false);
    const categories = (categoriesRaw || []).filter(c => c.isActive !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const vouchers = (vouchersRaw || []).filter(v => v.isActive !== false);

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
    const activePage = document.body.dataset.page || "home";
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");

    if (header) header.innerHTML = createHeaderHTML(activePage);
    if (footer) footer.innerHTML = createFooterHTML();

    bindSearchForm();
    bindMobileMenu();
    bindAddToCart();
    bindAddToCompare();
    bindBackToTop();

    if (activePage === "home") {
      await initHomePage();
    }
  } catch (error) {
    console.error("Failed to mount layout:", error);
  }
}

import { getActiveCart as _gac, setActiveCart as _sac, toggleWishlist as _tw, isWishlisted as _iw, addToCompare as _atc, getCompareProducts as _gcp } from "./storage.js";
window.__storageExports = { getActiveCart: _gac, setActiveCart: _sac, toggleWishlist: _tw, isWishlisted: _iw, addToCompare: _atc, getCompareProducts: _gcp };

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
  renderCategorySidebar
};
