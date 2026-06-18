import { fetchJSON, formatCurrency, formatDate, escapeHTML, getQueryParam } from "./utils.js";
import { getOrders, setOrders, getCurrentUser } from "./storage.js";
import { showToast } from "./main.js";

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
  activeTab: "all"
};

function getProductInfo(productId) {
  return ordersState.products.find((p) => p.id === productId);
}

function getUserOrders(allOrders) {
  const currentUser = getCurrentUser();
  if (!currentUser) return allOrders;
  return allOrders.filter((order) =>
    order.userId === currentUser.id ||
    order.customerEmail === currentUser.email ||
    order.customerPhone === currentUser.phone
  );
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
        ${order.items.slice(0, 3).map((item) => {
          const product = getProductInfo(item.productId);
          return `
            <div class="order-product">
              <div class="order-product__image">
                <img src="${item.imageUrl || product?.imageUrl || "./assets/images/placeholder-product.svg"}" alt="${escapeHTML(item.productName)}" />
              </div>
              <span class="order-product__name">${escapeHTML(item.productName)}</span>
              <span class="order-product__qty">×${item.quantity}</span>
              <span class="order-product__price">${formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          `;
        }).join("")}
        ${order.items.length > 3 ? '<p style="color:var(--color-muted);font-size:13px;margin:8px 0 0;">... và ' + (order.items.length - 3) + " sản phẩm khác</p>" : ""}
      </div>
      <div class="order-card__footer">
        <div>
          <span class="order-card__total-label">Tổng đơn hàng: </span>
          <span class="order-card__total-value">${formatCurrency(order.total)}</span>
        </div>
        <div class="order-card__actions">
          ${order.status === "pending" ? '<button class="btn btn--sale btn--sm" data-action="cancel" data-order-id="' + order.id + '" type="button">Hủy đơn</button>' : ""}
          <a class="btn btn--outline btn--sm" href="./orders.html?order=${order.id}">Chi tiết</a>
        </div>
      </div>
    </article>
  `;
}

function renderOrdersPage(allOrders) {
  const userOrders = getUserOrders(allOrders);
  const filtered = ordersState.activeTab === "all"
    ? userOrders
    : userOrders.filter((o) => o.status === ordersState.activeTab);

  return `
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
}

function bindEvents() {
  document.querySelectorAll(".orders-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      ordersState.activeTab = tab.dataset.tab;
      rerender();
    });
  });

  document.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const orderId = btn.dataset.orderId;
      const localOrders = getOrders();
      const order = localOrders.find((o) => o.id === orderId);
      if (order) {
        order.status = "cancelled";
        order.updatedAt = new Date().toISOString();
        setOrders(localOrders);
        ordersState.orders = ordersState.orders.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o);
        showToast("Đã hủy đơn hàng");
        rerender();
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
      const byPhone = !phone || order.customerPhone.includes(phone);
      const byCode = !orderCode || order.orderCode.toUpperCase().includes(orderCode);
      return byPhone && byCode;
    });
    const message = document.getElementById("trace-message");
    if (message) {
      if (result) {
        const statusLabel = STATUS_LABELS[result.status] || result.status;
        message.textContent = "Tìm thấy đơn " + result.orderCode + " — " + statusLabel + " — " + formatCurrency(result.total);
        message.style.color = "var(--color-primary)";
      } else {
        message.textContent = "Không tìm thấy đơn hàng phù hợp.";
        message.style.color = "var(--color-sale)";
      }
    }
  });
}

async function initOrdersPage() {
  const [seedOrdersRaw, productsRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.seedOrders),
    fetchJSON(DATA_PATHS.products)
  ]);
  ordersState.products = productsRaw.filter((p) => p.isActive !== false);
  ordersState.orders = [...seedOrdersRaw, ...getOrders()];

  const orderParam = getQueryParam("order");
  if (orderParam) {
    const order = ordersState.orders.find((o) => o.id === orderParam);
    if (order) {
      ordersState.activeTab = order.status;
    }
  }

  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  container.innerHTML = renderOrdersPage(ordersState.orders);
  bindEvents();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "orders") {
    initOrdersPage();
  }
});

export { initOrdersPage };
