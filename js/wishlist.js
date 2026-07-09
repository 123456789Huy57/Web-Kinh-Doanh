import { fetchJSON, formatCurrency, escapeHTML } from "./utils.js";
import { getWishlist, setWishlist, toggleWishlist, getActiveCart, setActiveCart, getCurrentUser, mergeAdminProducts } from "./storage.js";
import { showToast, renderProductCard } from "./main.js";

let wishlistState = {
  products: [],
  wishlist: [],
  matchingProducts: []
};

async function initWishlistPage() {
  const root = document.getElementById("wishlist-root");
  if (!root) return;

  try {
    const productsPromise = fetchJSON("./data/products.json");
    wishlistState.wishlist = getWishlist() || [];

    const products = mergeAdminProducts(await productsPromise).filter((product) => product.isActive !== false && product.active !== false);
    wishlistState.products = products;

    wishlistState.matchingProducts = products.filter((p) =>
      wishlistState.wishlist.some((item) => item.productId === p.id)
    );

    root.innerHTML = renderWishlistPage();
    bindWishlistEvents();
  } catch (error) {
    console.error("Failed to load wishlist:", error);
    root.innerHTML = `
      <div class="wishlist-empty">
        <div class="wishlist-empty__icon">⚠️</div>
        <h2 class="wishlist-empty__title">Không thể tải dữ liệu</h2>
        <p class="wishlist-empty__desc">Vui lòng thử lại sau.</p>
        <a class="btn btn--primary btn--lg" href="./catalog.html">Tiếp tục mua sắm</a>
      </div>
    `;
  }
}

function renderWishlistPage() {
  const { matchingProducts } = wishlistState;

  if (!matchingProducts.length) {
    return renderWishlistEmpty();
  }

  return `
    <div class="wishlist-header">
      <h1 class="wishlist-header__title">
        Sản phẩm yêu thích
        <span style="font-size:16px;font-weight:400;color:var(--color-muted);font-family:var(--font-base);">
          (${matchingProducts.length} sản phẩm)
        </span>
      </h1>
    </div>
    <div class="wishlist-grid">
      ${matchingProducts.map((product) => {
        const cardHtml = renderProductCard(product);
        return `
          <div class="wishlist-item" data-product-id="${product.id}">
            ${cardHtml}
            <button class="wishlist-item__remove" data-action="remove-wishlist" data-product-id="${product.id}" title="Xoá khỏi yêu thích">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>
        `;
      }).join("")}
    </div>
    <div class="wishlist-actions">
      <button class="btn btn--primary btn--lg" id="add-all-to-cart">Thêm tất cả vào giỏ</button>
    </div>
  `;
}

function renderWishlistEmpty() {
  return `
    <div class="wishlist-empty">
      <div class="wishlist-empty__icon">♡</div>
      <h2 class="wishlist-empty__title">Chưa có sản phẩm yêu thích</h2>
      <p class="wishlist-empty__desc">Hãy thêm sản phẩm vào danh sách yêu thích để dễ dàng tìm lại sau!</p>
      <a class="btn btn--primary btn--lg" href="./catalog.html">Khám phá sản phẩm</a>
    </div>
  `;
}

function bindWishlistEvents() {
  // Remove from wishlist
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='remove-wishlist']");
    if (!btn) return;
    e.preventDefault();

    const productId = btn.dataset.productId;
    if (!productId) return;

    toggleWishlist(productId);
    wishlistState.wishlist = getWishlist();
    wishlistState.matchingProducts = wishlistState.products.filter((p) =>
      wishlistState.wishlist.some((item) => item.productId === p.id)
    );

    const root = document.getElementById("wishlist-root");
    if (root) {
      root.innerHTML = renderWishlistPage();
      bindWishlistEvents();
    }

    // Update wishlist badge count if it exists
    const wishlistCount = wishlistState.wishlist.length;
    const badge = document.querySelector(".header-action-btn__badge--wishlist");
    if (badge) {
      badge.textContent = wishlistCount;
    }

    showToast("Đã xoá khỏi danh sách yêu thích", "warning");
  });

  // Add all to cart
  const addAllBtn = document.getElementById("add-all-to-cart");
  if (addAllBtn) {
    // Replace event listeners to avoid duplicates
    const newBtn = addAllBtn.cloneNode(true);
    addAllBtn.parentNode.replaceChild(newBtn, addAllBtn);
    newBtn.addEventListener("click", handleAddAllToCart);
  }
}

function handleAddAllToCart() {
  const { matchingProducts } = wishlistState;
  if (!matchingProducts.length) return;

  const cart = getActiveCart();
  if (!cart.items) cart.items = [];

  let addedCount = 0;
  matchingProducts.forEach((product) => {
    const existing = cart.items.find((item) => item.productId === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.items.push({ productId: product.id, quantity: 1 });
    }
    addedCount++;
  });

  cart.updatedAt = new Date().toISOString();
  setActiveCart(cart);

  // Update cart badge in header
  const totalCount = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const badge = document.querySelector(".header-action-btn__badge");
  if (badge) {
    badge.textContent = totalCount > 99 ? "99+" : totalCount;
  }

  showToast(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng!`);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "wishlist") {
    initWishlistPage();
  }
});
