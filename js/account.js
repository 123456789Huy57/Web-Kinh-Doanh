import { fetchJSON, formatCurrency, formatDate, generateId, escapeHTML, renderBreadcrumb, createBreadcrumbItems, formatNumber } from "./utils.js";
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  getStoredUsers,
  setStoredUsers,
  upsertStoredUser,
  getOrders,
  getWishlist,
  setWishlist,
  toggleWishlist,
  getActiveCart,
  setActiveCart,
  getLoyaltyData,
  getLoyaltyTierInfo,
  getAllLoyaltyTiers
} from "./storage.js";
import { renderProductCard, showToast } from "./main.js";

const DATA_PATHS = {
  users: "./data/users.json",
  orders: "./data/orders.json",
  products: "./data/products.json"
};

let accountState = {
  users: [],
  orders: [],
  products: []
};

function mergeUsers(seedUsers, localUsers) {
  const map = new Map();
  [...seedUsers, ...localUsers].forEach((user) => map.set(user.id, user));
  return [...map.values()];
}

function getUserByIdentity(identity, password) {
  const normalized = String(identity || "").trim().toLowerCase();
  return accountState.users.find((user) => {
    const matchesIdentity =
      user.email?.toLowerCase() === normalized || user.phone?.toLowerCase() === normalized;
    return matchesIdentity && user.password === password && user.isActive !== false;
  });
}

function renderLoginPage() {
  return `
    <div class="auth-card">
      <div class="auth-card__logo">
        <div class="auth-card__logo-icon">🛒</div>
        <h1 class="auth-card__title">Đăng nhập</h1>
        <p class="auth-card__subtitle">Chào mừng bạn quay lại Bách Hóa Tươi</p>
      </div>
      <form id="login-form" class="auth-form">
        <label class="form-field">
          <span>Email hoặc số điện thoại</span>
          <input name="identity" placeholder="email@example.com hoặc 0901234567" required />
        </label>
        <label class="form-field">
          <span>Mật khẩu</span>
          <input name="password" type="password" placeholder="Nhập mật khẩu" required />
        </label>
        <button class="btn btn--primary btn--block btn--lg" type="submit">Đăng nhập</button>
      </form>
      <p id="auth-message" style="text-align:center;margin-top:12px;font-weight:600;"></p>
      <div class="auth-footer">
        Chưa có tài khoản? <a href="./register.html">Đăng ký ngay</a>
      </div>
    </div>
  `;
}

function renderRegisterPage() {
  return `
    <div class="auth-card">
      <div class="auth-card__logo">
        <div class="auth-card__logo-icon">🛒</div>
        <h1 class="auth-card__title">Tạo tài khoản</h1>
        <p class="auth-card__subtitle">Đăng ký để mua sắm tại Bách Hóa Tươi</p>
      </div>
      <form id="register-form" class="auth-form">
        <label class="form-field">
          <span>Họ và tên</span>
          <input name="fullName" placeholder="Nguyễn Văn A" required />
        </label>
        <label class="form-field">
          <span>Email</span>
          <input name="email" type="email" placeholder="email@example.com" required />
        </label>
        <label class="form-field">
          <span>Số điện thoại</span>
          <input name="phone" placeholder="0901234567" required />
        </label>
        <label class="form-field">
          <span>Mật khẩu</span>
          <input name="password" type="password" placeholder="Tối thiểu 6 ký tự" required />
        </label>
        <button class="btn btn--primary btn--block btn--lg" type="submit">Tạo tài khoản</button>
      </form>
      <p id="auth-message" style="text-align:center;margin-top:12px;font-weight:600;"></p>
      <div class="auth-footer">
        Đã có tài khoản? <a href="./login.html">Đăng nhập</a>
      </div>
    </div>
  `;
}

