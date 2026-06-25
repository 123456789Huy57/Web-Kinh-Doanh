import { fetchJSON, formatCurrency, escapeHTML } from "./utils.js";
import { getActiveCart, setActiveCart, clearActiveCart, getCurrentUser } from "./storage.js";
import { showToast } from "./main.js";

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
  return product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
}

function calculateSubtotal(cart) {
  return (cart.items || []).reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + (product ? getPrice(product) * item.quantity : 0);
  }, 0);
}

function getVoucherDiscount(cart, subtotal) {
  if (!cart.voucherCode) return 0;
  const voucher = cartState.vouchers.find((v) => v.code === cart.voucherCode);
  if (!voucher || subtotal < voucher.minOrderValue) return 0;
  return voucher.discountType === "percent"
    ? Math.min(subtotal * (voucher.discountValue / 100), voucher.maxDiscountValue || subtotal)
    : voucher.discountValue;
}

function renderCartEmpty() {
  return `
    <div class="cart-empty">
      <div class="cart-empty__icon">🛒</div>
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
          <img src="${product.imageUrl}" alt="${escapeHTML(product.name)}" />
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
  const discount = getVoucherDiscount(cart, subtotal);
  const total = Math.max(0, subtotal + shipping - discount);
  const shippingProgress = Math.min(100, Math.round((subtotal / freeShipThreshold) * 100));
  const remaining = Math.max(0, freeShipThreshold - subtotal);
  const currentUser = getCurrentUser();

  return `
    <div class="orders-header">
      <h1 class="orders-header__title">Giỏ hàng của bạn</h1>
      <p style="color:var(--color-muted);">${currentUser ? "Xin chào " + escapeHTML(currentUser.fullName) + "! " : ""}Bạn có ${cart.items.length} sản phẩm trong giỏ.</p>
    </div>

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
      <h2 class="cart-summary__title">Tóm tắt đơn hàng</h2>

      <div class="shipping-progress">
        <div class="shipping-progress__text">
          ${remaining > 0
            ? "Mua thêm <strong>" + formatCurrency(remaining) + "</strong> để được <strong>miễn phí vận chuyển</strong>"
            : "🎉 Bạn được <strong>miễn phí vận chuyển!</strong>"}
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
    voucherMsg = { text: "Đơn hàng tối thiểu " + formatCurrency(voucher.minOrderValue), success: false };
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
}

async function initCartPage() {
  const [productsRaw, vouchersRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.vouchers)
  ]);

  cartState.products = productsRaw.filter((p) => p.isActive !== false);
  cartState.vouchers = vouchersRaw.filter((v) => v.isActive !== false);
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
