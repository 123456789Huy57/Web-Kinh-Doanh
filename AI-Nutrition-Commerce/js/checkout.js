import { fetchJSON, formatCurrency, formatDate, generateId, escapeHTML } from "./utils.js";
import {
  getActiveCart,
  setActiveCart,
  getOrders,
  setOrders,
  getCurrentUser,
  getCheckoutDraft,
  setCheckoutDraft,
  clearCheckoutDraft
} from "./storage.js";
import { showToast } from "./main.js";

const DATA_PATHS = {
  products: "./data/products.json",
  vouchers: "./data/vouchers.json"
};

let checkoutState = { products: [], vouchers: [] };

function getProduct(productId) {
  return checkoutState.products.find((p) => p.id === productId);
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
  const voucher = checkoutState.vouchers.find((v) => v.code === cart.voucherCode);
  if (!voucher || subtotal < voucher.minOrderValue) return 0;
  return voucher.discountType === "percent"
    ? Math.min(subtotal * (voucher.discountValue / 100), voucher.maxDiscountValue || subtotal)
    : voucher.discountValue;
}

function renderOrderSummary(cart) {
  const subtotal = calculateSubtotal(cart);
  const shipping = subtotal >= 300000 ? 0 : 20000;
  const discount = getVoucherDiscount(cart, subtotal);
  const total = Math.max(0, subtotal + shipping - discount);

  return `
    <aside class="checkout-summary">
      <h2 class="checkout-summary__title">Đơn hàng của bạn</h2>
      <div class="checkout-items">
        ${(cart.items || []).map((item) => {
          const product = getProduct(item.productId);
          if (!product) return "";
          return `
            <div class="checkout-item">
              <div class="checkout-item__image">
                <img src="${product.imageUrl}" alt="${escapeHTML(product.name)}" />
              </div>
              <span class="checkout-item__name">${escapeHTML(product.name)}</span>
              <span class="checkout-item__qty">×${item.quantity}</span>
              <span class="checkout-item__price">${formatCurrency(getPrice(product) * item.quantity)}</span>
            </div>
          `;
        }).join("")}
      </div>
      <div class="checkout-totals">
        <div class="checkout-total-row">
          <span>Tạm tính</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        <div class="checkout-total-row">
          <span>Phí vận chuyển</span>
          <span>${shipping === 0 ? '<span style="color:var(--color-success);">Miễn phí</span>' : formatCurrency(shipping)}</span>
        </div>
        ${discount > 0 ? `
        <div class="checkout-total-row">
          <span>Giảm giá</span>
          <span style="color:var(--color-sale);">-${formatCurrency(discount)}</span>
        </div>` : ""}
        <div class="checkout-total-row checkout-total-row--grand">
          <span>Tổng thanh toán</span>
          <span class="checkout-total-row__value">${formatCurrency(total)}</span>
        </div>
      </div>
      <button class="btn btn--primary btn--block btn--lg" type="submit" form="checkout-form">Đặt hàng</button>
      <a class="btn btn--ghost btn--block" href="./cart.html" style="margin-top:8px;">Quay lại giỏ hàng</a>
    </aside>
  `;
}

function renderCheckoutPage(cart, draft) {
  if (!cart.items?.length) {
    return `
      <div style="text-align:center;padding:60px 20px;">
        <h1>Giỏ hàng đang trống</h1>
        <p style="color:var(--color-muted);margin-bottom:24px;">Hãy thêm sản phẩm trước khi thanh toán.</p>
        <a class="btn btn--primary" href="./catalog.html">Đi đến danh mục</a>
      </div>
    `;
  }

  const currentUser = getCurrentUser();

  return `
    <div class="orders-header">
      <h1 class="orders-header__title">Thanh toán</h1>
      <p style="color:var(--color-muted);">Kiểm tra thông tin và xác nhận đơn hàng.</p>
    </div>

    <div class="checkout-layout">
      <div>
        <div class="checkout-section">
          <h2 class="checkout-section__title">📍 Thông tin nhận hàng</h2>
          <form id="checkout-form" class="checkout-form-grid">
            <label class="form-field">
              <span>Họ và tên *</span>
              <input name="fullName" value="${escapeHTML(draft.fullName || currentUser?.fullName || "")}" required />
            </label>
            <label class="form-field">
              <span>Số điện thoại *</span>
              <input name="phone" value="${escapeHTML(draft.phone || currentUser?.phone || "")}" required />
            </label>
            <label class="form-field">
              <span>Email</span>
              <input name="email" type="email" value="${escapeHTML(draft.email || currentUser?.email || "")}" />
            </label>
            <label class="form-field">
              <span>Mã voucher</span>
              <input name="voucherCode" value="${escapeHTML(cart.voucherCode || draft.voucherCode || "")}" placeholder="Nhập mã giảm giá" />
            </label>
            <label class="form-field form-field--full">
              <span>Địa chỉ giao hàng *</span>
              <textarea name="address" rows="3" required>${escapeHTML(draft.address || currentUser?.address || "")}</textarea>
            </label>
            <label class="form-field form-field--full">
              <span>Ghi chú cho người giao hàng</span>
              <textarea name="notes" rows="2" placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao...">${escapeHTML(draft.notes || "")}</textarea>
            </label>
          </form>
        </div>

        <div class="checkout-section">
          <h2 class="checkout-section__title">💳 Phương thức thanh toán</h2>
          <div class="payment-methods">
            <label class="payment-method ${(draft.paymentMethod || "cod") === "cod" ? "is-active" : ""}">
              <input type="radio" name="paymentMethod" value="cod" ${(draft.paymentMethod || "cod") === "cod" ? "checked" : ""} form="checkout-form" />
              <span class="payment-method__icon">💵</span>
              <div class="payment-method__info">
                <div class="payment-method__name">Thanh toán khi nhận hàng (COD)</div>
                <div class="payment-method__desc">Trả tiền mặt khi nhận được hàng</div>
              </div>
            </label>
            <label class="payment-method ${draft.paymentMethod === "bank" ? "is-active" : ""}">
              <input type="radio" name="paymentMethod" value="bank" ${draft.paymentMethod === "bank" ? "checked" : ""} form="checkout-form" />
              <span class="payment-method__icon">🏦</span>
              <div class="payment-method__info">
                <div class="payment-method__name">Chuyển khoản ngân hàng</div>
                <div class="payment-method__desc">Chuyển khoản trước khi giao hàng</div>
              </div>
            </label>
            <label class="payment-method ${draft.paymentMethod === "momo" ? "is-active" : ""}">
              <input type="radio" name="paymentMethod" value="momo" ${draft.paymentMethod === "momo" ? "checked" : ""} form="checkout-form" />
              <span class="payment-method__icon">📱</span>
              <div class="payment-method__info">
                <div class="payment-method__name">Ví MoMo</div>
                <div class="payment-method__desc">Thanh toán qua ví điện tử MoMo</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      ${renderOrderSummary(cart)}
    </div>
  `;
}

