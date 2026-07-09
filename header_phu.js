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
    <div class="top-bar" role="status" aria-live="polite">
      <div class="top-bar__inner">
        <span class="top-bar__item">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          Miễn phí vận chuyển đơn từ 299k
        </span>
        <span class="top-bar__sep"></span>
        <span class="top-bar__item">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.24c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
          Đổi trả trong 7 ngày
        </span>
        <span class="top-bar__sep"></span>
        <span class="top-bar__item">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          Hỗ trợ 24/7: 038 369 0006
        </span>
      </div>
    </div>

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

        <div class="header-location" id="header-location">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span>Quận 7, TP.HCM</span>
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 10l5 5 5-5z"/></svg>
        </div>

        <form class="header-search" role="search" id="header-search-form">
          <svg class="header-search__icon" viewBox="0 0 24 24"><path d="M10 2a8 8 0 1 0 4.906 14.32l5.387 5.387a1 1 0 0 0 1.414-1.414l-5.387-5.387A8 8 0 0 0 10 2zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/></svg>
          <input class="header-search__input" type="search" name="q" placeholder="Tìm rau củ, trái cây, thịt cá..." />
        </form>

        <div class="header-actions">
          <a class="header-action-btn" href="./cart.html" aria-label="Giỏ hàng">
            <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.6