import { fetchJSON, formatCurrency, formatDate, escapeHTML, getQueryParam, formatNumber } from "./utils.js";
import { getActiveCart, toggleWishlist, isWishlisted } from "./storage.js";

const DATA_PATHS = {
  products: "./data/products.json",
  categories: "./data/categories.json",
  vouchers: "./data/vouchers.json"
};

const CATEGORY_EMOJIS = {
  vegetables: "🥬",
  fruits: "🍎",
  meat: "🥩",
  seafood: "🦐",
  pantry: "🍚",
  condiments: "🧂",
  dairy: "🥛",
  beverages: "🥤"
};

const HERO_SLIDES = [
  {
    theme: "green",
    badge: "Fresh groceries delivered daily",
    title: "Thực phẩm tươi cho bữa cơm gia đình Việt",
    subtitle: "Rau củ, trái cây, thịt cá tươi ngon — giá hợp lý — giao nhanh trong ngày. Mua sắm dễ dàng cho gia đình bạn.",
    btnText: "Mua sắm ngay",
    btnLink: "./catalog.html",
    image: "./assets/images/placeholder-product.svg"
  },
  {
    theme: "orange",
    badge: "Flash Sale hôm nay",
    title: "Giảm đến 30% cho đơn hàng đầu tiên",
    subtitle: "Sử dụng mã WELCOME10 để nhận ưu đãi giảm giá ngay. Áp dụng cho tất cả sản phẩm trên website.",
    btnText: "Xem khuyến mãi",
    btnLink: "./catalog.html",
    image: "./assets/images/placeholder-product.svg"
  },
  {
    theme: "amber",
    badge: "Meal Planner",
    title: "Không biết hôm nay ăn gì? Để chúng tôi gợi ý!",
    subtitle: "Tạo thực đơn tuần và danh sách mua sắm chỉ trong vài bước đơn giản.",
    btnText: "Thử Meal Planner",
    btnLink: "./meal-planner.html",
    image: "./assets/images/placeholder-product.svg"
  }
];

const FEATURES = [
  { icon: "🚚", title: "Giao nhanh 2h", desc: "Nội thành HCM" },
  { icon: "🌿", title: "Tươi mỗi ngày", desc: "Đảm bảo chất lượng" },
  { icon: "🏷️", title: "Deal mỗi ngày", desc: "Voucher giảm giá" },
  { icon: "↩️", title: "Đổi trả 24h", desc: "Hoàn tiền dễ dàng" }
];

