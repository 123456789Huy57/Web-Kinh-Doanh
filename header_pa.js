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
          <a class="header-nav__link${activePage === "index" || activePage === "home" ? " is-active" : ""}" href="./index.html">${t("navHome")}</a>
          <a class="header-nav__link${activePage === "catalog" ? " is-active" : ""}" href="./catalog.html">${t("navCatalog")}</a>
          <a class="header-nav__link${activePage === "meal-planner" ? " is-active" : ""}" href="./meal-planner.html">${t("navMealPlanner")}</a>
        </nav>

        <form class="header-search" role="search" id="header-search-form">
          <svg class="header-search__icon" viewBox="0 0 24 24"><path d="M10 2a8 8 0 1 0 4.906 14.32l5.387 5.387a1 1 0 0 0 1.414-1.414l-5.387-5.387A8 8 0 0 0 10 2zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/></svg>
          <input class="header-search__input" type="search" name="q" placeholder="${t("searchPlaceholder")}" />
          <div class="header-search__dropdown" id="header-search-dropdown">
            <div class="header-search__dropdown-loading">${t("searchLoading")}</div>
          </div>
        </form>

        <div class="header-actions">
          <a class="header-action-btn" href="./wishlist.html" aria-label="${t("wishlist")}">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </a>
          <a class="header-action-btn" href="./vouchers.html" aria-label="${t("vouchers")}">
            <svg viewBox="0 0 24 24"><path d="M20 12a2 2 0 0 0-2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4a2 2 0 0 0-2 2 2 2 0 0 0 0 4 2 2 0 0 0 2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4a2 2 0 0 0 2-2 2 2 0 0 0 0-4zm-4 8H8v-3a3 3 0 0 1 0-6V8h8v3a3 3 0 0 1 0 6z"/></svg>
          </a>
          <a class="header-action-btn" href="./cart.html" aria-label="${t("cart")}">
            <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
            ${cartBadge}
          </a>

          <button class="header-action-btn header-lang-btn" type="button" aria-label="${t("languageLabel")}" id="lang-toggle">
            <span class="header-lang-flag" id="lang-toggle-label">${getLanguageButtonLabel()}</span>
          </button>

          <a class="header-action-btn" href="./account.html" aria-label="${t("account")}">
            <svg viewBox="0 0 24 24"><path