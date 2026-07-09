function bindSearchForm() {
  const form = document.getElementById("header-search-form");
  if (!form) return;

  const input = form.querySelector(".header-search__input");
  const dropdown = document.getElementById("header-search-dropdown");
  if (!input || !dropdown) return;

  let productsCache = null;

  async function loadProducts() {
    if (productsCache) return productsCache;
    try {
      const raw = await fetchJSON(DATA_PATHS.products);
      productsCache = (raw || []).filter(p => p.isActive !== false);
    } catch {
      productsCache = [];
    }
    return productsCache;
  }

  function normalize(str) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function searchProducts(query, products) {
    const q = normalize(query).trim();
    if (!q) return [];

    const results = products.filter(p => {
      const name = normalize(p.name || "");
      const brand = normalize(p.brand || "");
      return name.startsWith(q) || brand.startsWith(q);
    });

    results.sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));

    return results.slice(0, 5);
  }

  function renderDropdownResults(results) {
    if (results.length === 0) {
      dropdown.innerHTML = `<div class="header-search__dropdown-empty">Không tìm thấy sản phẩm phù hợp</div>`;
      dropdown.classList.add("is-open");
      return;
    }
    dropdown.innerHTML = results.map(p => {
      const displayPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
      const productImage = (p.imageUrl && !p.imageUrl.includes("placeholder"))
        ? p.imageUrl
        : (CATEGORY_IMAGES[p.categoryId] || p.imageUrl || "./assets/images/placeholder-product.svg");
      return `
        <a class="header-search__dropdown-item" href="./product-detail.html?slug=${encodeURIComponent(p.slug)}">
          <img class="header-search__dropdown-img" src="${productImage}" alt="${escapeHTML(p.name)}" loading="lazy" />
          <div class="header-search__dropdown-info">
            <span class="header-search__dropdown-name">${escapeHTML(p.name)}</span>
            <span class="header-search__dropdown-price">${formatCurrency(displayPrice)}</span>
          </div>
        </a>
      `;
    }).join("");
    dropdown.classList.add("is-open");
  }

  function closeDropdown() {
    dropdown.classList.remove("is-open");
  }

  const debouncedSearch = debounce(async (query) => {
    if (!query.trim()) {
      closeDropdown();
      return;
    }
    const products = await loadProducts();
    const results = searchProducts(query, products);
    renderDropdownResults(results);
  }, 300);

  input.addEventListener("input", () => {
    debouncedSearch(input.value);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim()) {
      debouncedSearch(input.value);
    }
  });

  document.addEventListener("click", (e) => {
    if (!form.contains(e.target)) {
      closeDropdown();
    }
  });

  input.addEventListener("keydown", (e)