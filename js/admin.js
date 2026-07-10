import { getCurrentUser, clearCurrentUser, getOrders, setOrders, mergeAdminProducts, mergeAdminVouchers, upsertAdminProduct, upsertAdminVoucher } from "./storage.js";

const DATA_PATHS = {
  products: "./data/products.json",
  orders: "./data/orders.json",
  vouchers: "./data/vouchers.json",
  users: "./data/users.json"
};

const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  processing: "Đang chuẩn bị",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy"
};

const state = {
  products: [],
  orders: [],
  liveOrders: [],
  vouchers: [],
  users: []
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getActivePrice(product) {
  const salePrice = Number(product.sale_price ?? product.salePrice ?? 0);
  const price = Number(product.price || 0);
  return salePrice > 0 && salePrice < price ? salePrice : price;
}

function getProductImage(product) {
  return product.image_url || product.imageUrl || product.image || "./assets/images/placeholder-product.svg";
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Chờ xác nhận";
}

function getOrderDate(order) {
  return (order.createdAt || order.created_at || "").slice(0, 10) || "Chưa có";
}

function getOrderTimestamp(order) {
  const timestamp = new Date(order?.createdAt || order?.created_at || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortOrdersByDateDesc(orders = []) {
  return [...orders].sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
}

function getDashboardOrders() {
  return state.liveOrders.length ? sortOrdersByDateDesc(state.liveOrders) : sortOrdersByDateDesc(state.orders);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderEmpty(colspan, message) {
  return `<tr><td colspan="${colspan}" class="admin-empty">${escapeHTML(message)}</td></tr>`;
}

const CHART_COLORS = ["#1a3c2a", "#c4883a", "#2f7d5b", "#1565c0", "#b54848", "#7b1fa2", "#687568"];

function prepareCanvas(canvas) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(rect.width || canvas.parentElement?.clientWidth || 320));
  const height = Number(canvas.getAttribute("height") || 240);
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.font = "12px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  return { ctx, width, height };
}

function drawEmptyChart(ctx, width, height, message = "Chưa có dữ liệu") {
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#687568";
  ctx.textAlign = "center";
  ctx.font = "600 13px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.fillText(message, width / 2, height / 2);
}

function drawLineChart(canvas, labels, values) {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { ctx, width, height } = prepared;
  const max = Math.max(...values, 1);
  const padding = { top: 18, right: 20, bottom: 34, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  if (!values.some((value) => value > 0)) {
    drawEmptyChart(ctx, width, height, "Chưa có doanh thu");
    return;
  }

  ctx.strokeStyle = "#e5ddd0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i += 1) {
    const y = padding.top + chartHeight * (i / 3);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  const points = values.map((value, index) => ({
    x: padding.left + (chartWidth * index) / Math.max(values.length - 1, 1),
    y: padding.top + chartHeight - (value / max) * chartHeight,
    value
  }));

  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  gradient.addColorStop(0, "rgba(26, 60, 42, 0.24)");
  gradient.addColorStop(1, "rgba(26, 60, 42, 0.02)");
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.strokeStyle = "#1a3c2a";
  ctx.lineWidth = 3;
  ctx.stroke();

  points.forEach((point) => {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a3c2a";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.fillStyle = "#687568";
  ctx.textAlign = "center";
  labels.forEach((label, index) => ctx.fillText(label, points[index].x, height - 12));
  ctx.textAlign = "left";
  ctx.fillText(formatCurrency(max).replace(/\s?₫/, ""), 8, padding.top + 4);
}

function drawBarChart(canvas, labels, values) {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { ctx, width, height } = prepared;
  const max = Math.max(...values, 1);
  const padding = { top: 18, right: 18, bottom: 38, left: 34 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  if (!values.some((value) => value > 0)) {
    drawEmptyChart(ctx, width, height, "Chưa có dữ liệu bán");
    return;
  }

  const gap = 12;
  const barWidth = Math.max(24, (chartWidth - gap * (values.length - 1)) / Math.max(values.length, 1));
  values.forEach((value, index) => {
    const x = padding.left + index * (barWidth + gap);
    const barHeight = (value / max) * chartHeight;
    const y = padding.top + chartHeight - barHeight;
    ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 8);
    ctx.fill();
    ctx.fillStyle = "#1f2d24";
    ctx.textAlign = "center";
    ctx.font = "700 12px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText(String(value), x + barWidth / 2, Math.max(14, y - 7));
    ctx.fillStyle = "#687568";
    ctx.font = "11px 'Be Vietnam Pro', Arial, sans-serif";
    const label = labels[index].length > 12 ? `${labels[index].slice(0, 11)}…` : labels[index];
    ctx.fillText(label, x + barWidth / 2, height - 14);
  });
}

function drawDonutChart(canvas, items, legendElement) {
  const prepared = prepareCanvas(canvas);
  if (!prepared) return;
  const { ctx, width, height } = prepared;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!total) {
    drawEmptyChart(ctx, width, height, "Chưa có đơn hàng");
    if (legendElement) legendElement.innerHTML = "";
    return;
  }

  const radius = Math.min(width, height) * 0.34;
  const centerX = width / 2;
  const centerY = height / 2;
  let start = -Math.PI / 2;
  items.forEach((item, index) => {
    const angle = (item.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start, start + angle);
    ctx.strokeStyle = CHART_COLORS[index % CHART_COLORS.length];
    ctx.lineWidth = 24;
    ctx.stroke();
    start += angle;
  });

  ctx.fillStyle = "#1f2d24";
  ctx.textAlign = "center";
  ctx.font = "800 26px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.fillText(String(total), centerX, centerY + 2);
  ctx.fillStyle = "#687568";
  ctx.font = "12px 'Be Vietnam Pro', Arial, sans-serif";
  ctx.fillText("đơn hàng", centerX, centerY + 24);

  if (legendElement) {
    legendElement.innerHTML = items.map((item, index) => `
      <span class="chart-legend__item">
        <i style="background:${CHART_COLORS[index % CHART_COLORS.length]}"></i>
        ${escapeHTML(item.label)} <strong>${item.value}</strong>
      </span>
    `).join("");
  }
}

function getLastSevenDaysRevenue(orders = getDashboardOrders(), preferToday = false) {
  const orderDates = orders
    .map((order) => new Date(order.createdAt || order.created_at || ""))
    .filter((date) => !Number.isNaN(date.getTime()));
  const latestOrderDate = orderDates.length
    ? new Date(Math.max(...orderDates.map((date) => date.getTime())))
    : null;
  const today = new Date();
  const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
  const hasRecentOrder = latestOrderDate && today.getTime() - latestOrderDate.getTime() <= sixDaysMs;
  const now = preferToday && hasRecentOrder ? today : (latestOrderDate || today);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, label: `${date.getDate()}/${date.getMonth() + 1}`, value: 0 };
  });
  const dayMap = new Map(days.map((day) => [day.key, day]));
  orders
    .filter((order) => order.status !== "cancelled")
    .forEach((order) => {
      const key = (order.createdAt || order.created_at || "").slice(0, 10);
      if (dayMap.has(key)) dayMap.get(key).value += Number(order.total || 0);
    });
  return days;
}

function getCategorySales() {
  const categoryMap = new Map();
  state.products.forEach((product) => {
    const label = product.categoryName || product.category || product.categoryId || "Khác";
    categoryMap.set(label, (categoryMap.get(label) || 0) + Number(product.sold_count || product.soldCount || 0));
  });
  return [...categoryMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function renderDashboardCharts() {
  const dashboardOrders = getDashboardOrders();
  const revenueDays = getLastSevenDaysRevenue(dashboardOrders, state.liveOrders.length > 0);
  const revenueTotal = revenueDays.reduce((sum, day) => sum + day.value, 0);
  setText("chart-revenue-total", formatCurrency(revenueTotal));
  setText("chart-revenue-period", state.liveOrders.length ? "Theo đơn khách đã đặt trong 7 ngày gần nhất" : "Chưa có đơn khách mới, đang hiển thị dữ liệu mẫu");
  drawLineChart($("#revenue-chart"), revenueDays.map((day) => day.label), revenueDays.map((day) => day.value));

  const statuses = Object.keys(STATUS_LABELS)
    .map((status) => ({
      label: getStatusLabel(status),
      value: dashboardOrders.filter((order) => order.status === status).length
    }))
    .filter((item) => item.value > 0);
  drawDonutChart($("#order-status-chart"), statuses, $("#order-status-legend"));

  const categorySales = getCategorySales();
  drawBarChart($("#category-sales-chart"), categorySales.map((item) => item.label), categorySales.map((item) => item.value));
}

async function fetchJSON(path, fallback = []) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.warn("Không tải được dữ liệu admin:", path, error);
    return fallback;
  }
}

function showToast(message, type = "success") {
  let toast = $("#admin-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "admin-toast";
    document.body.appendChild(toast);
  }
  toast.className = `admin-toast admin-toast--${type} is-visible`;
  toast.textContent = message;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function ensureModal() {
  let modal = $("#admin-modal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "admin-modal";
  modal.className = "admin-modal";
  modal.innerHTML = `
    <div class="admin-modal__overlay" data-close-modal></div>
    <section class="admin-modal__panel" role="dialog" aria-modal="true">
      <button type="button" class="admin-modal__close" data-close-modal aria-label="Đóng">×</button>
      <h3 id="admin-modal-title"></h3>
      <div class="admin-modal__body"></div>
    </section>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeModal();
  });
  return modal;
}

function openModal(title, body) {
  const modal = ensureModal();
  $("#admin-modal-title", modal).textContent = title;
  $(".admin-modal__body", modal).innerHTML = body;
  modal.classList.add("is-open");
}

function closeModal() {
  $("#admin-modal")?.classList.remove("is-open");
}

function kvRows(rows) {
  return `<div class="admin-kv">${rows.map(([label, value]) => `
    <div class="admin-kv__row"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>
  `).join("")}</div>`;
}

function mergeById(primary = [], secondary = []) {
  const map = new Map();
  [...secondary, ...primary].forEach((item) => {
    if (item?.id) map.set(item.id, { ...(map.get(item.id) || {}), ...item });
  });
  return [...map.values()];
}

function persistOrderStatus(order) {
  const localOrders = getOrders();
  const exists = localOrders.some((item) => item.id === order.id);
  const next = exists
    ? localOrders.map((item) => (item.id === order.id ? { ...item, ...order } : item))
    : [{ ...order }, ...localOrders];
  setOrders(next);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseNutrition(form) {
  const nutrition = {
    calories: Number(form.get("calories") || 0),
    protein: Number(form.get("protein") || 0),
    carbs: Number(form.get("carbs") || 0),
    fat: Number(form.get("fat") || 0)
  };
  return Object.fromEntries(Object.entries(nutrition).filter(([, value]) => value > 0));
}

function readImageFile(file) {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith("image/")) {
      resolve("");
      return;
    }
    if (file.size > 900 * 1024) {
      showToast("Ảnh quá lớn. Vui lòng chọn ảnh dưới 900KB.", "error");
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function productForm(product = {}) {
  const category = product.categoryId || product.category || "vegetables";
  const nutrition = product.nutrition || {};
  return `
    <form class="admin-form" data-admin-form="product" data-id="${escapeHTML(product.id || "")}">
      <div class="admin-form-grid">
        <label><span>Tên sản phẩm</span><input name="name" value="${escapeHTML(product.name || "")}" required></label>
        <label><span>Thương hiệu</span><input name="brand" value="${escapeHTML(product.brand || "FreshMart")}"></label>
        <label><span>Danh mục</span>
          <select name="categoryId">
            ${["vegetables", "fruits", "meat", "seafood", "dairy-eggs", "beverages", "rice-grains", "noodles", "condiments", "frozen", "nutrition"].map((item) => `<option value="${item}" ${category === item ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </label>
        <label><span>Danh mục hiển thị</span><input name="categoryName" value="${escapeHTML(product.categoryName || product.category || "")}" placeholder="Ví dụ: Rau - Củ"></label>
        <label><span>Giá</span><input name="price" type="number" min="0" value="${Number(product.price || 0)}" required></label>
        <label><span>Giá sale</span><input name="salePrice" type="number" min="0" value="${Number(product.salePrice || product.sale_price || 0)}"></label>
        <label><span>Tồn kho</span><input name="stock" type="number" min="0" value="${Number(product.stock || 0)}"></label>
        <label><span>Đơn vị</span><input name="unit" value="${escapeHTML(product.unit || "gói")}"></label>
        <label class="admin-form-full"><span>URL ảnh</span><input name="imageUrl" value="${escapeHTML(getProductImage(product))}" placeholder="https://..."></label>
        <label class="admin-form-full"><span>Upload ảnh</span><input name="imageFile" type="file" accept="image/*"></label>
        <label class="admin-form-full"><span>Mô tả</span><textarea name="description" rows="3">${escapeHTML(product.description || "")}</textarea></label>
        <label><span>Calories</span><input name="calories" type="number" min="0" value="${Number(nutrition.calories || 0)}"></label>
        <label><span>Protein (g)</span><input name="protein" type="number" min="0" value="${Number(nutrition.protein || 0)}"></label>
        <label><span>Carbs (g)</span><input name="carbs" type="number" min="0" value="${Number(nutrition.carbs || 0)}"></label>
        <label><span>Fat (g)</span><input name="fat" type="number" min="0" value="${Number(nutrition.fat || 0)}"></label>
      </div>
      <div class="admin-form-actions">
        <button class="btn btn--outline" type="button" data-close-modal>Hủy</button>
        <button class="btn btn--primary" type="submit">Xác nhận</button>
      </div>
    </form>
  `;
}

function voucherForm(voucher = {}) {
  return `
    <form class="admin-form" data-admin-form="voucher" data-id="${escapeHTML(voucher.id || "")}">
      <div class="admin-form-grid">
        <label><span>Mã voucher</span><input name="code" value="${escapeHTML(voucher.code || "")}" required></label>
        <label><span>Tiêu đề</span><input name="title" value="${escapeHTML(voucher.title || "")}" required></label>
        <label><span>Loại giảm</span>
          <select name="discountType">
            <option value="percent" ${voucher.discountType !== "fixed" ? "selected" : ""}>Phần trăm</option>
            <option value="fixed" ${voucher.discountType === "fixed" ? "selected" : ""}>Số tiền</option>
          </select>
        </label>
        <label><span>Giá trị</span><input name="discountValue" type="number" min="0" value="${Number(voucher.discountValue || 0)}" required></label>
        <label><span>Đơn tối thiểu</span><input name="minOrderValue" type="number" min="0" value="${Number(voucher.minOrderValue || voucher.minOrder || 0)}"></label>
        <label><span>Giảm tối đa</span><input name="maxDiscountValue" type="number" min="0" value="${Number(voucher.maxDiscountValue || 0)}"></label>
        <label><span>Nhóm</span>
          <select name="category">
            <option value="product" ${voucher.category !== "shipping" ? "selected" : ""}>Sản phẩm</option>
            <option value="shipping" ${voucher.category === "shipping" ? "selected" : ""}>Freeship</option>
          </select>
        </label>
        <label><span>Hạn dùng</span><input name="endDate" type="date" value="${escapeHTML((voucher.endDate || voucher.expiresAt || "").slice(0, 10))}"></label>
        <label class="admin-form-full"><span>Mô tả</span><textarea name="description" rows="3">${escapeHTML(voucher.description || "")}</textarea></label>
      </div>
      <div class="admin-form-actions">
        <button class="btn btn--outline" type="button" data-close-modal>Hủy</button>
        <button class="btn btn--primary" type="submit">Xác nhận</button>
      </div>
    </form>
  `;
}

async function saveProductFromForm(form) {
  const data = new FormData(form);
  const id = form.dataset.id || `admin-${Date.now()}`;
  const existing = state.products.find((item) => item.id === id) || {};
  const name = String(data.get("name") || "").trim();
  const categoryId = String(data.get("categoryId") || "vegetables");
  const uploadedImage = await readImageFile(data.get("imageFile"));
  const imageUrl = uploadedImage || String(data.get("imageUrl") || "").trim();
  const product = {
    ...existing,
    id,
    name,
    slug: existing.slug || slugify(name) || id,
    brand: String(data.get("brand") || "FreshMart").trim(),
    categoryId,
    category: categoryId,
    categoryName: String(data.get("categoryName") || categoryId).trim(),
    price: Number(data.get("price") || 0),
    salePrice: Number(data.get("salePrice") || 0),
    sale_price: Number(data.get("salePrice") || 0),
    stock: Number(data.get("stock") || 0),
    unit: String(data.get("unit") || "").trim(),
    imageUrl,
    image_url: imageUrl,
    description: String(data.get("description") || "").trim(),
    nutrition: parseNutrition(data),
    isActive: true,
    active: true,
    updatedAt: new Date().toISOString(),
    createdAt: existing.createdAt || new Date().toISOString()
  };
  upsertAdminProduct(product);
  const index = state.products.findIndex((item) => item.id === id);
  state.products = index >= 0
    ? state.products.map((item) => (item.id === id ? product : item))
    : [product, ...state.products];
  renderAll();
  closeModal();
  showToast("Đã lưu sản phẩm");
}

function saveVoucherFromForm(form) {
  const data = new FormData(form);
  const code = String(data.get("code") || "").trim().toUpperCase();
  const id = form.dataset.id || `admin-voucher-${code || Date.now()}`;
  const existing = state.vouchers.find((item) => item.id === id) || {};
  const voucher = {
    ...existing,
    id,
    code,
    title: String(data.get("title") || "").trim(),
    description: String(data.get("description") || "").trim(),
    discountType: String(data.get("discountType") || "percent"),
    discountValue: Number(data.get("discountValue") || 0),
    minOrderValue: Number(data.get("minOrderValue") || 0),
    minOrder: Number(data.get("minOrderValue") || 0),
    maxDiscountValue: Number(data.get("maxDiscountValue") || 0),
    category: String(data.get("category") || "product"),
    endDate: String(data.get("endDate") || ""),
    isActive: true,
    updatedAt: new Date().toISOString(),
    createdAt: existing.createdAt || new Date().toISOString()
  };
  upsertAdminVoucher(voucher);
  const index = state.vouchers.findIndex((item) => item.id === id);
  state.vouchers = index >= 0
    ? state.vouchers.map((item) => (item.id === id ? voucher : item))
    : [voucher, ...state.vouchers];
  renderAll();
  closeModal();
  showToast("Đã lưu voucher");
}

function renderDashboard() {
  const dashboardOrders = getDashboardOrders();
  const pendingOrders = dashboardOrders.filter((order) => ["pending", "processing"].includes(order.status));
  const revenue = dashboardOrders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  setText("products-count", state.products.length);
  setText("orders-count", state.liveOrders.length ? pendingOrders.length : state.orders.filter((order) => ["pending", "processing"].includes(order.status)).length);
  setText("stat-revenue", formatCurrency(revenue));
  setText("stat-orders", pendingOrders.length);
  setText("stat-products", state.products.length);
  setText("stat-users", state.users.length);
  setText("stat-revenue-scope", state.liveOrders.length ? "Theo đơn khách đã mua" : "Dữ liệu mẫu khi chưa có đơn khách");
  setText("recent-orders-title", state.liveOrders.length ? "Đơn khách gần đây" : "Đơn hàng mẫu gần đây");
  renderDashboardCharts();

  const dashboardOrdersBody = $("#dashboard-orders-body");
  if (dashboardOrdersBody) {
    dashboardOrdersBody.innerHTML = getDashboardOrders().slice(0, 6).map((order) => `
      <tr>
        <td><strong>${escapeHTML(order.orderCode || order.id)}</strong></td>
        <td>${escapeHTML(order.customerName || order.shippingAddress?.fullName || "Khách hàng")}</td>
        <td>${formatCurrency(order.total)}</td>
        <td><span class="badge badge--tag">${escapeHTML(getStatusLabel(order.status))}</span></td>
        <td>${escapeHTML(getOrderDate(order))}</td>
      </tr>
    `).join("") || renderEmpty(5, "Chưa có đơn hàng");
  }

  const topProducts = $("#top-products-body");
  if (topProducts) {
    topProducts.innerHTML = [...state.products]
      .sort((a, b) => Number(b.sold_count || 0) - Number(a.sold_count || 0))
      .slice(0, 6)
      .map((product) => `
        <tr>
          <td><strong>${escapeHTML(product.name)}</strong></td>
          <td>${escapeHTML(product.categoryName || product.category || "")}</td>
          <td>${Number(product.sold_count || 0)}</td>
          <td>${formatCurrency(getActivePrice(product))}</td>
        </tr>
      `).join("") || renderEmpty(4, "Chưa có sản phẩm");
  }
}

function renderProducts() {
  const body = $("#products-body");
  if (!body) return;
  body.innerHTML = state.products.slice(0, 80).map((product) => `
    <tr>
      <td><img src="${escapeHTML(getProductImage(product))}" alt="${escapeHTML(product.name)}" onerror="this.src='./assets/images/placeholder-product.svg'" /></td>
      <td><strong>${escapeHTML(product.name)}</strong><br><small>${escapeHTML(product.brand || "Bách Hóa Tươi")}</small></td>
      <td>${escapeHTML(product.categoryName || product.category || "")}</td>
      <td>${formatCurrency(getActivePrice(product))}</td>
      <td>${Number(product.stock || 0)}</td>
      <td><span class="badge badge--success">Đang bán</span></td>
      <td class="admin-actions">
        <button class="btn btn--ghost btn--sm" type="button" data-action="view-product" data-id="${escapeHTML(product.id)}">Xem</button>
        <button class="btn btn--ghost btn--sm" type="button" data-action="edit-product" data-id="${escapeHTML(product.id)}">Sửa</button>
        <button class="btn btn--ghost btn--sm" type="button" data-action="edit-stock" data-id="${escapeHTML(product.id)}">Kho</button>
        <button class="btn btn--ghost btn--sm" type="button" data-action="toggle-product" data-id="${escapeHTML(product.id)}">Tắt</button>
      </td>
    </tr>
  `).join("") || renderEmpty(7, "Chưa có sản phẩm");
}

function renderOrders() {
  const body = $("#orders-body");
  if (!body) return;
  body.innerHTML = state.orders.map((order) => `
    <tr>
      <td><strong>${escapeHTML(order.orderCode || order.id)}</strong></td>
      <td>${escapeHTML(order.customerName || order.shippingAddress?.fullName || "Khách hàng")}</td>
      <td>${escapeHTML(order.customerPhone || order.shippingAddress?.phone || "")}</td>
      <td>${formatCurrency(order.total)}</td>
      <td><span class="badge badge--tag">${escapeHTML(getStatusLabel(order.status))}</span></td>
      <td>${escapeHTML(order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán")}</td>
      <td>${escapeHTML(getOrderDate(order))}</td>
      <td class="admin-actions">
        <select class="admin-status-select" data-action="order-status" data-id="${escapeHTML(order.id)}">
          ${Object.keys(STATUS_LABELS).map((status) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${escapeHTML(getStatusLabel(status))}</option>`).join("")}
        </select>
        <button class="btn btn--ghost btn--sm" type="button" data-action="view-order" data-id="${escapeHTML(order.id)}">Chi tiết</button>
      </td>
    </tr>
  `).join("") || renderEmpty(8, "Chưa có đơn hàng");
}

function renderInventory() {
  const body = $("#inventory-body");
  if (!body) return;
  body.innerHTML = state.products.slice(0, 80).map((product) => {
    const stock = Number(product.stock || 0);
    return `
      <tr>
        <td><strong>${escapeHTML(product.name)}</strong></td>
        <td>${escapeHTML(product.categoryName || product.category || "")}</td>
        <td>${stock}</td>
        <td><span class="badge ${stock <= 10 ? "badge--sale" : "badge--success"}">${stock <= 10 ? "Sắp hết" : "Ổn định"}</span></td>
        <td>${Number(product.sold_count || 0)}</td>
        <td><button class="btn btn--ghost btn--sm" type="button" data-action="edit-stock" data-id="${escapeHTML(product.id)}">Cập nhật</button></td>
      </tr>
    `;
  }).join("") || renderEmpty(6, "Chưa có tồn kho");
}

function renderVouchers() {
  const body = $("#vouchers-body");
  if (!body) return;
  body.innerHTML = state.vouchers.map((voucher) => `
    <tr>
      <td><strong>${escapeHTML(voucher.code)}</strong></td>
      <td>${escapeHTML(voucher.title || voucher.description || "")}</td>
      <td>${voucher.discountType === "percent" ? `${voucher.discountValue}%` : formatCurrency(voucher.discountValue)}</td>
      <td>${formatCurrency(voucher.minOrder ?? voucher.minOrderValue ?? 0)}</td>
      <td><span class="badge ${voucher.isActive === false ? "badge--sale" : "badge--success"}">${voucher.isActive === false ? "Tạm tắt" : "Hoạt động"}</span></td>
      <td>${escapeHTML((voucher.expiresAt || voucher.endDate || "").slice(0, 10) || "Chưa có")}</td>
      <td class="admin-actions">
        <button class="btn btn--ghost btn--sm" type="button" data-action="edit-voucher" data-id="${escapeHTML(voucher.id)}">Sửa</button>
        <button class="btn btn--ghost btn--sm" type="button" data-action="toggle-voucher" data-id="${escapeHTML(voucher.id)}">${voucher.isActive === false ? "Bật" : "Tắt"}</button>
      </td>
    </tr>
  `).join("") || renderEmpty(7, "Chưa có voucher");
}

function renderUsers() {
  const body = $("#users-body");
  if (!body) return;
  body.innerHTML = state.users.map((user) => `
    <tr>
      <td><strong>${escapeHTML(user.fullName || user.name || user.username || "Người dùng")}</strong></td>
      <td>${escapeHTML(user.email || "")}</td>
      <td>${escapeHTML(user.phone || "")}</td>
      <td><span class="badge badge--tag">${escapeHTML(user.role || "customer")}</span></td>
      <td>${escapeHTML((user.createdAt || "").slice(0, 10) || "Chưa có")}</td>
      <td><button class="btn btn--ghost btn--sm" type="button" data-action="view-user" data-id="${escapeHTML(user.id || user.email)}">Xem</button></td>
    </tr>
  `).join("") || renderEmpty(6, "Chưa có người dùng");
}

function renderStaticTables() {
  const bannersBody = $("#banners-body");
  if (bannersBody) {
    bannersBody.innerHTML = `
      <tr>
        <td><strong>Hero trang chủ</strong></td>
        <td>Homepage</td>
        <td><span class="badge badge--success">Hoạt động</span></td>
        <td>2026-01-01</td>
        <td>2026-12-31</td>
        <td><button class="btn btn--ghost btn--sm" type="button" data-action="view-banner">Xem</button></td>
      </tr>
    `;
  }

  const supportBody = $("#support-body");
  if (supportBody) {
    supportBody.innerHTML = renderEmpty(6, "Chưa có yêu cầu hỗ trợ");
  }
}

function renderAll() {
  renderDashboard();
  renderProducts();
  renderOrders();
  renderInventory();
  renderVouchers();
  renderUsers();
  renderStaticTables();
}

function switchTab(tabName) {
  $$(".admin-nav__item").forEach((item) => item.classList.toggle("is-active", item.dataset.tab === tabName));
  $$(".admin-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === tabName));
  const activeItem = $(`.admin-nav__item[data-tab="${tabName}"] span:nth-child(2)`);
  setText("admin-page-title", activeItem?.textContent?.trim() || "Dashboard");
  $("#admin-sidebar")?.classList.remove("is-open");
}

function handleAction(action, id, target) {
  if (action === "add-product") {
    openModal("Thêm sản phẩm", productForm());
  }

  if (action === "view-product") {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    openModal("Chi tiết sản phẩm", kvRows([
      ["Tên", product.name],
      ["Thương hiệu", product.brand || "Bách Hóa Tươi"],
      ["Danh mục", product.categoryName || product.category],
      ["Giá", formatCurrency(getActivePrice(product))],
      ["Tồn kho", product.stock || 0]
    ]));
  }

  if (action === "edit-product") {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    openModal("Sửa sản phẩm", productForm(product));
  }

  if (action === "toggle-product") {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    const nextProduct = { ...product, isActive: false, active: false, updatedAt: new Date().toISOString() };
    upsertAdminProduct(nextProduct);
    state.products = state.products.filter((item) => item.id !== id);
    renderAll();
    showToast("Đã tắt sản phẩm trên shop");
  }

  if (action === "edit-stock") {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    openModal("Cập nhật tồn kho", productForm(product));
  }

  if (action === "order-status") {
    const order = state.orders.find((item) => item.id === id);
    if (!order) return;
    order.status = target.value;
    order.updatedAt = new Date().toISOString();
    persistOrderStatus(order);
    state.liveOrders = sortOrdersByDateDesc(getOrders());
    state.orders = sortOrdersByDateDesc(state.orders);
    renderOrders();
    renderDashboard();
    showToast("Đã cập nhật trạng thái đơn");
  }

  if (action === "view-order") {
    const order = state.orders.find((item) => item.id === id);
    if (!order) return;
    openModal("Chi tiết đơn hàng", kvRows([
      ["Mã đơn", order.orderCode || order.id],
      ["Khách hàng", order.customerName || order.shippingAddress?.fullName || "Khách hàng"],
      ["Số điện thoại", order.customerPhone || order.shippingAddress?.phone || ""],
      ["Tổng tiền", formatCurrency(order.total)],
      ["Trạng thái", getStatusLabel(order.status)]
    ]));
  }

  if (action === "toggle-voucher") {
    const voucher = state.vouchers.find((item) => item.id === id);
    if (!voucher) return;
    voucher.isActive = voucher.isActive === false;
    upsertAdminVoucher({ ...voucher, updatedAt: new Date().toISOString() });
    renderVouchers();
    showToast(voucher.isActive ? "Đã bật voucher" : "Đã tắt voucher");
  }

  if (action === "add-voucher") {
    openModal("Thêm voucher", voucherForm());
  }

  if (action === "edit-voucher") {
    const voucher = state.vouchers.find((item) => item.id === id);
    if (!voucher) return;
    openModal("Sửa voucher", voucherForm(voucher));
  }

  if (action === "view-user") {
    const user = state.users.find((item) => String(item.id || item.email) === id);
    if (!user) return;
    openModal("Thông tin người dùng", kvRows([
      ["Họ tên", user.fullName || user.name || user.username || "Người dùng"],
      ["Email", user.email],
      ["Số điện thoại", user.phone],
      ["Vai trò", user.role || "customer"],
      ["Ngày tạo", (user.createdAt || "").slice(0, 10) || "Chưa có"]
    ]));
  }

  if (action === "view-banner") {
    openModal("Banner", "<p>Banner trang chủ đang hoạt động. Nội dung được quản lý trực tiếp trong layout homepage.</p>");
  }

  if (action === "view-support") {
    openModal("Hỗ trợ khách hàng", "<p>Chưa có yêu cầu hỗ trợ mới.</p>");
  }
}

function bindAdminEvents() {
  $$(".admin-nav__item[data-tab], .section-header [data-tab]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      switchTab(item.dataset.tab);
    });
  });

  document.addEventListener("click", (event) => {
    const tabLink = event.target.closest("[data-tab]");
    if (tabLink && (tabLink.matches(".admin-nav__item") || tabLink.closest(".section-header"))) {
      event.preventDefault();
      switchTab(tabLink.dataset.tab);
      return;
    }

    const actionEl = event.target.closest("[data-action]");
    if (actionEl && actionEl.tagName !== "SELECT") {
      handleAction(actionEl.dataset.action, actionEl.dataset.id, actionEl);
    }
  });

  document.addEventListener("change", (event) => {
    const actionEl = event.target.closest("[data-action]");
    if (actionEl) handleAction(actionEl.dataset.action, actionEl.dataset.id, actionEl);
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-admin-form]");
    if (!form) return;
    event.preventDefault();
    if (form.dataset.adminForm === "product") void saveProductFromForm(form);
    if (form.dataset.adminForm === "voucher") saveVoucherFromForm(form);
  });

  $("#sidebar-toggle")?.addEventListener("click", () => {
    $("#admin-sidebar")?.classList.toggle("is-collapsed");
  });

  $("#mobile-menu-btn")?.addEventListener("click", () => {
    $("#admin-sidebar")?.classList.toggle("is-open");
  });

  $("#logout-btn")?.addEventListener("click", () => {
    clearCurrentUser();
    showToast("Đã đăng xuất");
    window.setTimeout(() => { window.location.href = "./index.html"; }, 500);
  });

  window.addEventListener("hashchange", () => {
    const tabName = window.location.hash.replace("#", "");
    if (tabName) switchTab(tabName);
  });

  let chartResizeTimer = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(chartResizeTimer);
    chartResizeTimer = window.setTimeout(renderDashboardCharts, 120);
  });
}

async function initAdmin() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "./login.html?redirect=admin";
    return;
  }

  setText("admin-name", currentUser.fullName || "Admin");
  setText("admin-avatar", (currentUser.fullName || "A").charAt(0).toUpperCase());

  const [products, orders, vouchers, users] = await Promise.all([
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.orders),
    fetchJSON(DATA_PATHS.vouchers),
    fetchJSON(DATA_PATHS.users)
  ]);

  state.products = mergeAdminProducts(products || []).filter((product) => product.active !== false && product.isActive !== false);
  state.liveOrders = sortOrdersByDateDesc(getOrders());
  state.orders = sortOrdersByDateDesc(mergeById(state.liveOrders, orders || []));
  state.vouchers = mergeAdminVouchers(vouchers || []);
  state.users = users || [];

  renderAll();
  bindAdminEvents();

  const initialTab = window.location.hash.replace("#", "");
  if (initialTab) switchTab(initialTab);
}

document.addEventListener("DOMContentLoaded", initAdmin);
