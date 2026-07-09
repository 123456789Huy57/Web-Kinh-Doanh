import { fetchJSON, formatCurrency, formatDate, escapeHTML, getQueryParam, renderBreadcrumb, createBreadcrumbItems } from "./utils.js";
import { getOrders, setOrders, getCurrentUser, getActiveCart, setActiveCart, mergeAdminProducts } from "./storage.js";
import { showToast, getProductImage } from "./main.js";

const DATA_PATHS = {
  seedOrders: "./data/orders.json",
  products: "./data/products.json"
};

const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy"
};

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "shipping", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã hủy" }
];

let ordersState = {
  products: [],
  orders: [],
  activeTab: "all",
  selectedOrderId: ""
};

function mergeOrders(primary = [], secondary = []) {
  const map = new Map();
  [...secondary, ...primary].forEach((order) => {
    if (order?.id) map.set(order.id, { ...(map.get(order.id) || {}), ...order });
  });
  return [...map.values()];
}

function getProductInfo(productId) {
  return ordersState.products.find((product) => product.id === productId);
}

function getUserOrders(allOrders) {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];
  return allOrders.filter((order) =>
    order.userId === currentUser.id ||
    order.customerEmail === currentUser.email ||
    order.customerPhone === currentUser.phone
  );
}

function renderLoginRequired() {
  return `
    ${renderBreadcrumb(createBreadcrumbItems({ pageType: "orders" }))}
    <section class="orders-empty">
      <h1 class="orders-empty__title">Vui lòng đăng nhập</h1>
      <p class="orders-empty__desc">Bạn cần đăng nhập để xem lịch sử đơn hàng và theo dõi trạng thái giao hàng.</p>
      <a class="btn btn--primary" href="./login.html?redirect=orders">Đăng nhập để xem đơn hàng</a>
      <a class="btn btn--ghost" href="./catalog.html">Tiếp tục mua sắm</a>
    </section>
  `;
}

function renderOrderTimeline(status) {
  const steps = [
    { key: "pending", label: "Tiếp nhận" },
    { key: "confirmed", label: "Xác nhận" },
    { key: "preparing", label: "Chuẩn bị" },
    { key: "shipping", label: "Đang giao" },
    { key: "delivered", label: "Hoàn tất" }
  ];
  const currentIndex = status === "cancelled"
    ? -1
    : Math.max(0, steps.findIndex((step) => step.key === status));

  return `
    <div class="order-timeline ${status === "cancelled" ? "is-cancelled" : ""}" aria-label="Tiến trình đơn hàng">
      ${steps.map((step, index) => `
        <div class="order-timeline__step ${index < currentIndex ? "is-done" : ""} ${index === currentIndex ? "is-active" : ""}">
          <span class="order-timeline__dot">${index + 1}</span>
          <span class="order-timeline__label">${step.label}</span>
        </div>
      `).join("")}
      ${status === "cancelled" ? `<div class="order-timeline__cancelled">Đơn hàng đã hủy</div>` : ""}
    </div>
  `;
}

function getOrderImage(item) {
  const product = getProductInfo(item.productId);
  return item.imageUrl || (product ? getProductImage(product) : "") || "./assets/images/placeholder-product.svg";
}

