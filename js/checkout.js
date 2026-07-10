import { fetchJSON, formatCurrency, generateId, escapeHTML, formatNumber, renderBreadcrumb, createBreadcrumbItems } from "./utils.js";
import {
  getActiveCart,
  setActiveCart,
  getOrders,
  setOrders,
  getCurrentUser,
  getSavedVouchers,
  getCheckoutDraft,
  setCheckoutDraft,
  clearCheckoutDraft,
  addLoyaltyPoints,
  mergeAdminProducts,
  mergeAdminVouchers
} from "./storage.js";
import { showToast, getProductImage, getProductSalePrice } from "./main.js";

const DATA_PATHS = {
  products: "./data/products.json",
  vouchers: "./data/vouchers.json"
};

let checkoutState = { products: [], vouchers: [] };

const ADDRESS_SUGGESTIONS = [
  "Quận 1, TP. Hồ Chí Minh",
  "Quận 3, TP. Hồ Chí Minh",
  "Quận Bình Thạnh, TP. Hồ Chí Minh",
  "Thành phố Thủ Đức, TP. Hồ Chí Minh",
  "Quận Cầu Giấy, Hà Nội",
  "Quận Ba Đình, Hà Nội",
  "Quận Hải Châu, Đà Nẵng",
  "Quận Ninh Kiều, Cần Thơ"
];

function getProduct(productId) {
  return checkoutState.products.find((product) => product.id === productId);
}

function getSelectedItems(cart) {
  return (cart.items || []).filter((item) => item.selected !== false);
}

function getCheckoutCart(cart) {
  return {
    ...cart,
    items: getSelectedItems(cart).map((item) => ({
      ...item,
      selected: true
    }))
  };
}

function getPrice(product) {
  const salePrice = getProductSalePrice(product);
  return salePrice && salePrice < product.price ? salePrice : product.price;
}

function getStock(product) {
  const stock = Number(product?.stock ?? product?.stock_quantity ?? product?.quantity ?? 0);
  if (product?.in_stock === false) return 0;
  return Number.isFinite(stock) ? stock : 0;
}

function getStockIssues(cart) {
  return getSelectedItems(cart).filter((item) => {
    const product = getProduct(item.productId);
    return !product || Number(item.quantity || 0) > getStock(product);
  });
}

function calculateSubtotal(cart) {
  return getSelectedItems(cart).reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + (product ? getPrice(product) * item.quantity : 0);
  }, 0);
}

function getVoucherDiscount(cart, subtotal, shipping = 0) {
  if (!cart.voucherCode) return 0;
  const voucher = checkoutState.vouchers.find((item) => item.code === cart.voucherCode);
  const minOrder = Number(voucher?.minOrder ?? voucher?.minOrderValue ?? 0);
  if (!voucher || subtotal < minOrder) return 0;
  if (voucher.category === "shipping") {
    return Math.min(shipping, Number(voucher.discountValue || shipping));
  }
  return voucher.discountType === "percent"
    ? Math.min(subtotal * (Number(voucher.discountValue || 0) / 100), voucher.maxDiscountValue || subtotal)
    : Number(voucher.discountValue || 0);
}

function getSavedCheckoutVouchers() {
  const savedIds = new Set(getSavedVouchers().map((item) => item.voucherId));
  return checkoutState.vouchers.filter((voucher) => savedIds.has(voucher.id));
}

