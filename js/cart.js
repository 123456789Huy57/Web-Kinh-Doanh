import { fetchJSON, formatCurrency, escapeHTML, renderBreadcrumb, createBreadcrumbItems } from "./utils.js";
import { getActiveCart, setActiveCart, clearActiveCart, getCurrentUser, getSavedVouchers, mergeAdminProducts, mergeAdminVouchers } from "./storage.js";
import { showToast, getProductImage, getProductSalePrice } from "./main.js";

const DATA_PATHS = {
  products: "./data/products.json",
  vouchers: "./data/vouchers.json"
};

let cartState = {
  products: [],
  vouchers: [],
  cart: { items: [], updatedAt: null }
};

let voucherMsg = { text: "", success: false };

function getProduct(productId) {
  return cartState.products.find((p) => p.id === productId);
}

function getPrice(product) {
  const salePrice = getProductSalePrice(product);
  return salePrice && salePrice < product.price ? salePrice : product.price;
}

function calculateSubtotal(cart) {
  return (cart.items || []).reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + (product ? getPrice(product) * item.quantity : 0);
  }, 0);
}

function getVoucherDiscount(cart, subtotal, shipping = 0) {
  if (!cart.voucherCode) return 0;
  const voucher = cartState.vouchers.find((v) => v.code === cart.voucherCode);
  if (!voucher || subtotal < voucher.minOrderValue) return 0;
  if (voucher.category === "shipping") {
    return Math.min(shipping, voucher.discountValue || shipping);
  }
  return voucher.discountType === "percent"
    ? Math.min(subtotal * (voucher.discountValue / 100), voucher.maxDiscountValue || subtotal)
    : voucher.discountValue;
}

function getVoucherValue(voucher, subtotal, shipping = 0) {
  if (!voucher) return 0;
  if (voucher.category === "shipping") {
    return Math.min(shipping, voucher.discountValue || shipping);
  }
  if (voucher.discountType === "percent") {
    return Math.min(subtotal * (voucher.discountValue / 100), voucher.maxDiscountValue || subtotal);
  }
  return voucher.discountValue;
}

function getVoucherLabel(voucher) {
  if (voucher.discountType === "percent") {
    const cap = voucher.maxDiscountValue ? `, tối đa ${formatCurrency(voucher.maxDiscountValue)}` : "";
    return `Giảm ${voucher.discountValue}%${cap}`;
  }
  return `Giảm ${formatCurrency(voucher.discountValue)}`;
}

function getSuggestedVouchers(subtotal, currentCode = "", shipping = 0) {
  const savedIds = new Set(getSavedVouchers().map((item) => item.voucherId));
  return cartState.vouchers
    .filter((voucher) => voucher.isActive !== false && savedIds.has(voucher.id))
    .map((voucher) => {
      const missing = Math.max(0, Number(voucher.minOrderValue || 0) - subtotal);
      return {
        ...voucher,
        missing,
        isEligible: missing === 0,
        estimatedDiscount: missing === 0 ? getVoucherValue(voucher, subtotal, shipping) : getVoucherValue(voucher, voucher.minOrderValue || subtotal, 20000)
      };
    })
    .sort((a, b) => {
      if (a.code === currentCode) return -1;
      if (b.code === currentCode) return 1;
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
      if (a.isEligible && b.isEligible) return b.estimatedDiscount - a.estimatedDiscount;
      return a.missing - b.missing;
    });
}