function renderLoyaltyCard(currentUser) {
  const loyaltyData = getLoyaltyData();
  const allTiers = getAllLoyaltyTiers();
  const currentTierInfo = getLoyaltyTierInfo(loyaltyData.tier);
  const currentPoints = loyaltyData.points;

  /* Find next tier */
  const tierOrder = ["bronze", "silver", "gold", "diamond"];
  const currentTierIdx = tierOrder.indexOf(loyaltyData.tier);
  const nextTier = currentTierIdx < tierOrder.length - 1 ? tierOrder[currentTierIdx + 1] : null;
  const nextTierInfo = nextTier ? getLoyaltyTierInfo(nextTier) : null;

  /* Progress to next tier */
  let progressPct = 100;
  let progressText = "Đã đạt cấp cao nhất!";
  if (nextTierInfo) {
    const pointsNeeded = nextTierInfo.minPoints;
    const progress = Math.min(currentPoints / pointsNeeded, 1);
    progressPct = Math.round(progress * 100);
    progressText = `${formatNumber(currentPoints)} / ${formatNumber(pointsNeeded)} điểm đến ${nextTierInfo.name}`;
  }

  /* Tier badge colors */
  const tierColors = {
    bronze: "#cd7f32",
    silver: "#8c8c8c",
    gold: "#d4a843",
    diamond: "#4aa8c0"
  };
  const tierEmoji = {
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇",
    diamond: "💎"
  };
  const badgeColor = tierColors[loyaltyData.tier] || tierColors.bronze;
  const badgeEmoji = tierEmoji[loyaltyData.tier] || "🏅";

  /* Recent history (last 5) */
  const recentHistory = (loyaltyData.history || []).slice(0, 5);

  return `
    <div class="loyalty-card" id="loyalty-card">
      <div class="loyalty-card__header">
        <div class="loyalty-card__badge" style="background:${badgeColor};">
          <span class="loyalty-card__badge-icon">${badgeEmoji}</span>
          <span class="loyalty-card__badge-name">${currentTierInfo.name}</span>
        </div>
        <div class="loyalty-card__points">
          <span class="loyalty-card__points-value">${formatNumber(currentPoints)}</span>
          <span class="loyalty-card__points-label">điểm tích lũy</span>
        </div>
      </div>
      <div class="loyalty-card__progress">
        <div class="loyalty-card__progress-text">${progressText}</div>
        <div class="loyalty-card__progress-bar">
          <div class="loyalty-card__progress-fill" style="width:${progressPct}%;"></div>
        </div>
      </div>
      ${currentTierInfo.discount > 0 ? `<div class="loyalty-card__discount">Giảm ${currentTierInfo.discount}% cho thành viên ${currentTierInfo.name}</div>` : ""}
      ${recentHistory.length ? `
        <div class="loyalty-card__history">
          <div class="loyalty-card__history-title">Giao dịch gần đây</div>
          ${recentHistory.map((entry) => `
            <div class="loyalty-card__history-row">
              <span class="loyalty-card__history-desc">${escapeHTML(entry.description)}</span>
              <span class="loyalty-card__history-points ${entry.points > 0 ? "loyalty-card__history-points--positive" : "loyalty-card__history-points--negative"}">${entry.points > 0 ? "+" : ""}${formatNumber(entry.points)}</span>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function renderAccountPage() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return `
      ${renderBreadcrumb(createBreadcrumbItems({ pageType: "account" }))}
      <div style="text-align:center;padding:60px 20px;">
        <h1>Bạn chưa đăng nhập</h1>
        <p style="color:var(--color-muted);margin-bottom:24px;">Đăng nhập để xem thông tin tài khoản.</p>
        <a class="btn btn--primary btn--lg" href="./login.html">Đăng nhập</a>
      </div>
    `;
  }

  const userOrders = accountState.orders.filter((order) =>
    order.userId === currentUser.id ||
    order.customerEmail === currentUser.email ||
    order.customerPhone === currentUser.phone
  );
  const initial = (currentUser.fullName || "U").charAt(0).toUpperCase();

  return `
    ${renderBreadcrumb(createBreadcrumbItems({ pageType: "account" }))}
    <div class="account-layout">
      <div class="account-sidebar">
        <div class="account-profile">
          <div class="account-avatar">${initial}</div>
          <div class="account-name">${escapeHTML(currentUser.fullName)}</div>
          <div class="account-email">${escapeHTML(currentUser.email || currentUser.phone || "")}</div>
        </div>
        <nav class="account-nav">
          <a class="account-nav__link is-active" href="./account.html">
            <span class="account-nav__icon">👤</span> Thông tin cá nhân
          </a>
          <a class="account-nav__link" href="./orders.html">
            <span class="account-nav__icon">📦</span> Đơn hàng (${userOrders.length})
          </a>
          <a class="account-nav__link" href="./wishlist.html">
            <span class="account-nav__icon">❤️</span> Yêu thích
          </a>
          <a class="account-nav__link" href="./meal-planner.html">
            <span class="account-nav__icon">🍽️</span> Meal Planner
          </a>
          <a class="account-nav__link" href="#loyalty" onclick="event.preventDefault(); document.getElementById('loyalty-card')?.scrollIntoView({behavior:'smooth'});">
            <span class="account-nav__icon">🏅</span> Chương trình thành viên
          </a>
        </nav>
      </div>

      <div class="account-content">
        <h2 class="account-content__title">Thông tin cá nhân</h2>

        ${renderLoyaltyCard(currentUser)}

        <form id="profile-form" class="account-form">
          <label class="form-field">
            <span>Họ và tên</span>
            <input name="fullName" value="${escapeHTML(currentUser.fullName || "")}" required />
          </label>
          <label class="form-field">
            <span>Số điện thoại</span>
            <input name="phone" value="${escapeHTML(currentUser.phone || "")}" />
          </label>
          <label class="form-field">
            <span>Email</span>
            <input name="email" type="email" value="${escapeHTML(currentUser.email || "")}" />
          </label>
          <label class="form-field form-field--full">
            <span>Địa chỉ giao hàng</span>
            <textarea name="address" rows="3">${escapeHTML(currentUser.address || "")}</textarea>
          </label>
          <div class="form-field--full" style="display:flex;gap:12px;flex-wrap:wrap;">
            <button class="btn btn--primary" type="submit">Lưu thay đổi</button>
            <button class="btn btn--ghost" id="logout-btn" type="button">Đăng xuất</button>
          </div>
        </form>
        <p id="profile-message" style="margin-top:12px;font-weight:600;"></p>
      </div>
    </div>
  `;
}

function renderWishlistPage() {
  const wishlist = getWishlist();
  const wishlistedProducts = accountState.products.filter((p) =>
    wishlist.some((item) => item.productId === p.id)
  );

  return `
    ${renderBreadcrumb(createBreadcrumbItems({ pageType: "wishlist" }))}
    <div class="orders-header">
      <p style="color:var(--color-muted);">Lưu các món yêu thích để quay lại mua sau.</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      <button class="btn btn--ghost btn--sm" id="wishlist-clear-btn" type="button">Xóa tất cả</button>
      <a class="btn btn--primary btn--sm" href="./catalog.html">Mua thêm</a>
    </div>

    <div class="product-grid product-grid--4" id="wishlist-grid">
      ${wishlistedProducts.length ? wishlistedProducts.map((product) => `
        <div class="product-card">
          <a href="./product-detail.html?slug=${encodeURIComponent(product.slug)}" class="product-card__image-wrap">
            <img src="${product.imageUrl}" alt="${escapeHTML(product.name)}" />
          </a>
          <div class="product-card__body">
            <a href="./product-detail.html?slug=${encodeURIComponent(product.slug)}" class="product-card__name">${escapeHTML(product.name)}</a>
            <div class="product-card__brand">${escapeHTML(product.brand)}</div>
            <div class="price">
              <span class="price__current">${formatCurrency(product.salePrice || product.price)}</span>
              ${product.salePrice ? '<span class="price__original">' + formatCurrency(product.price) + "</span>" : ""}
            </div>
            <div class="product-card__actions" style="display:flex;gap:8px;margin-top:8px;">
              <button class="btn btn--primary btn--sm" data-action="move-to-cart" data-product-id="${product.id}" type="button">Thêm giỏ</button>
              <button class="btn btn--sale btn--sm" data-action="remove-wishlist" data-product-id="${product.id}" type="button">Xóa</button>
            </div>
          </div>
        </div>
      `).join("") : `
        <div style="grid-column:1/-1;text-align:center;padding:40px;">
          <p style="font-size:48px;margin-bottom:12px;">💚</p>
          <h2>Chưa có sản phẩm yêu thích</h2>
          <p style="color:var(--color-muted);">Nhấn biểu tượng trái tim trên sản phẩm để lưu lại.</p>
        </div>
      `}
    </div>
  `;
}

function attachLoginHandlers() {
  document.getElementById("login-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const user = getUserByIdentity(
      String(data.get("identity") || ""),
      String(data.get("password") || "")
    );
    const message = document.getElementById("auth-message");
    if (!user) {
      if (message) {
        message.textContent = "Email/SĐT hoặc mật khẩu không đúng.";
        message.style.color = "var(--color-sale)";
      }
      return;
    }
    user.lastLoginAt = new Date().toISOString();
    upsertStoredUser(user);
    setCurrentUser(user);
    showToast("Đăng nhập thành công!");
    window.location.href = "./account.html";
  });
}

function attachRegisterHandlers() {
  document.getElementById("register-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const phone = String(data.get("phone") || "").trim();
    const password = String(data.get("password") || "");
    const message = document.getElementById("auth-message");

    if (password.length < 6) {
      if (message) {
        message.textContent = "Mật khẩu phải có ít nhất 6 ký tự.";
        message.style.color = "var(--color-sale)";
      }
      return;
    }

    const duplicate = accountState.users.find((u) =>
      u.email?.toLowerCase() === email || u.phone === phone
    );
    if (duplicate) {
      if (message) {
        message.textContent = "Email hoặc số điện thoại đã tồn tại.";
        message.style.color = "var(--color-sale)";
      }
      return;
    }

    const newUser = {
      id: generateId("u"),
      fullName: String(data.get("fullName") || ""),
      email,
      phone,
      password,
      role: "customer",
      avatarUrl: "",
      address: "",
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const localUsers = getStoredUsers();
    setStoredUsers([...localUsers.filter((u) => u.id !== newUser.id), newUser]);
    setCurrentUser(newUser);
    showToast("Đăng ký thành công!");
    window.location.href = "./account.html";
  });
}

function attachAccountHandlers() {
  document.getElementById("profile-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const data = new FormData(event.currentTarget);
    const updatedUser = {
      ...currentUser,
      fullName: String(data.get("fullName") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      address: String(data.get("address") || "")
    };
    upsertStoredUser(updatedUser);
    setCurrentUser(updatedUser);
    const output = document.getElementById("profile-message");
    if (output) {
      output.textContent = "Đã lưu thay đổi!";
      output.style.color = "var(--color-primary)";
    }
    showToast("Cập nhật hồ sơ thành công");
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    clearCurrentUser();
    showToast("Đã đăng xuất");
    window.location.href = "./index.html";
  });
}

function attachWishlistHandlers() {
  document.getElementById("wishlist-clear-btn")?.addEventListener("click", () => {
    setWishlist([]);
    showToast("Đã xóa tất cả sản phẩm yêu thích");
    initWishlistPage();
  });

  document.getElementById("wishlist-grid")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const productId = button.dataset.productId;

    if (button.dataset.action === "remove-wishlist") {
      const items = getWishlist().filter((item) => item.productId !== productId);
      setWishlist(items);
      showToast("Đã xóa khỏi yêu thích");
      initWishlistPage();
    }

    if (button.dataset.action === "move-to-cart") {
      const cart = getActiveCart();
      cart.items = cart.items || [];
      const existing = cart.items.find((item) => item.productId === productId);
      if (existing) existing.quantity += 1;
      else cart.items.push({ productId, quantity: 1 });
      cart.updatedAt = new Date().toISOString();
      setActiveCart(cart);
      toggleWishlist(productId);
      showToast("Đã thêm vào giỏ hàng");
      initWishlistPage();
    }
  });
}

async function initLoginPage() {
  const seedUsersRaw = await fetchJSON(DATA_PATHS.users);
  accountState.users = mergeUsers(seedUsersRaw, getStoredUsers());
  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  container.innerHTML = renderLoginPage();
  attachLoginHandlers();
}

async function initRegisterPage() {
  const seedUsersRaw = await fetchJSON(DATA_PATHS.users);
  accountState.users = mergeUsers(seedUsersRaw, getStoredUsers());
  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  container.innerHTML = renderRegisterPage();
  attachRegisterHandlers();
}

async function initAccountPage() {
  const [seedUsersRaw, ordersRaw, productsRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.users),
    fetchJSON(DATA_PATHS.orders),
    fetchJSON(DATA_PATHS.products)
  ]);

  accountState.products = productsRaw.filter((p) => p.isActive !== false);
  accountState.orders = [...ordersRaw, ...getOrders()];
  accountState.users = mergeUsers(seedUsersRaw, getStoredUsers());

  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  container.innerHTML = renderAccountPage();
  attachAccountHandlers();
}

async function initWishlistPage() {
  const productsRaw = await fetchJSON(DATA_PATHS.products);
  accountState.products = productsRaw.filter((p) => p.isActive !== false);
  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  container.innerHTML = renderWishlistPage();
  attachWishlistHandlers();
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "account") initAccountPage();
  if (page === "login") initLoginPage();
  if (page === "register") initRegisterPage();
  if (page === "wishlist") initWishlistPage();
});

export { initAccountPage, initLoginPage, initRegisterPage, initWishlistPage };
