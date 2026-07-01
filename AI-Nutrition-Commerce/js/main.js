import { fetchJSON, formatCurrency, formatDate, escapeHTML, getQueryParam, formatNumber } from "./utils.js";
import { getActiveCart, toggleWishlist, isWishlisted } from "./storage.js";

const DATA_PATHS = {
  products: "./data/products.json",
  categories: "./data/categories.json",
  vouchers: "./data/vouchers.json"
};

const CATEGORY_IMAGES = {
  vegetables: "./assets/images/cat-vegetables.jpg",
  fruits: "./assets/images/cat-fruits.jpg",
  meat: "./assets/images/cat-meat.jpg",
  seafood: "./assets/images/cat-seafood.jpg",
  pantry: "./assets/images/cat-pantry.jpg",
  condiments: "./assets/images/cat-condiments.jpg",
  dairy: "./assets/images/cat-dairy.jpg",
  beverages: "./assets/images/cat-beverages.jpg"
};

const HERO_SLIDES = [
  {
    badge: "Tươi mỗi ngày — Giao tận nhà",
    title: "Thực phẩm tươi cho bữa cơm gia đình Việt",
    subtitle: "Rau củ sạch, trái cây chín mọng, thịt cá tươi ngon — chọn lọc từ nông trại đến bàn ăn. Giao nhanh trong 2h.",
    btnText: "Mua sắm ngay",
    btnLink: "./catalog.html",
    image: "./assets/images/hero-fresh.jpg"
  },
  {
    badge: "Flash Sale — Giảm đến 30%",
    title: "Ưu đãi đặc biệt cho đơn hàng đầu tiên",
    subtitle: "Nhập mã WELCOME10 nhận giảm giá ngay. Áp dụng cho tất cả sản phẩm — rau củ, thịt cá, trái cây và nhiều hơn nữa.",
    btnText: "Xem khuyến mãi",
    btnLink: "./catalog.html?sort=sale",
    image: "./assets/images/hero-sale.jpg"
  },
  {
    badge: "Meal Planner — Miễn phí",
    title: "Không biết hôm nay ăn gì? Để chúng tôi gợi ý!",
    subtitle: "Trả lời vài câu hỏi đơn giản — nhận thực đơn tuần miễn phí cùng danh sách mua sắm tự động. Tiết kiệm thời gian mỗi ngày.",
    btnText: "Khám phá Meal Planner",
    btnLink: "./meal-planner.html",
    image: "./assets/images/hero-mealplan.jpg"
  }
];

const FEATURES = [
  { title: "Giao nhanh 2h", desc: "Nội thành HCM" },
  { title: "Tươi mỗi ngày", desc: "Đảm bảo chất lượng" },
  { title: "Deal mỗi ngày", desc: "Voucher giảm giá" },
  { title: "Đổi trả 24h", desc: "Hoàn tiền dễ dàng" }
];

const BENEFITS = [
  { title: "Tươi sạch mỗi ngày", desc: "Hàng tươi được chọn lọc kỹ lưỡng, nhập về mỗi sáng để đảm bảo chất lượng tốt nhất.", image: "./assets/images/hero-fresh.jpg" },
  { title: "Giao hàng siêu tốc", desc: "Giao nhanh trong 2 giờ nội thành, đóng gói cẩn thận, giữ nguyên độ tươi.", image: "./assets/images/cat-vegetables.jpg" },
  { title: "Giá cả hợp lý", desc: "Cam kết giá tốt nhất thị trường, nhiều voucher và chương trình khuyến mãi.", image: "./assets/images/hero-sale.jpg" },
  { title: "Chất lượng tin cậy", desc: "Nguồn gốc rõ ràng, thông tin minh bạch, an toàn vệ sinh thực phẩm.", image: "./assets/images/hero-mealplan.jpg" }
];

const PROMO_BANNERS = [
  { theme: "green", title: "Rau củ hữu cơ", desc: "Giảm 15% cho rau củ organic", link: "./catalog.html?category=rau-cu" },
  { theme: "orange", title: "Combo tiết kiệm", desc: "Mua 3 giảm 20% thịt cá", link: "./catalog.html?category=thit" },
  { theme: "purple", title: "Đồ uống mùa hè", desc: "Mua 2 tặng 1 nước giải khát", link: "./catalog.html?category=do-uong" }
];

const TRUST_STATS = [
  { value: "1,000+", label: "Sản phẩm" },
  { value: "500+", label: "Cửa hàng" },
  { value: "2M+", label: "Khách hàng" },
  { value: "99%", label: "Hài lòng" }
];