const BENEFITS = [
  { icon: "🌿", title: "Tươi sạch mỗi ngày", desc: "Hàng tươi được chọn lọc kỹ lưỡng, nhập về mỗi sáng để đảm bảo chất lượng tốt nhất." },
  { icon: "🚀", title: "Giao hàng siêu tốc", desc: "Giao nhanh trong 2 giờ nội thành, đóng gói cẩn thận, giữ nguyên độ tươi." },
  { icon: "💰", title: "Giá cả hợp lý", desc: "Cam kết giá tốt nhất thị trường, nhiều voucher và chương trình khuyến mãi." },
  { icon: "✅", title: "Chất lượng tin cậy", desc: "Nguồn gốc rõ ràng, thông tin minh bạch, an toàn vệ sinh thực phẩm." }
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
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ==================== HEADER ====================
function createHeaderHTML(activePage) {
  const cartCount = getCartCount();
  const cartBadge = cartCount > 0
    ? `<span class="header-action-btn__badge">${cartCount > 99 ? "99+" : cartCount}</span>`
    : "";

  const categoryLinks = [
    { slug: "vegetables", emoji: "🥬", name: "Rau - Củ" },
    { slug: "fruits", emoji: "🍎", name: "Trái Cây" },
    { slug: "meat", emoji: "🥩", name: "Thịt" },
    { slug: "seafood", emoji: "🦐", name: "Hải Sản" },
    { slug: "pantry", emoji: "🍚", name: "Gạo - Mì" },
    { slug: "condiments", emoji: "🧂", name: "Gia Vị" },
    { slug: "dairy", emoji: "🥛", name: "Sữa" },
    { slug: "beverages", emoji: "🥤", name: "Đồ Uống" }
  ];

  return `
    <div class="top-bar">
      <div class="container top-bar__inner">
        <div class="top-bar__left">
          <span class="top-bar__item">📞 Hotline: <strong>1800 6324</strong> (Miễn phí)</span>
          <span class="top-bar__item">📍 Giao hàng toàn quốc</span>
          <a class="top-bar__link" href="./orders.html">Tra cứu đơn hàng</a>
        </div>
        <div class="top-bar__right">
          <a class="top-bar__link" href="./index.html">Trang chủ</a>
          <a class="top-bar__link" href="./catalog.html">Sản phẩm</a>
          <a class="top-bar__link" href="./meal-planner.html">Meal Planner</a>
          <a class="top-bar__link" href="./account.html">Tài khoản</a>
        </div>
      </div>
    </div>

    <div class="header-main">
      <div class="container header-main__inner">
        <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Menu">☰</button>

        <a class="site-logo" href="./index.html">
          <span class="site-logo__icon">🍃</span>
          <span class="site-logo__text">
            <span class="site-logo__title">Bách Hóa Tươi</span>
            <span class="site-logo__subtitle">Thực phẩm sạch tận nhà</span>
          </span>
        </a>

        <button class="header-location" type="button">
          <span class="header-location__icon">📍</span>
          <span>
            <span class="header-location__label">Giao đến</span>
            <span class="header-location__value">TP. Hồ Chí Minh</span>
          </span>
        </button>

        <form class="header-search" role="search" id="header-search-form">
          <input class="header-search__input" type="search" name="q" placeholder="Tìm rau củ, trái cây, thịt cá..." />
          <button class="header-search__btn" type="submit">🔍 Tìm kiếm</button>
        </form>

        <div class="header-actions">
          <a class="header-action-btn" href="./wishlist.html" aria-label="Yêu thích">
            <span>♡</span>
            <span class="header-action-btn__label">Yêu thích</span>
          </a>
          <a class="header-action-btn" href="./cart.html" aria-label="Giỏ hàng">
            <span>🛒</span>
            ${cartBadge}
            <span class="header-action-btn__label">Giỏ hàng</span>
          </a>
          <a class="header-action-btn" href="./account.html" aria-label="Tài khoản">
            <span>👤</span>
            <span class="header-action-btn__label">Tài khoản</span>
          </a>
        </div>
      </div>
    </div>

    <nav class="category-nav">
      <div class="container category-nav__inner">
        ${categoryLinks.map(cat => `
          <a class="category-nav__link" href="./catalog.html?category=${cat.slug}">
            <span class="category-nav__emoji">${cat.emoji}</span>
            ${cat.name}
          </a>
        `).join("")}
        <a class="category-nav__link category-nav__link--all" href="./catalog.html">
          ☰ Tất cả
        </a>
      </div>
    </nav>

    <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>
    <div class="mobile-menu" id="mobile-menu">
      <div class="mobile-menu__header">
        <span style="font-weight:800;">🍃 Bách Hóa Tươi</span>
        <button class="mobile-menu__close" id="mobile-menu-close">✕</button>
      </div>
      <nav class="mobile-menu__nav">
        <a class="mobile-menu__link" href="./index.html">🏠 Trang chủ</a>
        <a class="mobile-menu__link" href="./catalog.html">📦 Tất cả sản phẩm</a>
        ${categoryLinks.map(cat => `
          <a class="mobile-menu__link" href="./catalog.html?category=${cat.slug}">${cat.emoji} ${cat.name}</a>
        `).join("")}
        <a class="mobile-menu__link" href="./meal-planner.html">🍽️ Meal Planner</a>
        <a class="mobile-menu__link" href="./cart.html">🛒 Giỏ hàng</a>
        <a class="mobile-menu__link" href="./wishlist.html">♡ Yêu thích</a>
        <a class="mobile-menu__link" href="./orders.html">📋 Đơn hàng</a>
        <a class="mobile-menu__link" href="./account.html">👤 Tài khoản</a>
      </nav>
    </div>
  `;
}

// ==================== FOOTER ====================
function createFooterHTML() {
  const year = new Date().getFullYear();
  return `
    <div class="footer-main">
      <div class="container footer-main__inner">
        <div class="footer-brand">
          <div class="footer-brand__logo">
            <span class="footer-brand__icon">🍃</span>
            <span class="footer-brand__name">Bách Hóa Tươi</span>
          </div>
          <p class="footer-brand__desc">
            Siêu thị trực tuyến thực phẩm Việt Nam. Rau củ, trái cây, thịt cá tươi ngon,
            giao nhanh tận nhà, giá cả hợp lý cho gia đình Việt.
          </p>
          <div class="footer-social">
            <a class="footer-social__link" href="#" aria-label="Facebook">f</a>
            <a class="footer-social__link" href="#" aria-label="YouTube">▶</a>
            <a class="footer-social__link" href="#" aria-label="Instagram">📷</a>
          </div>
        </div>

        <div class="footer-section">
          <h3 class="footer-section__title">Mua sắm</h3>
          <nav class="footer-links">
            <a class="footer-links__item" href="./catalog.html?category=vegetables">Rau - Củ</a>
            <a class="footer-links__item" href="./catalog.html?category=fruits">Trái Cây</a>
            <a class="footer-links__item" href="./catalog.html?category=meat">Thịt</a>
            <a class="footer-links__item" href="./catalog.html?category=seafood">Hải Sản</a>
            <a class="footer-links__item" href="./catalog.html?category=pantry">Gạo - Mì</a>
            <a class="footer-links__item" href="./catalog.html?category=condiments">Gia Vị</a>
          </nav>
        </div>

        <div class="footer-section">
          <h3 class="footer-section__title">Hỗ trợ</h3>
          <nav class="footer-links">
            <a class="footer-links__item" href="./orders.html">Tra cứu đơn hàng</a>
            <a class="footer-links__item" href="#">Chính sách đổi trả</a>
            <a class="footer-links__item" href="#">Chính sách bảo mật</a>
            <a class="footer-links__item" href="#">Điều khoản sử dụng</a>
            <a class="footer-links__item" href="#">Câu hỏi thường gặp</a>
          </nav>
        </div>

        <div class="footer-section">
          <h3 class="footer-section__title">Liên hệ</h3>
          <div class="footer-contact__item">
            <span class="footer-contact__icon">📞</span>
            <span>1800 6324 (7:00 - 22:00)</span>
          </div>
          <div class="footer-contact__item">
            <span class="footer-contact__icon">✉️</span>
            <span>support@bachhoatuoi.local</span>
          </div>
          <div class="footer-contact__item">
            <span class="footer-contact__icon">📍</span>
            <span>TP. Hồ Chí Minh, Việt Nam</span>
          </div>
          <div class="footer-payments">
            <span class="footer-payment-badge">Tiền mặt</span>
            <span class="footer-payment-badge">MoMo</span>
            <span class="footer-payment-badge">ZaloPay</span>
            <span class="footer-payment-badge">ATM</span>
            <span class="footer-payment-badge">Visa</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container footer-bottom__inner">
        <span>© ${year} Bách Hóa Tươi — AI Nutrition Commerce</span>
        <span>Đồ án Phát triển Web Kinh doanh</span>
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

  return `
    <div class="product-card" data-product-id="${product.id}">
      <a href="./product-detail.html?slug=${encodeURIComponent(product.slug)}" class="product-card__image-wrap">
        ${badgesHTML ? `<div class="product-card__badges">${badgesHTML}</div>` : ""}
        <img src="${product.imageUrl}" alt="${escapeHTML(product.name)}" loading="lazy" />
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
      <div class="hero__slides">
        ${HERO_SLIDES.map((slide, i) => `
          <div class="hero__slide hero__slide--${slide.theme} ${i === 0 ? "is-active" : ""}">
            <div class="container hero__content">
              <div class="hero__text">
                <span class="hero__badge">${slide.badge}</span>
                <h1 class="hero__title">${slide.title}</h1>
                <p class="hero__subtitle">${slide.subtitle}</p>
                <div class="hero__actions">
                  <a class="btn btn--white btn--lg btn--pill" href="${slide.btnLink}">${slide.btnText}</a>
                  <a class="btn btn--outline btn--lg btn--pill" href="./catalog.html" style="color:#fff;border-color:rgba(255,255,255,0.4);">Xem sản phẩm</a>
                </div>
              </div>
              <div class="hero__image">
                <img src="${slide.image}" alt="" />
              </div>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="hero__nav">
        ${HERO_SLIDES.map((_, i) => `<button class="hero__dot ${i === 0 ? "is-active" : ""}" data-slide="${i}"></button>`).join("")}
      </div>
      <button class="hero__arrow hero__arrow--prev" data-dir="prev">‹</button>
      <button class="hero__arrow hero__arrow--next" data-dir="next">›</button>
    </div>
  `;
}

function renderFeaturesStrip() {
  return `
    <div class="features-strip">
      <div class="container features-strip__grid">
        ${FEATURES.map(f => `
          <div class="feature-item">
            <span class="feature-item__icon">${f.icon}</span>
            <div class="feature-item__text">
              <span class="feature-item__title">${f.title}</span>
              <span class="feature-item__desc">${f.desc}</span>
            </div>
          </div>
        `).join("")}
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

  const colors = ["", "--orange", "--red", "", "--orange", "--red"];

  return `
    <section class="voucher-section">
      <div class="container">
        <div class="section-header">
          <div class="section-header__text">
            <span class="eyebrow">🏷️ Khuyến mãi</span>
            <h2 class="section-header__title">Voucher giảm giá hôm nay</h2>
          </div>
          <a class="btn btn--outline btn--sm" href="./catalog.html">Xem tất cả</a>
        </div>
        <div class="voucher-grid">
          ${sorted.slice(0, 6).map((v, i) => {
            const discountLabel = v.discountType === "percent"
              ? `${v.discountValue}%`
              : formatCurrency(v.discountValue);
            const typeLabel = v.discountType === "percent" ? "GIẢM" : "GIẢM";
            const colorClass = colors[i % colors.length];

            return `
              <div class="voucher-card">
                <div class="voucher-card__left${colorClass ? ' voucher-card__left' + colorClass : ''}">
                  <span class="voucher-card__discount">${discountLabel}</span>
                  <span class="voucher-card__type">${typeLabel}</span>
                </div>
                <div class="voucher-card__right">
                  <span class="voucher-card__title">${escapeHTML(v.title)}</span>
                  <span class="voucher-card__desc">${escapeHTML(v.description)}</span>
                  <div class="voucher-card__footer">
                    <span class="voucher-card__code">${escapeHTML(v.code)}</span>
                    <a class="voucher-card__use" href="./catalog.html">Dùng ngay →</a>
                  </div>
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
            <span class="eyebrow">📦 Danh mục</span>
            <h2 class="section-header__title">Mua sắm theo nhóm hàng</h2>
          </div>
        </div>
        <div class="category-grid">
          ${categories.map(cat => {
            const count = products.filter(p => p.categoryId === cat.id).length;
            const emoji = CATEGORY_EMOJIS[cat.id] || "📦";
            return `
              <a class="category-card-item category-card-item--${cat.id}" href="./catalog.html?category=${encodeURIComponent(cat.slug || cat.id)}">
                <div class="category-card-item__icon">${emoji}</div>
                <span class="category-card-item__name">${escapeHTML(cat.name)}</span>
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
            <h2 class="flash-sale-header__title">⚡ Flash Sale</h2>
            <div class="flash-sale-countdown" id="flash-countdown">
              <span class="flash-sale-countdown__block" id="countdown-h">05</span>
              <span class="flash-sale-countdown__sep">:</span>
              <span class="flash-sale-countdown__block" id="countdown-m">30</span>
              <span class="flash-sale-countdown__sep">:</span>
              <span class="flash-sale-countdown__block" id="countdown-s">00</span>
            </div>
          </div>
          <a class="btn btn--sale btn--sm btn--pill" href="./catalog.html">Xem tất cả →</a>
        </div>
        <div class="product-scroll">
          ${saleProducts.map(p => renderProductCard(p)).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderProductSection(title, icon, products, sectionClass = "") {
  return `
    <section class="products-section ${sectionClass}">
      <div class="container">
        <div class="section-header">
          <div class="section-header__text">
            <span class="section-header__icon">${icon}</span>
            <h2 class="section-header__title">${title}</h2>
          </div>
          <a class="btn btn--outline btn--sm" href="./catalog.html">Xem tất cả</a>
        </div>
        <div class="products-grid">
          ${products.map(p => renderProductCard(p)).join("")}
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
      <div class="container">
        <div class="trust-banner">
          <span style="font-size:36px;display:block;margin-bottom:8px;">🛒</span>
          <h2 class="trust-banner__title">Siêu thị trực tuyến hàng đầu cho gia đình Việt</h2>
          <p class="trust-banner__desc">Hơn 1,000 sản phẩm tươi ngon, giao nhanh toàn quốc, chất lượng đảm bảo</p>
          <div class="trust-stats">
            ${TRUST_STATS.map(s => `
              <div class="trust-stat">
                <span class="trust-stat__value">${s.value}</span>
                <span class="trust-stat__label">${s.label}</span>
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
            <span class="eyebrow">✅ Tại sao chọn chúng tôi</span>
            <h2 class="section-header__title">Cam kết với gia đình bạn</h2>
          </div>
        </div>
        <div class="benefits-grid">
          ${BENEFITS.map(b => `
            <div class="benefit-card">
              <div class="benefit-card__icon">${b.icon}</div>
              <h3 class="benefit-card__title">${b.title}</h3>
              <p class="benefit-card__desc">${b.desc}</p>
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
            <span class="eyebrow" style="color:rgba(255,255,255,0.8);">🍽️ Tính năng đặc biệt</span>
            <h2 class="meal-cta__title">Không biết hôm nay ăn gì?</h2>
            <p class="meal-cta__desc">
              Tạo thực đơn hàng tuần và danh sách mua sắm tự động chỉ trong vài bước.
              Hoàn toàn miễn phí, chạy ngay trên trình duyệt.
            </p>
            <div class="meal-cta__steps">
              ${MEAL_STEPS.map((step, i) => `
                <div class="meal-step">
                  <span class="meal-step__num">${i + 1}</span>
                  <span class="meal-step__text">${step}</span>
                </div>
              `).join("")}
            </div>
            <div class="meal-cta__actions">
              <a class="btn btn--accent btn--lg btn--pill" href="./meal-planner.html">Khám phá Meal Planner</a>
              <a class="btn btn--ghost btn--pill" href="./catalog.html" style="color:#fff;border-color:rgba(255,255,255,0.3);">Xem sản phẩm</a>
            </div>
          </div>
          <div class="meal-cta__visual">
            <div class="meal-preview-card">
              <span class="badge badge--primary meal-preview-card__badge">Tuần này gợi ý</span>
              <h3 class="meal-preview-card__title">Thực đơn cân bằng cho 4 người</h3>
              <p class="meal-preview-card__desc">3 bữa chính · 2 bữa phụ · shopping list tự động</p>
            </div>
            <div class="meal-preview-card">
              <span class="badge badge--accent meal-preview-card__badge">Ngân sách gợi ý</span>
              <h3 class="meal-preview-card__title">600.000đ - 800.000đ / tuần</h3>
              <p class="meal-preview-card__desc">Phù hợp gia đình nhỏ hoặc nhóm sinh viên.</p>
            </div>
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
            <span class="eyebrow">📧 Newsletter</span>
            <h2 class="newsletter__title">Nhận ưu đãi mới mỗi tuần</h2>
            <p class="newsletter__desc">Đăng ký email để nhận voucher, deal rau củ trái cây và mẹo mua sắm theo mùa.</p>
          </div>
          <form class="newsletter__form" id="newsletter-form">
            <input class="newsletter__input" type="email" name="email" placeholder="Nhập email của bạn" required />
            <button class="btn btn--primary btn--pill" type="submit">Đăng ký</button>
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

  const hotProducts = [...products]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
    .filter(p => p.isFeatured)
    .slice(0, 10);

  const newProducts = [...products].slice(0, 10);

  const vegetableProducts = products.filter(p => p.categoryId === "vegetables").slice(0, 5);
  const fruitProducts = products.filter(p => p.categoryId === "fruits").slice(0, 5);

  const healthyProducts = products
    .filter(p => (p.tags || []).some(t => ["healthy", "high-protein", "protein"].includes(t)))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  main.innerHTML = [
    renderHero(),
    renderFeaturesStrip(),
    renderVoucherSection(vouchers),
    renderCategorySection(categories, products),
    renderFlashSale(products),
    renderProductSection("🔥 Sản phẩm bán chạy", "", hotProducts, "products-section--alt"),
    renderPromoBanners(),
    renderProductSection("✨ Sản phẩm mới", "", newProducts, ""),
    renderProductSection("🥬 Rau củ tươi", "", vegetableProducts, "products-section--alt"),
    renderProductSection("🍎 Trái cây ngon", "", fruitProducts, ""),
    renderTrustBanner(),
    renderProductSection("💪 Healthy Picks", "", healthyProducts, "products-section--alt"),
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
  initHomePage
};