function renderSavedVoucherPicker(cart) {
  if (cart.voucherCode) {
    const voucher = checkoutState.vouchers.find((item) => item.code === cart.voucherCode);
    const voucherText = voucher?.title || voucher?.description || "";
    return `
      <div class="checkout-vouchers checkout-vouchers--locked">
        <div>
          <strong>Voucher đã chọn</strong>
        </div>
        <div class="checkout-voucher-lock">
          <strong>${escapeHTML(cart.voucherCode)}</strong>
          ${voucherText ? `<small>${escapeHTML(voucherText)}</small>` : ""}
        </div>
      </div>
    `;
  }

  const savedVouchers = getSavedCheckoutVouchers();
  if (!savedVouchers.length) {
    return `
      <div class="checkout-vouchers checkout-vouchers--empty">
        <div>
          <strong>Voucher đã lưu</strong>
          <span>Bạn chưa lưu voucher nào.</span>
        </div>
        <a class="btn btn--outline btn--sm" href="./vouchers.html">Lưu thêm voucher</a>
      </div>
    `;
  }

  return `
    <div class="checkout-vouchers">
      <div class="checkout-vouchers__header">
        <div>
          <strong>Voucher đã lưu</strong>
          <span>Chọn mã muốn dùng cho đơn này</span>
        </div>
        <a href="./vouchers.html">Lưu thêm voucher</a>
      </div>
      <div class="checkout-vouchers__list">
        ${savedVouchers.map((voucher) => `
          <label class="checkout-voucher ${cart.voucherCode === voucher.code ? "is-active" : ""}">
            <input type="radio" name="savedVoucherCode" value="${escapeHTML(voucher.code)}" ${cart.voucherCode === voucher.code ? "checked" : ""} form="checkout-form" />
            <span>
              <strong>${escapeHTML(voucher.code)}</strong>
              <small>${escapeHTML(voucher.title || voucher.description || "")}</small>
            </span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

function renderCheckoutSteps(activeStep = "delivery") {
  const steps = [
    { key: "cart", label: "Giỏ hàng", desc: "Kiểm tra sản phẩm" },
    { key: "delivery", label: "Giao hàng", desc: "Thông tin nhận hàng" },
    { key: "payment", label: "Thanh toán", desc: "Xác nhận đơn" }
  ];
  const activeIndex = Math.max(0, steps.findIndex((step) => step.key === activeStep));

  return `
    <div class="checkout-steps" aria-label="Tiến trình thanh toán">
      ${steps.map((step, index) => `
        <div class="checkout-step ${index < activeIndex ? "is-done" : ""} ${index === activeIndex ? "is-active" : ""}">
          <span class="checkout-step__number">${index + 1}</span>
          <span class="checkout-step__text">
            <strong>${step.label}</strong>
            <small>${step.desc}</small>
          </span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderOrderSummary(cart) {
  const subtotal = calculateSubtotal(cart);
  const shipping = subtotal >= 300000 ? 0 : 20000;
  const discount = getVoucherDiscount(cart, subtotal, shipping);
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
                <img src="${getProductImage(product)}" alt="${escapeHTML(product.name)}" onerror="this.onerror=null;this.src='./assets/images/placeholder-product.svg'" />
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
  const checkoutCart = getCheckoutCart(cart);
  if (!checkoutCart.items?.length) {
    return `
      ${renderBreadcrumb(createBreadcrumbItems({ pageType: "checkout" }))}
      <section class="checkout-success checkout-success--empty">
        <h1 class="checkout-success__title">Chưa chọn sản phẩm</h1>
        <p class="checkout-success__desc">Hãy chọn ít nhất một sản phẩm trong giỏ hàng trước khi thanh toán.</p>
        <a class="btn btn--primary btn--lg" href="./cart.html">Quay lại giỏ hàng</a>
      </section>
    `;
  }

  const currentUser = getCurrentUser();
  const addressValue = draft.address || currentUser?.address || "";
  const hasAddress = Boolean(addressValue.trim());

  return `
    ${renderBreadcrumb(createBreadcrumbItems({ pageType: "checkout" }))}
    ${renderCheckoutSteps("delivery")}
    <div class="orders-header">
      <h1 class="orders-header__title">Thanh toán</h1>
      <p style="color:var(--color-muted);">Kiểm tra thông tin và xác nhận đơn hàng.</p>
    </div>

    <div class="checkout-layout">
      <div>
        <div class="checkout-section">
          <h2 class="checkout-section__title">Thông tin nhận hàng</h2>
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
            <input type="hidden" name="voucherCode" value="${escapeHTML(cart.voucherCode || draft.voucherCode || "")}" />
            <div class="form-field form-field--full">
              ${renderSavedVoucherPicker(cart)}
            </div>
            <div class="form-field form-field--full">
              <div class="checkout-address ${hasAddress ? "is-confirmed" : "is-editing"}" id="checkout-address">
                <div class="checkout-address__summary">
                  <div>
                    <span>Địa chỉ giao hàng *</span>
                    <strong id="checkout-address-text">${escapeHTML(addressValue || "Chưa có địa chỉ giao hàng")}</strong>
                  </div>
                  <button class="btn btn--outline btn--sm" type="button" id="edit-address-btn">${hasAddress ? "Thay đổi" : "Nhập địa chỉ"}</button>
                </div>
                <div class="checkout-address__editor">
                  <input name="address" list="address-suggestions" value="${escapeHTML(addressValue)}" placeholder="Nhập số nhà, đường, phường/xã, quận/huyện..." required />
                  <datalist id="address-suggestions">
                    ${ADDRESS_SUGGESTIONS.map((item) => '<option value="' + escapeHTML(item) + '"></option>').join("")}
                  </datalist>
                  <button class="btn btn--primary btn--sm" type="button" id="confirm-address-btn">Xác nhận</button>
                </div>
              </div>
            </div>
            <label class="form-field form-field--full">
              <span>Ghi chú cho người giao hàng</span>
              <textarea name="notes" rows="2" placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao...">${escapeHTML(draft.notes || "")}</textarea>
            </label>
          </form>
        </div>

        <div class="checkout-section">
          <h2 class="checkout-section__title">Phương thức thanh toán</h2>
          <div class="payment-methods">
            <label class="payment-method ${(draft.paymentMethod || "cod") === "cod" ? "is-active" : ""}">
              <input type="radio" name="paymentMethod" value="cod" ${(draft.paymentMethod || "cod") === "cod" ? "checked" : ""} form="checkout-form" />
              <div class="payment-method__info">
                <div class="payment-method__name">Thanh toán khi nhận hàng (COD)</div>
                <div class="payment-method__desc">Trả tiền mặt khi nhận được hàng</div>
              </div>
            </label>
            <label class="payment-method ${draft.paymentMethod === "bank" ? "is-active" : ""}">
              <input type="radio" name="paymentMethod" value="bank" ${draft.paymentMethod === "bank" ? "checked" : ""} form="checkout-form" />
              <div class="payment-method__info">
                <div class="payment-method__name">Chuyển khoản ngân hàng</div>
                <div class="payment-method__desc">Chuyển khoản trước khi giao hàng</div>
              </div>
            </label>
            <label class="payment-method ${draft.paymentMethod === "momo" ? "is-active" : ""}">
              <input type="radio" name="paymentMethod" value="momo" ${draft.paymentMethod === "momo" ? "checked" : ""} form="checkout-form" />
              <div class="payment-method__info">
                <div class="payment-method__name">Ví MoMo</div>
                <div class="payment-method__desc">Thanh toán qua ví điện tử MoMo</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      ${renderOrderSummary(checkoutCart)}
    </div>
  `;
}

function createOrderFromCart(formData, cart) {
  const checkoutCart = getCheckoutCart(cart);
  const subtotal = calculateSubtotal(checkoutCart);
  const shippingFee = subtotal >= 300000 ? 0 : 20000;
  const discount = getVoucherDiscount(checkoutCart, subtotal, shippingFee);
  const total = Math.max(0, subtotal + shippingFee - discount);
  const currentUser = getCurrentUser();
  const orderItems = checkoutCart.items
    .map((item) => {
      const product = getProduct(item.productId);
      if (!product) return null;
      return {
        productId: product.id,
        productName: product.name,
        unitPrice: getPrice(product),
        quantity: item.quantity,
        imageUrl: getProductImage(product)
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
    voucherCode: checkoutCart.voucherCode || String(formData.get("voucherCode") || "").trim().toUpperCase() || null,
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
  checkoutState.products = mergeAdminProducts(productsRaw || []).filter((product) => product.isActive !== false && product.active !== false);
  checkoutState.vouchers = mergeAdminVouchers(vouchersRaw || []).filter((voucher) => voucher.isActive !== false);

  const root = document.getElementById("checkout-root");
  if (!root) return;

  const currentUser = getCurrentUser();
  if (!currentUser) {
    root.innerHTML = `
      ${renderBreadcrumb(createBreadcrumbItems({ pageType: "checkout" }))}
      <section class="checkout-success checkout-success--login">
        <h1 class="checkout-success__title">Vui lòng đăng nhập</h1>
        <p class="checkout-success__desc">Bạn cần đăng nhập để thanh toán và lưu đơn hàng vào tài khoản.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px;">
          <a class="btn btn--primary btn--lg" href="./login.html?redirect=checkout">Đăng nhập</a>
          <a class="btn btn--outline btn--lg" href="./cart.html">Quay lại giỏ hàng</a>
        </div>
      </section>
    `;
    return;
  }

  const cart = getActiveCart();
  const draft = getCheckoutDraft();
  root.innerHTML = renderCheckoutPage(cart, draft);

  const form = document.getElementById("checkout-form");
  if (!form || !getSelectedItems(cart).length) return;

  document.querySelectorAll(".payment-method input[type='radio']").forEach((radio) => {
    radio.addEventListener("change", () => {
      document.querySelectorAll(".payment-method").forEach((method) => method.classList.remove("is-active"));
      radio.closest(".payment-method")?.classList.add("is-active");
    });
  });

  document.querySelectorAll("input[name='savedVoucherCode']").forEach((radio) => {
    radio.addEventListener("change", () => {
      const latestCart = getActiveCart();
      latestCart.voucherCode = radio.value;
      latestCart.updatedAt = new Date().toISOString();
      setActiveCart(latestCart);
      document.querySelector("input[name='voucherCode']").value = radio.value;
      document.querySelectorAll(".checkout-voucher").forEach((item) => item.classList.remove("is-active"));
      radio.closest(".checkout-voucher")?.classList.add("is-active");
      showToast("Đã chọn voucher " + radio.value);
    });
  });

  const addressBox = document.getElementById("checkout-address");
  const addressInput = form.elements.address;
  document.getElementById("edit-address-btn")?.addEventListener("click", () => {
    addressBox?.classList.remove("is-confirmed");
    addressBox?.classList.add("is-editing");
    addressInput?.focus();
  });
  document.getElementById("confirm-address-btn")?.addEventListener("click", () => {
    const value = String(addressInput?.value || "").trim();
    if (!value) {
      addressInput?.focus();
      showToast("Vui lòng nhập địa chỉ giao hàng", "warning");
      return;
    }
    document.getElementById("checkout-address-text").textContent = value;
    addressBox?.classList.add("is-confirmed");
    addressBox?.classList.remove("is-editing");
    form.dispatchEvent(new Event("input", { bubbles: true }));
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
    if (!getSelectedItems(latestCart).length) return;
    const stockIssues = getStockIssues(latestCart);
    if (stockIssues.length) {
      showToast("Một số sản phẩm đã vượt tồn kho. Vui lòng quay lại giỏ hàng để cập nhật.", "warning");
      return;
    }

    const voucherCode = String(data.get("voucherCode") || "").trim().toUpperCase();
    if (voucherCode && !latestCart.voucherCode) {
      latestCart.voucherCode = voucherCode;
      setActiveCart(latestCart);
    }

    const order = createOrderFromCart(data, latestCart);
    const orders = getOrders();
    orders.unshift(order);
    setOrders(orders);
    clearCheckoutDraft();
    setActiveCart({
      items: (latestCart.items || []).filter((item) => item.selected === false).map((item) => ({ ...item, selected: true })),
      updatedAt: new Date().toISOString()
    });

    let pointsEarned = 0;
    if (currentUser) {
      pointsEarned = Math.floor(order.total / 1000);
      if (pointsEarned > 0) {
        addLoyaltyPoints(pointsEarned, `Mua hàng ${order.orderCode} - ${formatCurrency(order.total)}`);
      }
    }

    const pointsEarnedDisplay = pointsEarned > 0
      ? `<p class="checkout-success__points">+${formatNumber(pointsEarned)} điểm tích lũy đã được cộng!</p>`
      : "";
    showToast("Đặt hàng thành công!");
    root.innerHTML = `
      <div class="checkout-success">
        ${renderCheckoutSteps("payment")}
        <h1 class="checkout-success__title">Đặt hàng thành công!</h1>
        <p class="checkout-success__desc">Cảm ơn bạn đã mua hàng tại Bách Hóa Tươi</p>
        <p class="checkout-success__code">${order.orderCode}</p>
        ${pointsEarnedDisplay}
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