const MEAL_STEPS = [
  "Chọn số người và ngân sách",
  "Xác định mục tiêu sức khỏe",
  "Nhận thực đơn tuần + shopping list"
];

function getCartCount() {
  const cart = getActiveCart();
  if (!cart || !cart.items) return 0;
  return cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function getDiscountPercent(product) {
  if (!product?.salePrice || product.salePrice >= product.price) return 0;
  return Math.round(((product.price - product.salePrice) / product.price) * 100);
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
  }, 2700);
}

// ==================== HEADER ====================
function createHeaderHTML(activePage) {
  const cartCount = getCartCount();
  const cartBadge = cartCount > 0
    ? `<span class="header-action-btn__badge">${cartCount > 99 ? "99+" : cartCount}</span>`
    : "";

  const categoryLinks = [
    { slug: "vegetables", img: "./assets/images/cat-vegetables.jpg", name: "Rau - Củ" },
    { slug: "fruits", img: "./assets/images/cat-fruits.jpg", name: "Trái Cây" },
    { slug: "meat", img: "./assets/images/cat-meat.jpg", name: "Thịt" },
    { slug: "seafood", img: "./assets/images/cat-seafood.jpg", name: "Hải Sản" },
    { slug: "pantry", img: "./assets/images/cat-pantry.jpg", name: "Gạo - Mì" },
    { slug: "condiments", img: "./assets/images/cat-condiments.jpg", name: "Gia Vị" },
    { slug: "dairy", img: "./assets/images/cat-dairy.jpg", name: "Sữa" },
    { slug: "beverages", img: "./assets/images/cat-beverages.jpg", name: "Đồ Uống" }
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
            <img src="${cat.img}" alt="" /> ${cat.name}
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
            <a href="#">Giới thiệu Bách Hóa Tươi</a>
            <a href="#">Cửa hàng của chúng tôi</a>
            <a href="#">Đội ngũ phát triển</a>
            <a href="#">Đồng hành cùng Bách Hóa Tươi</a>
          </div>
        </div>

        <div>
          <h3 class="footer-heading">Chăm sóc khách hàng</h3>
          <div class="footer-links">
            <a href="#">Blog ẩm thực</a>
            <a href="#">Hướng dẫn mua hàng</a>
            <a href="#">Chính sách giao hàng</a>
            <a href="#">Chính sách đổi trả hoàn tiền</a>
            <a href="#">Chính sách bảo mật thông tin</a>
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

  const productImage = (product.imageUrl && !product.imageUrl.includes('placeholder'))
    ? product.imageUrl
    : (CATEGORY_IMAGES[product.categoryId] || product.imageUrl || './assets/images/placeholder-product.svg');

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
          <button class="product-card__add-btn" data-action="add-to-cart" data-product-id="${product.id}" title="Thêm vào giỏ">+</button>
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
          <div class="hero__slide ${i === 0 ? "is-active" : ""}">
            <div class="hero__visual">
              <img class="hero__visual-img" src="${slide.image}" alt="" />
            </div>
            <div class="container hero__slide-inner">
              <div class="hero__content">
                <span class="hero__label">${slide.badge}</span>
                <h1 class="hero__title">${slide.title}</h1>
                <p class="hero__desc">${slide.subtitle}</p>
                <div class="hero__actions">
                  <a class="btn btn--accent btn--lg" href="${slide.btnLink}">${slide.btnText}</a>
                  <a class="btn btn--white btn--lg" href="./catalog.html">Xem sản phẩm</a>
                </div>
              </div>
            </div>
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
          ${FEATURES.map(f => `
            <div class="features-strip__item">
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
    <section class="voucher-section">
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
    <section class="category-section">
      <div class="container">
        <div class="section-header">
          <div class="section-header__text">
            <span class="eyebrow">Danh mục</span>
            <h2 class="section-header__title">Mua sắm theo nhóm hàng</h2>
          </div>
        </div>
        <div class="category-grid">
          ${categories.map(cat => {
            const count = products.filter(p => p.categoryId === cat.id).length;
            const img = CATEGORY_IMAGES[cat.id] || "./assets/images/placeholder-banner.svg";
            return `
              <a class="category-card" href="./catalog.html?category=${encodeURIComponent(cat.slug || cat.id)}">
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
    <section class="flash-sale-section">
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
          <a class="btn btn--sale btn--sm" href="./catalog.html">Xem tất cả →</a>
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
  return `
    <section class="promo-section">
      <div class="container">
        <div class="promo-grid">
          ${PROMO_BANNERS.map(p => `
            <a class="promo-banner promo-banner--${p.theme}" href="${p.link}">
              <span class="promo-banner__title">${p.title}</span>
              <span class="promo-banner__desc">${p.desc}</span>
              <span class="btn btn--white btn--sm btn--pill">Xem ngay →</span>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderTrustBanner() {
  return `
    <section class="trust-section">
      <div class="trust-section__inner">
        <div class="trust-section__bg">
          <img src="./assets/images/hero-fresh.jpg" alt="" />
        </div>
        <div class="trust-section__content">
          <h2 class="trust-section__title">Siêu thị trực tuyến hàng đầu cho gia đình Việt</h2>
          <p class="trust-section__desc">Hơn 1,000 sản phẩm tươi ngon, giao nhanh toàn quốc, chất lượng đảm bảo</p>
          <div class="trust-grid">
            ${TRUST_STATS.map(s => `
              <div class="trust-item">
                <div class="trust-item__number">${s.value}</div>
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
    <section class="benefits-section">
      <div class="container">
        <div class="section-header">
          <div class="section-header__text">
            <span class="eyebrow">Tại sao chọn chúng tôi</span>
            <h2 class="section-header__title">Cam kết với gia đình bạn</h2>
          </div>
        </div>
        <div class="benefits-grid">
          ${BENEFITS.map(b => `
            <div class="benefit-card">
              <div class="benefit-card__bg">
                <img src="${b.image}" alt="" />
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
    <section class="meal-cta-section">
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
            <div class="hero__actions">
              <a class="btn btn--accent btn--lg" href="./meal-planner.html">Khám phá Meal Planner</a>
              <a class="btn btn--white btn--lg" href="./catalog.html">Xem sản phẩm</a>
            </div>
          </div>
          <div class="meal-cta__visual">
            <img src="./assets/images/hero-mealplan.jpg" alt="Meal Planner" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderNewsletter() {
  return `
    <section class="newsletter-section">
      <div class="container">
        <div class="newsletter">
          <div class="newsletter__copy">
            <h2 class="newsletter__title">Nhận ưu đãi mới mỗi tuần</h2>
            <p class="newsletter__desc">Đăng ký email để nhận voucher, deal rau củ trái cây và mẹo mua sắm theo mùa.</p>
          </div>
          <form class="newsletter__form" id="newsletter-form">
            <input class="newsletter__input" type="email" name="email" placeholder="Nhập email của bạn để nhận ưu đãi" required />
            <button class="btn btn--primary btn--lg" type="submit">Đăng ký ngay</button>
          </form>
          <p class="newsletter__message" id="newsletter-message"></p>
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
  let interval;

  function goTo(index) {
    slides.forEach(s => s.classList.remove("is-active"));
    dots.forEach(d => d.classList.remove("is-active"));
    current = (index + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    dots[current].classList.add("is-active");
  }

  function startAuto() {
    interval = setInterval(() => goTo(current + 1), 5000);
  }

  function resetAuto() {
    clearInterval(interval);
    startAuto();
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

  startAuto();
}

function bindFlashCountdown() {
  const hEl = document.getElementById("countdown-h");
  const mEl = document.getElementById("countdown-m");
  const sEl = document.getElementById("countdown-s");
  if (!hEl) return;

  let totalSeconds = 5 * 3600 + 30 * 60;

  setInterval(() => {
    if (totalSeconds <= 0) totalSeconds = 5 * 3600 + 30 * 60;
    totalSeconds--;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    hEl.textContent = String(h).padStart(2, "0");
    mEl.textContent = String(m).padStart(2, "0");
    sEl.textContent = String(s).padStart(2, "0");
  }, 1000);
}

function bindNewsletter() {
  const form = document.getElementById("newsletter-form");
  const msg = document.getElementById("newsletter-message");
  if (!form || !msg) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = new FormData(form).get("email");
    if (!email) {
      msg.textContent = "Vui lòng nhập email.";
      msg.style.color = "var(--color-sale)";
      return;
    }
    msg.textContent = `Cảm ơn! Đã ghi nhận email ${email}.`;
    msg.style.color = "var(--color-primary)";
    form.reset();
  });
}

function bindMobileMenu() {
  const toggle = document.getElementById("mobile-menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const overlay = document.getElementById("mobile-menu-overlay");
  const close = document.getElementById("mobile-menu-close");
  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add("is-open");
    overlay?.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    menu.classList.remove("is-open");
    overlay?.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  toggle.addEventListener("click", openMenu);
  close?.addEventListener("click", closeMenu);
  overlay?.addEventListener("click", closeMenu);
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

function bindProductAccordions() {
  document.querySelectorAll("[data-accordion-trigger]").forEach(trigger => {
    trigger.addEventListener("click", () => {
      const accordion = trigger.closest(".product-accordion");
      if (!accordion) return;
      accordion.classList.toggle("is-open");
    });
  });
}

function renderCategorySidebar(categories, activeCategory = "") {
  const allImg = "./assets/images/placeholder-banner.svg";
  return `
    <aside class="category-sidebar" id="category-sidebar">
      <div class="category-sidebar__header">
        <span class="category-sidebar__header-img"><img src="${allImg}" alt="" loading="lazy" /></span>
        <span class="category-sidebar__header-text">Danh mục sản phẩm</span>
      </div>
      <div class="category-sidebar__list">
        <a class="category-sidebar__item ${!activeCategory ? 'is-active' : ''}" href="./catalog.html" data-cat-filter="">
          <span class="category-sidebar__item-img"><img src="${allImg}" alt="" loading="lazy" /></span>
          <span class="category-sidebar__item-text">
            <span class="category-sidebar__item-name">Tất cả sản phẩm</span>
          </span>
          <span class="category-sidebar__item-tooltip">Tất cả sản phẩm</span>
        </a>
        ${categories.map(cat => {
          const img = CATEGORY_IMAGES[cat.id] || "./assets/images/placeholder-banner.svg";
          const isActive = activeCategory === cat.id;
          const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
          const arrowIcon = hasSubcategories ? '<span class="category-sidebar__arrow">▶</span>' : '';
          return `
            <div class="category-sidebar__item-wrapper" data-category-id="${cat.id}">
              <a class="category-sidebar__item ${isActive ? 'is-active' : ''}" href="./catalog.html?category=${encodeURIComponent(cat.slug || cat.id)}" data-cat-filter="${cat.id}">
                <span class="category-sidebar__item-img"><img src="${img}" alt="" loading="lazy" /></span>
                <span class="category-sidebar__item-text">
                  <span class="category-sidebar__item-name">${escapeHTML(cat.name)}</span>
                  ${cat.productCount ? `<span class="category-sidebar__item-count">${cat.productCount} sp</span>` : ''}
                </span>
                ${arrowIcon}
              </a>
              <span class="category-sidebar__item-tooltip">${escapeHTML(cat.name)}</span>
              ${hasSubcategories ? `
                <div class="category-sidebar__flyout">
                  <div class="category-sidebar__flyout-header">
                    <span class="category-sidebar__flyout-header-img"><img src="${img}" alt="" loading="lazy" /></span>
                    <span class="category-sidebar__flyout-header-title">${escapeHTML(cat.name)}</span>
                  </div>
                  <div class="category-sidebar__flyout-content">
                    ${cat.subcategories.map(sub => `
                      <a class="category-sidebar__flyout-item" href="./catalog.html?category=${encodeURIComponent(sub.slug || sub.id)}" data-cat-filter="${sub.id}">
                        <span class="category-sidebar__flyout-item-img"><img src="${img}" alt="" loading="lazy" /></span>
                        <span class="category-sidebar__flyout-item-name">${escapeHTML(sub.name)}</span>
                        ${sub.productCount ? `<span class="category-sidebar__flyout-item-count">${sub.productCount}</span>` : ''}
                      </a>
                    `).join('')}
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
  `;
}

// ==================== INIT ====================
async function initHomePage() {
  const [productsRaw, categoriesRaw, vouchersRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.categories),
    fetchJSON(DATA_PATHS.vouchers)
  ]);

  const products = (productsRaw || []).filter(p => p.isActive !== false);
  const categories = (categoriesRaw || []).filter(c => c.isActive !== false).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const vouchers = (vouchersRaw || []).filter(v => v.isActive !== false);

  const main = document.querySelector(".home-page");
  if (!main) return;

  main.innerHTML = [
    renderHero(),
    renderFeaturesStrip(),
    renderVoucherSection(vouchers),
    renderCategorySection(categories, products),
    renderFlashSale(products),
    renderTrustBanner(),
    renderBenefits(),
    renderMealPlannerCTA(),
    renderNewsletter()
  ].join("");

  bindHeroCarousel();
  bindFlashCountdown();
  bindNewsletter();
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

    if (activePage === "home") {
      await initHomePage();
    }
  } catch (error) {
    console.error("Failed to mount layout:", error);
  }
}

import { getActiveCart as _gac, setActiveCart as _sac } from "./storage.js";
window.__storageExports = { getActiveCart: _gac, setActiveCart: _sac };

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
  renderCategorySidebar
};