function renderOrderDetail(order) {
  const statusClass = "order-status--" + order.status;
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const paymentLabel = order.paymentMethod === "cod"
    ? "Thanh toán khi nhận hàng"
    : order.paymentMethod === "bank"
      ? "Chuyển khoản ngân hàng"
      : order.paymentMethod === "momo"
        ? "Ví MoMo"
        : escapeHTML(order.paymentMethod || "Chưa xác định");

  return `
    <section class="order-detail">
      <div class="order-detail__header">
        <div>
          <div class="order-detail__code">${escapeHTML(order.orderCode)}</div>
          <div class="order-detail__date">${formatDate(order.createdAt)}</div>
        </div>
        <span class="order-status ${statusClass}">${escapeHTML(statusLabel)}</span>
      </div>

      ${renderOrderTimeline(order.status)}

      <div class="order-detail__grid">
        <div class="order-detail__panel">
          <h3>Thông tin giao hàng</h3>
          <p><strong>Người nhận:</strong> ${escapeHTML(order.customerName || "")}</p>
          <p><strong>Số điện thoại:</strong> ${escapeHTML(order.customerPhone || "")}</p>
          <p><strong>Địa chỉ:</strong> ${escapeHTML(order.shippingAddress || "")}</p>
          <p><strong>Ghi chú:</strong> ${escapeHTML(order.notes || "Không có")}</p>
        </div>
        <div class="order-detail__panel">
          <h3>Chi tiết thanh toán</h3>
          <p><strong>Phương thức:</strong> ${paymentLabel}</p>
          <p><strong>Trạng thái thanh toán:</strong> ${escapeHTML(order.paymentStatus || "Chưa xác định")}</p>
          <p><strong>Mã voucher:</strong> ${escapeHTML(order.voucherCode || "Không có")}</p>
          <p><strong>Phí vận chuyển:</strong> ${formatCurrency(order.shippingFee || 0)}</p>
        </div>
      </div>

      <div class="order-detail__items">
        <h3>Sản phẩm trong đơn</h3>
        <div class="order-detail__items-grid">
          ${(order.items || []).map((item) => `
            <div class="order-detail__item">
              <img src="${getOrderImage(item)}" alt="${escapeHTML(item.productName)}" onerror="this.onerror=null;this.src='./assets/images/placeholder-product.svg'" />
              <div class="order-detail__item-meta">
                <strong>${escapeHTML(item.productName)}</strong>
                <span>${item.quantity} × ${formatCurrency(item.unitPrice)}</span>
                <span>${formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="order-detail__summary">
        <div class="order-detail__row"><span>Tạm tính</span><span>${formatCurrency(order.subtotal || order.total || 0)}</span></div>
        <div class="order-detail__row"><span>Giảm giá</span><span>${formatCurrency(order.discount || 0)}</span></div>
        <div class="order-detail__row"><span>Phí vận chuyển</span><span>${formatCurrency(order.shippingFee || 0)}</span></div>
        <div class="order-detail__row order-detail__row--total"><span>Tổng thanh toán</span><span>${formatCurrency(order.total || 0)}</span></div>
      </div>

      <div class="order-detail__back">
        <a class="btn btn--outline btn--sm" href="./orders.html">← Quay lại danh sách đơn hàng</a>
      </div>
    </section>
  `;
}

function renderOrderCard(order) {
  const statusClass = "order-status--" + order.status;
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  return `
    <article class="order-card" data-order-id="${order.id}">
      <div class="order-card__header">
        <div>
          <span class="order-card__code">${escapeHTML(order.orderCode)}</span>
          <span class="order-card__date">${formatDate(order.createdAt)}</span>
        </div>
        <span class="order-status ${statusClass}">${escapeHTML(statusLabel)}</span>
      </div>
      <div class="order-card__items">
        ${(order.items || []).slice(0, 3).map((item) => `
          <div class="order-product">
            <div class="order-product__image">
              <img src="${getOrderImage(item)}" alt="${escapeHTML(item.productName)}" onerror="this.onerror=null;this.src='./assets/images/placeholder-product.svg'" />
            </div>
            <span class="order-product__name">${escapeHTML(item.productName)}</span>
            <span class="order-product__qty">×${item.quantity}</span>
            <span class="order-product__price">${formatCurrency(item.unitPrice * item.quantity)}</span>
          </div>
        `).join("")}
        ${(order.items || []).length > 3 ? '<p style="color:var(--color-muted);font-size:13px;margin:8px 0 0;">... và ' + (order.items.length - 3) + " sản phẩm khác</p>" : ""}
      </div>
      <div class="order-card__footer">
        <div>
          <span class="order-card__total-label">Tổng đơn hàng: </span>
          <span class="order-card__total-value">${formatCurrency(order.total)}</span>
        </div>
        <div class="order-card__actions">
          ${order.status === "delivered" ? '<button class="btn btn--primary btn--sm" data-action="reorder" data-order-id="' + order.id + '" type="button">Mua lại</button>' : ""}
          ${order.status === "pending" ? '<button class="btn btn--sale btn--sm" data-action="cancel" data-order-id="' + order.id + '" type="button">Hủy đơn</button>' : ""}
          <a class="btn btn--outline btn--sm" href="./orders.html?order=${order.id}">Chi tiết</a>
        </div>
      </div>
    </article>
  `;
}

function renderOrdersPage(allOrders) {
  if (!getCurrentUser()) return renderLoginRequired();

  const userOrders = getUserOrders(allOrders);
  const filtered = ordersState.activeTab === "all"
    ? userOrders
    : userOrders.filter((order) => order.status === ordersState.activeTab);

  const detailOrder = ordersState.selectedOrderId
    ? userOrders.find((order) => order.id === ordersState.selectedOrderId)
    : null;

  if (detailOrder) return renderOrderDetail(detailOrder);

  return `
    ${renderBreadcrumb(createBreadcrumbItems({ pageType: "orders" }))}
    <div class="orders-header">
      <h1 class="orders-header__title">Đơn hàng của tôi</h1>
      <p style="color:var(--color-muted);">Theo dõi trạng thái giao hàng và lịch sử mua sắm.</p>
    </div>

    <div class="orders-tabs">
      ${TABS.map((tab) => `
        <button class="orders-tab ${ordersState.activeTab === tab.key ? "is-active" : ""}" data-tab="${tab.key}" type="button">
          ${tab.label}
          ${tab.key === "all" ? " (" + userOrders.length + ")" : ""}
        </button>
      `).join("")}
    </div>

    <div class="order-list" id="order-list">
      ${filtered.length ? filtered.map(renderOrderCard).join("") : `
        <div class="orders-empty">
          <div class="orders-empty__icon">📦</div>
          <h2 class="orders-empty__title">Chưa có đơn hàng nào</h2>
          <p class="orders-empty__desc">${ordersState.activeTab === "all" ? "Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!" : "Không có đơn hàng ở trạng thái này."}</p>
          <a class="btn btn--primary" href="./catalog.html">Mua sắm ngay</a>
        </div>
      `}
    </div>

    <div class="order-trace">
      <h2>Tra cứu đơn hàng</h2>
      <p style="color:var(--color-muted);margin-bottom:16px;">Nhập mã đơn hoặc số điện thoại để tìm đơn hàng</p>
      <form id="trace-form" class="order-trace__form">
        <label class="form-field">
          <span>Mã đơn hàng</span>
          <input name="orderCode" placeholder="VD: ORD-20260618-1234" />
        </label>
        <label class="form-field">
          <span>Số điện thoại</span>
          <input name="phone" type="tel" placeholder="VD: 0901234567" />
        </label>
        <button class="btn btn--primary" type="submit">Tra cứu</button>
      </form>
      <p id="trace-message" style="margin-top:12px;font-weight:600;"></p>
    </div>
  `;
}

function rerender() {
  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  container.innerHTML = renderOrdersPage(ordersState.orders);
  bindEvents();
  bindOrderLinks();
}

function bindOrderLinks() {
  document.querySelectorAll(".order-card__header").forEach((header) => {
    header.addEventListener("click", () => {
      const card = header.closest(".order-card");
      if (!card) return;
      window.location.href = "./orders.html?order=" + card.dataset.orderId;
    });
  });
}

function bindEvents() {
  document.querySelectorAll(".orders-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      ordersState.activeTab = tab.dataset.tab;
      rerender();
    });
  });

  document.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const orderId = btn.dataset.orderId;
      const localOrders = getOrders();
      const order = ordersState.orders.find((item) => item.id === orderId);
      if (!order) return;
      const updatedOrder = { ...order, status: "cancelled", updatedAt: new Date().toISOString() };
      const orderIndex = localOrders.findIndex((item) => item.id === orderId);

      if (orderIndex >= 0) {
        localOrders[orderIndex] = updatedOrder;
      } else {
        localOrders.push(updatedOrder);
      }

      setOrders(localOrders);
      ordersState.orders = ordersState.orders.map((item) => item.id === orderId ? updatedOrder : item);
      showToast("Đã hủy đơn hàng");
      rerender();
    });
  });

  document.querySelectorAll('[data-action="reorder"]').forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const orderId = btn.dataset.orderId;
      const order = ordersState.orders.find((item) => item.id === orderId);
      if (!order || !order.items?.length) return;

      const cart = getActiveCart();
      if (!cart.items) cart.items = [];

      let addedCount = 0;
      order.items.forEach((item) => {
        const existing = cart.items.find((cartItem) => cartItem.productId === item.productId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          cart.items.push({ productId: item.productId, quantity: item.quantity });
        }
        addedCount++;
      });

      cart.updatedAt = new Date().toISOString();
      setActiveCart(cart);
      showToast("Đã thêm " + addedCount + " sản phẩm vào giỏ hàng!");

      const badge = document.querySelector(".header-action-btn__badge");
      if (badge) {
        const total = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = total > 99 ? "99+" : total;
      }
    });
  });

  document.getElementById("trace-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const phone = String(data.get("phone") || "").trim();
    const orderCode = String(data.get("orderCode") || "").trim().toUpperCase();
    if (!phone && !orderCode) return;

    const result = ordersState.orders.find((order) => {
      const byPhone = !phone || order.customerPhone?.includes(phone);
      const byCode = !orderCode || order.orderCode.toUpperCase().includes(orderCode);
      return byPhone && byCode;
    });
    const message = document.getElementById("trace-message");
    if (!message) return;
    if (result) {
      const statusLabel = STATUS_LABELS[result.status] || result.status;
      message.textContent = "Tìm thấy đơn " + result.orderCode + " - " + statusLabel + " - " + formatCurrency(result.total);
      message.style.color = "var(--color-primary)";
    } else {
      message.textContent = "Không tìm thấy đơn hàng phù hợp.";
      message.style.color = "var(--color-sale)";
    }
  });
}

async function initOrdersPage() {
  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;

  if (!getCurrentUser()) {
    container.innerHTML = renderLoginRequired();
    return;
  }

  const [seedOrdersRaw, productsRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.seedOrders),
    fetchJSON(DATA_PATHS.products)
  ]);
  ordersState.products = mergeAdminProducts(productsRaw || []).filter((product) => product.isActive !== false && product.active !== false);
  ordersState.orders = mergeOrders(getOrders(), seedOrdersRaw || []);

  const orderParam = getQueryParam("order");
  if (orderParam) {
    const order = ordersState.orders.find((item) => item.id === orderParam);
    if (order) {
      ordersState.activeTab = order.status;
      ordersState.selectedOrderId = order.id;
    }
  }

  container.innerHTML = renderOrdersPage(ordersState.orders);
  bindEvents();
  bindOrderLinks();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "orders") {
    initOrdersPage();
  }
});

export { initOrdersPage };