function renderVoucherSuggestions(subtotal, currentCode = "", shipping = 0) {
  const suggestions = getSuggestedVouchers(subtotal, currentCode, shipping);
  if (!suggestions.length) {
    return `
      <div class="cart-voucher-suggestions cart-voucher-suggestions--empty">
        <div class="cart-voucher-suggestions__head">
          <span>Voucher đã lưu</span>
          <small>Bạn chưa lưu voucher nào cho giỏ hàng này</small>
        </div>
        <a class="btn btn--outline btn--sm" href="./vouchers.html">Lưu thêm voucher</a>
      </div>
    `;
  }

  return `
    <div class="cart-voucher-suggestions">
      <div class="cart-voucher-suggestions__head">
        <span>Voucher có thể dùng</span>
        <small>Tự tính theo giá trị giỏ hàng</small>
      </div>
      <a class="cart-voucher-suggestions__more" href="./vouchers.html">Lưu thêm voucher</a>
      <div class="cart-voucher-list">
        ${suggestions.map((voucher) => {
          const isApplied = currentCode === voucher.code;
          return `
            <button class="cart-voucher-chip ${voucher.isEligible ? "is-eligible" : "is-locked"} ${isApplied ? "is-applied" : ""}" type="button" data-voucher-code="${escapeHTML(voucher.code)}">
              <span class="cart-voucher-chip__main">
                <strong>${escapeHTML(voucher.code)}</strong>
                <span>${escapeHTML(voucher.title || getVoucherLabel(voucher))}</span>
              </span>
              <span class="cart-voucher-chip__meta">
                ${voucher.isEligible
                  ? `${isApplied ? "Đang dùng" : "Dùng ngay"} · ${voucher.estimatedDiscount > 0 ? getVoucherLabel(voucher) : "Đơn đã đạt ưu đãi"}`
                  : `Mua thêm ${formatCurrency(voucher.missing)}`}
              </span>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderCartEmpty() {
  return `
    ${renderBreadcrumb(createBreadcrumbItems({ pageType: "cart" }))}
    <div class="cart-empty">
      <h2 class="cart-empty__title">Giỏ hàng đang trống</h2>
      <p class="cart-empty__desc">Hãy thêm sản phẩm vào giỏ để bắt đầu mua sắm!</p>
      <a class="btn btn--primary btn--lg" href="./catalog.html">Mua sắm ngay</a>
    </div>
  `;
}

function renderCartItems(cart) {
  return cart.items.map((item) => {
    const product = getProduct(item.productId);
    if (!product) return "";
    const subtotal = getPrice(product) * item.quantity;
    return `
      <div class="cart-item" data-product-id="${product.id}">
        <div class="cart-item__checkbox">
          <input type="checkbox" checked />
        </div>
        <div class="cart-item__image">
          <img src="${getProductImage(product)}" alt="${escapeHTML(product.name)}" onerror="this.onerror=null;this.src='./assets/images/placeholder-product.svg'" />
        </div>
        <div class="cart-item__info">
          <div class="cart-item__name">
            <a href="./product-detail.html?slug=${encodeURIComponent(product.slug)}">${escapeHTML(product.name)}</a>
          </div>
          <div class="cart-item__unit">${escapeHTML(product.brand)} · ${escapeHTML(product.unit)}</div>
        </div>
        <div class="cart-item__quantity">
          <div class="quantity-control">
            <button class="quantity-control__btn" data-action="decrease" data-product-id="${product.id}" type="button">−</button>
            <input class="quantity-control__value" type="number" value="${item.quantity}" min="1" readonly />
            <button class="quantity-control__btn" data-action="increase" data-product-id="${product.id}" type="button">+</button>
          </div>
        </div>
        <div class="cart-item__subtotal">${formatCurrency(subtotal)}</div>
        <button class="cart-item__remove" data-action="remove" data-product-id="${product.id}" type="button" title="Xóa">✕</button>
      </div>
    `;
  }).join("");
}

function renderCartPage() {
  const cart = cartState.cart;
  if (!cart.items?.length) return renderCartEmpty();

  const subtotal = calculateSubtotal(cart);
  const freeShipThreshold = 300000;
  const shipping = subtotal >= freeShipThreshold ? 0 : 20000;
  const discount = getVoucherDiscount(cart, subtotal, shipping);
  const total = Math.max(0, subtotal + shipping - discount);
  const shippingProgress = Math.min(100, Math.round((subtotal / freeShipThreshold) * 100));
  const remaining = Math.max(0, freeShipThreshold - subtotal);
  const currentUser = getCurrentUser();

  return `
    <section class="cart-hero">
      ${renderBreadcrumb(createBreadcrumbItems({ pageType: "cart" }))}
      <div class="cart-hero__content">
        <div>
          <p class="cart-hero__eyebrow">Giỏ hàng</p>
          <h1 class="cart-hero__title">Giỏ hàng</h1>
          <p class="cart-hero__desc">${currentUser ? "Xin chào " + escapeHTML(currentUser.fullName) + ". " : ""}Rà lại sản phẩm, áp dụng ưu đãi tốt nhất và thanh toán khi mọi thứ đã đúng.</p>
        </div>
        <div class="cart-hero__stats">
          <div class="cart-hero__stat">
            <span>${cart.items.length}</span>
            <small>Sản phẩm</small>
          </div>
          <div class="cart-hero__stat">
            <span>${formatCurrency(subtotal)}</span>
            <small>Tạm tính</small>
          </div>
        </div>
      </div>
    </section>

    <div class="cart-items">
      <div class="cart-header">
        <div class="cart-header__select-all">
          <input type="checkbox" checked />
          <span>Chọn tất cả (${cart.items.length})</span>
        </div>
        <button class="btn btn--ghost btn--sm" id="clear-cart-btn" type="button">Xóa tất cả</button>
      </div>
      ${renderCartItems(cart)}
    </div>

    <aside class="cart-summary">
      <h2 class="cart-summary__title">Đơn hàng</h2>

      <div class="shipping-progress">
        <div class="shipping-progress__text">
          ${remaining > 0
            ? "Mua thêm <strong>" + formatCurrency(remaining) + "</strong> để được <strong>miễn phí vận chuyển</strong>"
            : "Bạn được <strong>miễn phí vận chuyển!</strong>"}
        </div>
        <div class="shipping-progress__bar">
          <div class="shipping-progress__fill" style="width:${shippingProgress}%"></div>
        </div>
      </div>

      <div class="cart-voucher">
        <input type="text" id="voucher-input" placeholder="Nhập mã giảm giá" value="${escapeHTML(cart.voucherCode || "")}" />
        <button class="btn btn--outline btn--sm" id="apply-voucher-btn" type="button">Áp dụng</button>
      </div>
      ${voucherMsg.text ? '<div class="cart-voucher__msg ' + (voucherMsg.success ? "cart-voucher__msg--success" : "cart-voucher__msg--error") + '">' + escapeHTML(voucherMsg.text) + "</div>" : ""}
      ${renderVoucherSuggestions(subtotal, cart.voucherCode || "", shipping)}

      <div class="cart-summary__rows">
        <div class="cart-summary__row">
          <span class="cart-summary__label">Tạm tính</span>
          <span class="cart-summary__value">${formatCurrency(subtotal)}</span>
        </div>
        <div class="cart-summary__row">
          <span class="cart-summary__label">Phí vận chuyển</span>
          <span class="cart-summary__value">${shipping === 0 ? '<span style="color:var(--color-success);font-weight:700;">Miễn phí</span>' : formatCurrency(shipping)}</span>
        </div>
        ${discount > 0 ? `
        <div class="cart-summary__row">
          <span class="cart-summary__label">Giảm giá</span>
          <span class="cart-summary__value" style="color:var(--color-sale);">-${formatCurrency(discount)}</span>
        </div>` : ""}
        <div class="cart-summary__row cart-summary__row--total">
          <span>Tổng cộng</span>
          <span class="cart-summary__value">${formatCurrency(total)}</span>
        </div>
      </div>

      <div class="cart-summary__actions">
        <a class="btn btn--primary btn--block btn--lg" href="./checkout.html">Tiến hành thanh toán</a>
        <a class="btn btn--ghost btn--block" href="./catalog.html">Tiếp tục mua sắm</a>
      </div>
    </aside>
  `;
}

function updateCartItem(productId, delta) {
  const cart = getActiveCart();
  cart.items = cart.items || [];
  const item = cart.items.find((e) => e.productId === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart.items = cart.items.filter((e) => e.productId !== productId);
  }
  cart.updatedAt = new Date().toISOString();
  setActiveCart(cart);
  rerender();
}

function removeCartItem(productId) {
  const cart = getActiveCart();
  cart.items = (cart.items || []).filter((e) => e.productId !== productId);
  cart.updatedAt = new Date().toISOString();
  setActiveCart(cart);
  showToast("Đã xóa sản phẩm khỏi giỏ hàng");
  rerender();
}

function applyVoucher(code) {
  const cart = getActiveCart();
  const voucher = cartState.vouchers.find((v) => v.code === code);
  if (!voucher) {
    voucherMsg = { text: "Mã giảm giá không hợp lệ", success: false };
    rerender();
    return;
  }
  const subtotal = calculateSubtotal(cart);
  if (subtotal < voucher.minOrderValue) {
    const missing = voucher.minOrderValue - subtotal;
    voucherMsg = { text: "Chưa đủ điều kiện cho mã " + voucher.code + ". Mua thêm " + formatCurrency(missing) + " để áp dụng.", success: false };
    rerender();
    return;
  }
  const shipping = subtotal >= 300000 ? 0 : 20000;
  if (voucher.category === "shipping" && shipping === 0) {
    voucherMsg = { text: "Đơn hàng đã được miễn phí vận chuyển, bạn nên chọn voucher giảm trực tiếp vào sản phẩm.", success: false };
    rerender();
    return;
  }
  cart.voucherCode = voucher.code;
  cart.updatedAt = new Date().toISOString();
  setActiveCart(cart);
  voucherMsg = { text: "Áp dụng mã " + voucher.code + " thành công!", success: true };
  showToast("Đã áp dụng mã giảm giá " + voucher.code);
  rerender();
}

function rerender() {
  cartState.cart = getActiveCart();
  cartState.cart.items = cartState.cart.items || [];
  const root = document.getElementById("cart-root");
  if (!root) return;
  root.innerHTML = renderCartPage();
  bindEvents();
}

function bindEvents() {
  const root = document.getElementById("cart-root");
  if (!root) return;

  root.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pid = btn.dataset.productId;
      if (btn.dataset.action === "increase") updateCartItem(pid, 1);
      if (btn.dataset.action === "decrease") updateCartItem(pid, -1);
      if (btn.dataset.action === "remove") removeCartItem(pid);
    });
  });

  document.getElementById("clear-cart-btn")?.addEventListener("click", () => {
    voucherMsg = { text: "", success: false };
    clearActiveCart();
    showToast("Đã xóa toàn bộ giỏ hàng");
    rerender();
  });

  document.getElementById("apply-voucher-btn")?.addEventListener("click", () => {
    const input = document.getElementById("voucher-input");
    const code = (input?.value || "").trim().toUpperCase();
    if (code) applyVoucher(code);
  });

  document.getElementById("voucher-input")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const code = (event.currentTarget.value || "").trim().toUpperCase();
    if (code) applyVoucher(code);
  });

  root.querySelectorAll("[data-voucher-code]").forEach((button) => {
    button.addEventListener("click", () => {
      applyVoucher(button.dataset.voucherCode || "");
    });
  });
}

async function initCartPage() {
  const [productsRaw, vouchersRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.vouchers)
  ]);

  cartState.products = mergeAdminProducts(productsRaw || []).filter((p) => p.isActive !== false && p.active !== false);
  cartState.vouchers = mergeAdminVouchers(vouchersRaw || []).filter((v) => v.isActive !== false);
  cartState.cart = getActiveCart();
  cartState.cart.items = cartState.cart.items || [];

  const root = document.getElementById("cart-root");
  if (!root) return;
  root.innerHTML = renderCartPage();
  bindEvents();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "cart") {
    initCartPage();
  }
});

export { initCartPage };