function createOrderFromCart(formData, cart) {
  const subtotal = calculateSubtotal(cart);
  const shippingFee = subtotal >= 300000 ? 0 : 20000;
  const discount = getVoucherDiscount(cart, subtotal);
  const total = Math.max(0, subtotal + shippingFee - discount);
  const currentUser = getCurrentUser();
  const orderItems = cart.items
    .map((item) => {
      const product = getProduct(item.productId);
      if (!product) return null;
      return {
        productId: product.id,
        productName: product.name,
        unitPrice: getPrice(product),
        quantity: item.quantity,
        imageUrl: product.imageUrl
      };
    })
    .filter(Boolean);

  return {
    id: generateId("ord"),
    orderCode: "ORD-" + new Date().toISOString().slice(0, 10).replaceAll("-", "") + "-" + String(Date.now()).slice(-4),
    userId: currentUser?.id || null,
    customerName: String(formData.get("fullName") || ""),
    customerEmail: String(formData.get("email") || "") || null,
    customerPhone: String(formData.get("phone") || ""),
    shippingAddress: String(formData.get("address") || ""),
    guestToken: currentUser?.id ? null : generateId("GT"),
    items: orderItems,
    subtotal,
    shippingFee,
    discount,
    voucherCode: cart.voucherCode || String(formData.get("voucherCode") || "").trim().toUpperCase() || null,
    total,
    status: "pending",
    paymentMethod: String(formData.get("paymentMethod") || "cod"),
    paymentStatus: "unpaid",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: String(formData.get("notes") || "") || null
  };
}

async function initCheckoutPage() {
  const [productsRaw, vouchersRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.vouchers)
  ]);
  checkoutState.products = productsRaw.filter((p) => p.isActive !== false);
  checkoutState.vouchers = vouchersRaw.filter((v) => v.isActive !== false);

  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  const cart = getActiveCart();
  const draft = getCheckoutDraft();
  container.innerHTML = renderCheckoutPage(cart, draft);

  const form = document.getElementById("checkout-form");
  if (!form || !cart.items?.length) return;

  document.querySelectorAll(".payment-method input[type='radio']").forEach((radio) => {
    radio.addEventListener("change", () => {
      document.querySelectorAll(".payment-method").forEach((m) => m.classList.remove("is-active"));
      radio.closest(".payment-method")?.classList.add("is-active");
    });
  });

  form.addEventListener("input", () => {
    const data = new FormData(form);
    setCheckoutDraft({
      fullName: String(data.get("fullName") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      address: String(data.get("address") || ""),
      notes: String(data.get("notes") || ""),
      voucherCode: String(data.get("voucherCode") || "").toUpperCase(),
      paymentMethod: String(data.get("paymentMethod") || "cod")
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const latestCart = getActiveCart();
    if (!latestCart.items?.length) return;

    const vCode = String(data.get("voucherCode") || "").trim().toUpperCase();
    if (vCode && !latestCart.voucherCode) {
      latestCart.voucherCode = vCode;
      setActiveCart(latestCart);
    }

    const order = createOrderFromCart(data, latestCart);
    const orders = getOrders();
    orders.unshift(order);
    setOrders(orders);
    clearCheckoutDraft();
    setActiveCart({ items: [], updatedAt: new Date().toISOString() });
    showToast("Đặt hàng thành công!");
    container.innerHTML = `
      <div class="checkout-success">
        <div class="checkout-success__icon">✅</div>
        <h1 class="checkout-success__title">Đặt hàng thành công!</h1>
        <p class="checkout-success__desc">Cảm ơn bạn đã mua hàng tại Bách Hóa Tươi</p>
        <p class="checkout-success__code">${order.orderCode}</p>
        <p style="color:var(--color-muted);margin-bottom:24px;">Đơn hàng đã được lưu. Bạn có thể theo dõi trạng thái trong phần Đơn hàng.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a class="btn btn--primary btn--lg" href="./orders.html">Xem đơn hàng</a>
          <a class="btn btn--outline btn--lg" href="./catalog.html">Tiếp tục mua sắm</a>
        </div>
      </div>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "checkout") {
    initCheckoutPage();
  }
});

export { initCheckoutPage };
