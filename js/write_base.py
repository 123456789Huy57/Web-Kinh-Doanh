import sys
path = 'js/admin.js'

content = r"""/* ==============================================================
   Admin Panel JS — BÁCH HÓA TƯƠI
   SPA-style tab routing, data loading, sidebar navigation
   ============================================================= */

import { fetchJSON, formatCurrency, formatDate, escapeHTML, formatNumber } from "./utils.js";
import { getCurrentUser, getOrders, getStoredUsers } from "./storage.js";

const DATA_PATHS = {
  products: "./data/products.json",
  categories: "./data/categories.json",
  vouchers: "./data/vouchers.json",
  users: "./data/users.json",
  orders: "./data/orders.json"
};

const TABS = [
  "dashboard",
  "products",
  "orders",
  "inventory",
  "vouchers",
  "banners",
  "users",
  "support",
  "settings"
];

let state = {
  products: [],
  orders: [],
  users: [],
  vouchers: [],
  categories: []
};

/* DOM Elements */
const sidebar = document.getElementById("admin-sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const logoutBtn = document.getElementById("logout-btn");
const adminAvatar = document.getElementById("admin-avatar");
const adminName = document.getElementById("admin-name");
const pageTitle = document.getElementById("admin-page-title");
const contentArea = document.getElementById("admin-content");

/* Auth Guard */
function checkAdminAuth() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    window.location.href = "./login.html";
    return false;
  }
  return true;
}

/* Initialize */
async function init() {
  if (!checkAdminAuth()) return;

  await loadAllData();
  setupSidebar();
  setupMobileMenu();
  setupLogout();
  renderUserInfo();
  handleHashChange();
  window.addEventListener("hashchange", handleHashChange);

  setupProductModal();
  setupVoucherModal();
  setupOrderActions();
  setupUserActions();
  setupSettings();
}

/* Data Loading */
async function loadAllData() {
  try {
    const [productsRaw, categoriesRaw, vouchersRaw, usersRaw, ordersRaw] = await Promise.all([
      fetchJSON(DATA_PATHS.products),
      fetchJSON(DATA_PATHS.categories),
      fetchJSON(DATA_PATHS.vouchers),
      fetchJSON(DATA_PATHS.users),
      fetchJSON(DATA_PATHS.orders)
    ]);

    state.products = productsRaw;
    state.categories = categoriesRaw;
    state.vouchers = vouchersRaw;
    state.users = mergeUsers(usersRaw, getStoredUsers());
    state.orders = [...ordersRaw, ...getOrders()].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    updateSidebarBadges();
    renderDashboard();
    renderOrdersTable();
    renderProducts();
    renderInventory();
    renderVouchers();
    renderUsers();
    renderSupport();
  } catch (err) {
    console.error("Failed to load admin data:", err);
  }
}

function mergeUsers(seedUsers, storedUsers) {
  const map = new Map();
  for (const u of seedUsers) map.set(u.id, u);
  for (const u of storedUsers) map.set(u.id, u);
  return Array.from(map.values());
}

/* Sidebar Navigation */
function setupSidebar() {
  const navItems = document.querySelectorAll(".admin-nav__item[data-tab]");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      activateTab(tab);
      history.pushState(null, "", `#${tab}`);
      if (window.innerWidth < 768) {
        sidebar.classList.remove("is-open");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
      }
    });
  });

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    const isCollapsed = sidebar.classList.contains("collapsed");
    sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  });
}

function setupMobileMenu() {
  mobileMenuBtn.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("is-open");
    mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (window.innerWidth < 768 &&
        !sidebar.contains(e.target) &&
        !mobileMenuBtn.contains(e.target) &&
        sidebar.classList.contains("is-open")) {
      sidebar.classList.remove("is-open");
      mobileMenuBtn.setAttribute("aria-expanded", "false");
    }
  });
}

function activateTab(tabName) {
  if (!TABS.includes(tabName)) tabName = "dashboard";

  document.querySelectorAll(".admin-nav__item").forEach(item => {
    item.classList.toggle("is-active", item.dataset.tab === tabName);
  });

  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.classList.toggle("is-active", tab.dataset.tab === tabName);
  });

  const tabLabels = {
    dashboard: "Dashboard",
    products: "Sản phẩm",
    orders: "Đơn hàng",
    inventory: "Tồn kho",
    vouchers: "Voucher",
    banners: "Banner",
    users: "Người dùng",
    support: "Hỗ trợ",
    settings: "Cài đặt"
  };
  pageTitle.textContent = tabLabels[tabName] || "Dashboard";

  if (tabName === "dashboard") renderDashboard();
  if (tabName === "orders") renderOrdersTable();
  if (tabName === "products") renderProducts();
  if (tabName === "inventory") renderInventory();
  if (tabName === "vouchers") renderVouchers();
  if (tabName === "users") renderUsers();
  if (tabName === "support") renderSupport();
}

function handleHashChange() {
  const hash = window.location.hash.slice(1) || "dashboard";
  activateTab(hash);
}

function updateSidebarBadges() {
  const productsCount = document.getElementById("products-count");
  const ordersCount = document.getElementById("orders-count");
  if (productsCount) productsCount.textContent = state.products.length;
  if (ordersCount) {
    const pendingOrders = state.orders.filter(o =>
      ["pending", "preparing", "confirmed"].includes(o.status)
    ).length;
    ordersCount.textContent = pendingOrders;
  }
}

/* User Info */
function renderUserInfo() {
  const user = getCurrentUser();
  if (user) {
    adminName.textContent = user.fullName || "Admin";
    adminAvatar.textContent = (user.fullName || "A").charAt(0).toUpperCase();
  }
}

/* Logout */
function setupLogout() {
  logoutBtn.addEventListener("click", () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      localStorage.removeItem("aic_current_user");
      window.location.href = "./login.html";
    }
  });
}
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Base written, lines:', content.count('\n'))
sys.stdout.flush()
