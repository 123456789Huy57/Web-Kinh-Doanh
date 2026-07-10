import { fetchJSON, formatCurrency, formatDate, generateId, escapeHTML, renderBreadcrumb, createBreadcrumbItems, formatNumber, getQueryParam, normalizeRedirectTarget } from "./utils.js";
import { getCurrentUser, setCurrentUser, clearCurrentUser, getStoredUsers, setStoredUsers, upsertStoredUser, getOrders, getWishlist, setWishlist, toggleWishlist, getActiveCart, setActiveCart, getLoyaltyData, getLoyaltyTierInfo, getAllLoyaltyTiers, isWishlisted, saveVoucher, isVoucherSaved, getSavedVouchers, removeSavedVoucher, mergeAdminProducts, mergeAdminVouchers, getMealPlans } from "./storage.js";
import { renderProductCard, showToast, getProductImage, getProductSalePrice, isProductActive } from "./main.js";

const DATA_PATHS = {
  users: "./data/users.json",
  orders: "./data/orders.json",
  products: "./data/products.json",

  vouchers: "./data/vouchers.json"
};

let accountState = {
  users: [],
  orders: [],
  products: [],

  vouchers: []
};

let pendingPasswordOtp = null;

function mergeOrders(primary = [], secondary = []) {
  const map = new Map();
  [...secondary, ...primary].forEach((order) => {
    if (order?.id) map.set(order.id, { ...(map.get(order.id) || {}), ...order });
  });
  return [...map.values()];
}

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
        <h1 class="auth-card__title">Chào mừng trở lại</h1>
        <p class="auth-card__subtitle">Đăng nhập để tiếp tục mua sắm tại Bách Hóa Tươi</p>
      </div>

      <div class="social-login">
        <button class="btn btn--outline btn--block btn--lg" type="button" disabled aria-disabled="true">
          <span class="social-login__icon">G</span>
          Google sắp hỗ trợ
        </button>
        <button class="btn btn--outline btn--block btn--lg" type="button" disabled aria-disabled="true">
          <span class="social-login__icon">f</span>
          Facebook sắp hỗ trợ
        </button>
      </div>

      <div class="divider">
        <span>hoặc</span>
      </div>

      <form id="login-form" class="auth-form">
        <label class="form-field">
          <span>Email hoặc số điện thoại</span>
          <input name="identity" type="text" placeholder="email@example.com hoặc 0901234567" required autocomplete="username" />
        </label>

        <label class="form-field">
          <span>Mật khẩu</span>
          <div class="password-input-wrapper">
            <input name="password" type="password" placeholder="Nhập mật khẩu" required autocomplete="current-password" />
            <button type="button" class="password-toggle" aria-label="Hiển thị mật khẩu">
              <span class="password-toggle__icon">👁️</span>
            </button>
          </div>
        </label>

        <div class="form-options">
          <label class="checkbox-wrapper">
            <input type="checkbox" name="remember" />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <a href="#forgot-password-panel" class="forgot-password">Quên mật khẩu?</a>
        </div>

        <button class="btn btn--primary btn--block btn--lg" type="submit" id="login-btn">
          <span>Đăng nhập</span>
          <span class="loading-spinner" style="display:none;">⏳</span>
        </button>
      </form>

      <p id="auth-message" class="auth-message" style="display:none;"></p>

      <div class="auth-footer">
        <p>Chưa có tài khoản? <a href="./register.html${getQueryParam("redirect") ? "?redirect=" + encodeURIComponent(getQueryParam("redirect")) : ""}" class="auth-link">Đăng ký ngay</a></p>
        <p class="auth-footer__extra">Bằng việc đăng nhập, bạn đồng ý với <a href="./guide.html" class="auth-link">Điều khoản dịch vụ</a> và <a href="./privacy-policy.html" class="auth-link">Chính sách bảo mật</a></p>
      </div>
    </div>
  `;
}

function renderRegisterPage() {
  return `
    <div class="auth-card">
      <div class="auth-card__logo">
        <h1 class="auth-card__title">Tạo tài khoản mới</h1>
        <p class="auth-card__subtitle">Tham gia Bách Hóa Tươi để mua sắm thông minh hơn</p>
      </div>

      <form id="register-form" class="auth-form">
        <div class="form-row">
          <label class="form-field">
            <span>Họ của bạn</span>
            <input name="firstName" placeholder="Nguyễn" required />
          </label>
          <label class="form-field">
            <span>Tên của bạn</span>
            <input name="lastName" placeholder="Văn A" required />
          </label>
        </div>

        <label class="form-field">
          <span>Email</span>
          <input name="email" type="email" placeholder="email@example.com" required autocomplete="email" />
        </label>

        <label class="form-field">
          <span>Số điện thoại</span>
          <input name="phone" type="tel" placeholder="0901 234 567" required autocomplete="tel" />
        </label>

        <label class="form-field">
          <span>Mật khẩu</span>
          <div class="password-input-wrapper">
            <input name="password" type="password" placeholder="Tối thiểu 6 ký tự" required autocomplete="new-password" />
            <button type="button" class="password-toggle" aria-label="Hiển thị mật khẩu">
              <span class="password-toggle__icon">👁️</span>
            </button>
          </div>
          <div class="password-strength" id="password-strength">
            <div class="password-strength__bar"></div>
          </div>
        </label>

        <label class="checkbox-wrapper">
          <input type="checkbox" name="agreed" required />
          <span>Tôi đồng ý với <a href="./guide.html" class="auth-link">Điều khoản dịch vụ</a> và <a href="./privacy-policy.html" class="auth-link">Chính sách bảo mật</a></span>
        </label>

        <button class="btn btn--primary btn--block btn--lg" type="submit" id="register-btn">
          <span>Tạo tài khoản</span>
          <span class="loading-spinner" style="display:none;">⏳</span>
        </button>
      </form>

      <p id="auth-message" class="auth-message" style="display:none;"></p>

      <div class="auth-footer">
        <p>Đã có tài khoản? <a href="./login.html${getQueryParam("redirect") ? "?redirect=" + encodeURIComponent(getQueryParam("redirect")) : ""}" class="auth-link">Đăng nhập</a></p>
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
    bronze: "Đồng",
    silver: "Bạc",
    gold: "Vàng",
    diamond: "Kim cương"
  };
  const badgeColor = tierColors[loyaltyData.tier] || tierColors.bronze;
  const badgeEmoji = tierEmoji[loyaltyData.tier] || "Thành viên";

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
          <span class="loyalty-card__points-label">Điểm tích lũy</span>
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
  const activeTab = window.location.hash.slice(1) || "profile";
  const savedVoucherIds = getSavedVouchers().map(v => v.voucherId);
  const displayVouchers = accountState.vouchers.filter(v => savedVoucherIds.includes(v.id));
  const mealPlans = getMealPlans();

  const voucherTabContent = activeTab === "vouchers" ? `
    <div id="voucher-vault">
      <h2 class="account-content__title">🎫 Kho voucher của tôi</h2>
      <p style="color:var(--color-muted);margin-bottom:20px;">Chọn voucher và dùng khi thanh toán — không cần sao chép mã.</p>
      ${displayVouchers.length > 0 ? displayVouchers.map(v => {
        const discountLabel = v.discountType === "percent"
          ? `${v.discountValue}%`
          : formatCurrency(v.discountValue);
        const categoryLabel = v.category === "shipping" ? "Giảm ship" : "Giảm sản phẩm";
        return `
          <div class="vault-voucher-card" data-voucher-id="${v.id}">
            <div class="vault-voucher-discount">
              <span class="vault-voucher-amount">${discountLabel}</span>
              <span class="vault-voucher-min">${v.minOrderValue ? 'Đơn tối thiểu ' + formatCurrency(v.minOrderValue) : ''}</span>
            </div>
            <div class="vault-voucher-info">
              <span class="vault-voucher-code">${escapeHTML(v.code)}</span>
              <span class="vault-voucher-desc">${escapeHTML(categoryLabel)}</span>
              <span class="vault-voucher-desc">${escapeHTML(v.description || v.title)}</span>
              <span class="vault-voucher-expiry">${v.endDate ? 'HSD: ' + formatDate(v.endDate) : ''}</span>
            </div>
            <div class="vault-voucher-action">
              <button class="btn btn--sale btn--sm" data-action="remove-voucher" data-voucher-id="${v.id}" type="button">Xóa khỏi kho</button>
            </div>
          </div>
        `;
      }).join("") : `
        <div style="text-align:center;padding:40px;background:var(--color-surface-alt);border-radius:var(--radius-lg);">
          <p style="font-size:40px;margin-bottom:8px;">🏷️</p>
          <h3 style="margin-bottom:8px;">Kho voucher đang trống</h3>
          <p style="color:var(--color-muted);margin-bottom:16px;">Vào trang chủ để lưu voucher bạn nhé!</p>
          <a class="btn btn--primary" href="./index.html">Khám phá voucher</a>
        </div>
      `}
    </div>
  ` : "";

  const mealPlansTabContent = activeTab === "meal-plans" ? `
    <div id="account-meal-plans">
      <h2 class="account-content__title">Meal da plan (${mealPlans.length})</h2>
      <p class="account-content__desc">Cac mon vua tao trong Meal Planner se duoc luu rieng theo tai khoan dang nhap.</p>
      ${renderSavedMealPlans(mealPlans)}
    </div>
  ` : "";

  return `
    <div class="account-layout">
      <div class="account-sidebar">
        <div class="account-profile">
          <div class="account-avatar">${initial}</div>
          <div class="account-name">${escapeHTML(currentUser.fullName)}</div>
          <div class="account-email">${escapeHTML(currentUser.email || currentUser.phone || "")}</div>
        </div>
        <nav class="account-nav">
          <a class="account-nav__link ${activeTab === 'profile' ? 'is-active' : ''}" href="./account.html#profile">
            <span class="account-nav__icon">👤</span> Thông tin cá nhân
          </a>
          <a class="account-nav__link ${activeTab === 'vouchers' ? 'is-active' : ''}" href="./vouchers.html">
            <span class="account-nav__icon">🎫</span> Kho voucher (${displayVouchers.length})
          </a>
          <a class="account-nav__link" href="./orders.html">
            <span class="account-nav__icon">📦</span> Đơn hàng (${userOrders.length})
          </a>
          <a class="account-nav__link" href="./wishlist.html">
            <span class="account-nav__icon">❤️</span> Yêu thích
          </a>
          <a class="account-nav__link ${activeTab === 'meal-plans' ? 'is-active' : ''}" href="./account.html#meal-plans">
            <span class="account-nav__icon">MP</span> Meal da plan (${mealPlans.length})
          </a>
          <a class="account-nav__link" href="./meal-planner.html">
            <span class="account-nav__icon">🍽️</span> Meal Planner
          </a>
        </nav>
      </div>

      <div class="account-content">
        ${activeTab === "vouchers" ? voucherTabContent : activeTab === "meal-plans" ? mealPlansTabContent : `
        <h2 class="account-content__title">Thông tin cá nhân</h2>
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
          <div class="form-field form-field--full">
            <span>Địa chỉ giao hàng</span>
            <div class="account-address ${currentUser.address ? "is-saved" : "is-editing"}" id="account-address">
              <div class="account-address__saved">
                <span class="account-address__icon">⌖</span>
                <div>
                  <strong id="account-address-text">${escapeHTML(currentUser.address || "Chưa có địa chỉ giao hàng")}</strong>
                  <small>Địa chỉ mặc định khi thanh toán</small>
                </div>
                <button class="btn btn--outline btn--sm" id="edit-account-address" type="button">Chỉnh sửa</button>
              </div>
              <div class="account-address__editor">
                <div class="address-presets" aria-label="Chọn nhanh địa chỉ giao hàng">
                  <button type="button" data-address-preset="Quận 1, TP. Hồ Chí Minh">Quận 1</button>
                  <button type="button" data-address-preset="Quận 3, TP. Hồ Chí Minh">Quận 3</button>
                  <button type="button" data-address-preset="Quận 7, TP. Hồ Chí Minh">Quận 7</button>
                  <button type="button" data-address-preset="TP. Thủ Đức, TP. Hồ Chí Minh">Thủ Đức</button>
                </div>
                <textarea name="address" rows="3">${escapeHTML(currentUser.address || "")}</textarea>
              </div>
            </div>
          </div>
          <div class="form-field--full" style="display:flex;gap:12px;flex-wrap:wrap;">
            <button class="btn btn--primary" type="submit">Lưu thay đổi</button>
            <button class="btn btn--ghost" id="logout-btn" type="button">Đăng xuất</button>
          </div>
        </form>
        <div id="profile-message" class="profile-save-state" aria-live="polite"></div>
        `}
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
    <div class="orders-header">
      <h1 class="orders-header__title">Sản phẩm yêu thích</h1>
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
            <img src="${getProductImage(product)}" alt="${escapeHTML(product.name)}" />
          </a>
          <div class="product-card__body">
            <a href="./product-detail.html?slug=${encodeURIComponent(product.slug)}" class="product-card__name">${escapeHTML(product.name)}</a>
            <div class="product-card__brand">${escapeHTML(product.brand)}</div>
            <div class="price">
              <span class="price__current">${formatCurrency(getProductSalePrice(product) || product.price)}</span>
              ${getProductSalePrice(product) ? '<span class="price__original">' + formatCurrency(product.price) + "</span>" : ""}
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
  const form = document.getElementById("login-form");
  if (!form) return;

  // Password toggle
  form.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".password-input-wrapper").querySelector("input");
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.querySelector(".password-toggle__icon").textContent = isPassword ? "🙈" : "👁️";
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const user = getUserByIdentity(
      String(data.get("identity") || ""),
      String(data.get("password") || "")
    );
    const message = document.getElementById("auth-message");
    if (!user) {
      if (message) {
        message.textContent = "❌ Email/SĐT hoặc mật khẩu không đúng.";
        message.style.color = "var(--color-sale)";
        message.style.display = "block";
        message.className = "auth-message auth-message--error";
      }
      return;
    }
    user.lastLoginAt = new Date().toISOString();
    upsertStoredUser(user);
    setCurrentUser(user);
    showToast("Đăng nhập thành công! 🎉");
    const redirect = normalizeRedirectTarget(getQueryParam("redirect"));
    window.location.href = redirect;
  });
}

function attachRegisterHandlers() {
  const form = document.getElementById("register-form");
  if (!form) return;

  // Password toggle
  form.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".password-input-wrapper").querySelector("input");
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.querySelector(".password-toggle__icon").textContent = isPassword ? "🙈" : "👁️";
    });
  });

  // Password strength indicator
  const passwordInput = form.querySelector("input[name='password']");
  const strengthBar = document.getElementById("password-strength");
  if (passwordInput && strengthBar) {
    passwordInput.addEventListener("input", () => {
      const val = passwordInput.value;
      const bar = strengthBar.querySelector(".password-strength__bar");
      let score = 0;
      if (val.length >= 6) score += 1;
      if (val.length >= 10) score += 1;
      if (/[A-Z]/.test(val)) score += 1;
      if (/[0-9]/.test(val)) score += 1;
      if (/[^A-Za-z0-9]/.test(val)) score += 1;

      const levels = ["", "weak", "fair", "good", "strong", "very-strong"];
      bar.className = "password-strength__bar " + levels[Math.min(score, 5)];
      strengthBar.style.display = val.length > 0 ? "block" : "none";
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName") || "").trim();
    const lastName = String(data.get("lastName") || "").trim();
    const fullName = firstName + " " + lastName;
    const email = String(data.get("email") || "").trim().toLowerCase();
    const phone = String(data.get("phone") || "").trim();
    const password = String(data.get("password") || "");
    const agreed = data.get("agreed");
    const message = document.getElementById("auth-message");

    if (!agreed) {
      if (message) {
        message.textContent = "❌ Vui lòng đồng ý với Điều khoản dịch vụ.";
        message.style.color = "var(--color-sale)";
        message.style.display = "block";
        message.className = "auth-message auth-message--error";
      }
      return;
    }

    if (password.length < 6) {
      if (message) {
        message.textContent = "❌ Mật khẩu phải có ít nhất 6 ký tự.";
        message.style.color = "var(--color-sale)";
        message.style.display = "block";
        message.className = "auth-message auth-message--error";
      }
      return;
    }

    const duplicate = accountState.users.find((u) =>
      u.email?.toLowerCase() === email || u.phone === phone
    );
    if (duplicate) {
      if (message) {
        message.textContent = "❌ Email hoặc số điện thoại đã tồn tại.";
        message.style.color = "var(--color-sale)";
        message.style.display = "block";
        message.className = "auth-message auth-message--error";
      }
      return;
    }

    const newUser = {
      id: generateId("u"),
      fullName,
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
    showToast("Đăng ký thành công! 🎉");
    const redirect = normalizeRedirectTarget(getQueryParam("redirect"));
    window.location.href = redirect;
  });
}

function attachAccountHandlers() {
  document.querySelectorAll("[data-address-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const textarea = document.querySelector("#profile-form textarea[name='address']");
      if (textarea) textarea.value = button.dataset.addressPreset || "";
      document.getElementById("account-address")?.classList.add("is-editing");
    });
  });

  document.getElementById("edit-account-address")?.addEventListener("click", () => {
    const box = document.getElementById("account-address");
    box?.classList.add("is-editing");
    box?.querySelector("textarea")?.focus();
  });

  // Profile form
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
      output.innerHTML = '<span class="profile-save-state__icon">✓</span><span>Đã lưu thay đổi</span>';
    }
    const addressBox = document.getElementById("account-address");
    const addressText = document.getElementById("account-address-text");
    if (addressText) addressText.textContent = updatedUser.address || "Chưa có địa chỉ giao hàng";
    addressBox?.classList.remove("is-editing");
    addressBox?.classList.add("is-saved");
    showToast("Cập nhật hồ sơ thành công");
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    clearCurrentUser();
    showToast("Đã đăng xuất");
    window.location.href = "./index.html";
  });

  // Voucher vault - remove voucher
  document.getElementById("voucher-vault")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='remove-voucher']");
    if (!btn) return;
    const voucherId = btn.dataset.voucherId;
    if (!voucherId) return;
    removeSavedVoucher(voucherId);
    showToast("Đã xóa voucher khỏi kho");
    initAccountPage();
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
      else cart.items.push({ productId, quantity: 1, selected: true });
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
  container.innerHTML = renderLoginPagePolished();
  enhanceLoginAuthDom();
  attachLoginHandlersPolished();
}

async function initRegisterPage() {
  const seedUsersRaw = await fetchJSON(DATA_PATHS.users);
  accountState.users = mergeUsers(seedUsersRaw, getStoredUsers());
  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  container.innerHTML = renderRegisterPagePolished();
  attachRegisterHandlersPolished();
}

async function initAccountPage() {
  const [seedUsersRaw, ordersRaw, productsRaw, vouchersRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.users),
    fetchJSON(DATA_PATHS.orders),
    fetchJSON(DATA_PATHS.products),
    fetchJSON(DATA_PATHS.vouchers)
  ]);

  accountState.products = mergeAdminProducts(productsRaw || []).filter(isProductActive);
  accountState.orders = mergeOrders(getOrders(), ordersRaw || []);
  accountState.users = mergeUsers(seedUsersRaw, getStoredUsers());
  accountState.vouchers = mergeAdminVouchers(vouchersRaw || []).filter(v => v.isActive !== false);

  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  container.innerHTML = renderAccountPage();
  attachAccountHandlers();

  if (!window.__accountHashBound) {
    window.__accountHashBound = true;
    window.addEventListener("hashchange", () => {
      if (document.body?.dataset.page === "account") initAccountPage();
    });
  }
}

async function initWishlistPage() {
  const productsRaw = await fetchJSON(DATA_PATHS.products);
  accountState.products = mergeAdminProducts(productsRaw || []).filter(isProductActive);
  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  container.innerHTML = renderWishlistPage();
  attachWishlistHandlers();
}

function renderLoginPagePolished() {
  const redirect = getQueryParam("redirect");
  const redirectQuery = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
  return `
    <div class="auth-card auth-card--polished">
      <div class="auth-card__logo">
        <div class="auth-card__logo-icon">BH</div>
        <p class="auth-card__eyebrow">Tài khoản khách hàng</p>
        <h1 class="auth-card__title">Chào mừng trở lại</h1>
        <p class="auth-card__subtitle">Đăng nhập để theo dõi đơn hàng, lưu voucher và quản lý wishlist của bạn.</p>
      </div>

      <div class="demo-login-fill" aria-label="Tai khoan demo">
        <span>Demo nhanh</span>
        <button type="button" data-demo-login="customer">Fill user</button>
        <button type="button" data-demo-login="admin">Fill admin</button>
      </div>

      <form id="login-form" class="auth-form">
        <label class="form-field">
          <span>Email hoặc số điện thoại</span>
          <input name="identity" type="text" placeholder="email@example.com hoặc 0901234567" required autocomplete="username" />
        </label>

        <label class="form-field">
          <span>Mật khẩu</span>
          <div class="password-input-wrapper">
            <input name="password" type="password" placeholder="Nhập mật khẩu" required autocomplete="current-password" />
            <button type="button" class="password-toggle" aria-label="Hiển thị mật khẩu">
              <span class="password-toggle__icon">Hiện</span>
            </button>
          </div>
        </label>

        <div class="form-options">
          <label class="checkbox-wrapper">
            <input type="checkbox" name="remember" />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <a href="#forgot-password-panel" class="forgot-password">Quên mật khẩu?</a>
        </div>

        <button class="btn btn--primary btn--block btn--lg" type="submit" id="login-btn">Đăng nhập</button>
      </form>

      <p id="auth-message" class="auth-message" style="display:none;"></p>

      <div class="auth-footer">
        <p>Chưa có tài khoản? <a href="./register.html${redirectQuery}" class="auth-link">Đăng ký ngay</a></p>
        <p class="auth-footer__extra">Bạn cần đăng nhập để lưu voucher, wishlist và xem lịch sử đơn hàng.</p>
      </div>
    </div>
  `;
}

function getDemoAccount(role) {
  const isAdmin = role === "admin";
  return accountState.users.find((user) =>
    isAdmin ? user.role === "admin" : user.role !== "admin" && user.isActive !== false
  );
}

function fillDemoLogin(role) {
  const form = document.getElementById("login-form");
  const demoUser = getDemoAccount(role);
  if (!form || !demoUser) return;
  const identity = form.querySelector("input[name='identity']");
  const password = form.querySelector("input[name='password']");
  if (identity) identity.value = demoUser.email || demoUser.phone || "";
  if (password) {
    password.value = demoUser.password || "";
    password.type = "text";
  }
  form.querySelector("input[name='remember']")?.setAttribute("checked", "checked");
  showAuthMessage("success", role === "admin" ? "Da dien tai khoan admin demo." : "Da dien tai khoan user demo.");
}

function renderSavedMealPlans(mealPlans) {
  if (!mealPlans.length) {
    return `
      <div class="account-empty-state">
        <h3>Chua co meal plan nao</h3>
        <p>Vao Meal Planner, chon nguyen lieu va xem mon goi y. Mon vua plan se tu luu vao day khi ban da dang nhap.</p>
        <a class="btn btn--primary" href="./meal-planner.html">Tao meal plan</a>
      </div>
    `;
  }

  return `
    <div class="account-meal-plans">
      ${mealPlans.map((plan) => `
        <article class="account-meal-card">
          <img class="account-meal-card__image" src="${escapeHTML(plan.imageUrl || "./assets/images/hero-fresh.jpg")}" alt="${escapeHTML(plan.recipeName || "Meal plan")}">
          <div class="account-meal-card__body">
            <div class="account-meal-card__top">
              <span>${escapeHTML(plan.mealTypeLabel || plan.mealType || "Meal")}</span>
              <time>${escapeHTML(plan.savedAt ? formatDate(plan.savedAt) : "")}</time>
            </div>
            <h3>${escapeHTML(plan.recipeName || "Meal plan")}</h3>
            <div class="account-meal-card__meta">
              <span>${Number(plan.totalTime || 0)} phut</span>
              <span>${Number(plan.nutrition?.calories || 0)} kcal</span>
              <span>${Number(plan.nutrition?.protein || 0)}g protein</span>
            </div>
            <div class="account-meal-card__ingredients">
              ${(plan.selectedIngredients || []).slice(0, 5).map((ingredient) => `
                <span>
                  ${ingredient.imageUrl ? `<img src="${escapeHTML(ingredient.imageUrl)}" alt="">` : ""}
                  ${escapeHTML(ingredient.name || "Nguyen lieu")}
                </span>
              `).join("")}
            </div>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderRegisterPagePolished() {
  const redirect = getQueryParam("redirect");
  const redirectQuery = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
  return `
    <div class="auth-card auth-card--polished">
      <div class="auth-card__logo">
        <div class="auth-card__logo-icon">BH</div>
        <p class="auth-card__eyebrow">Thành viên mới</p>
        <h1 class="auth-card__title">Tạo tài khoản mới</h1>
        <p class="auth-card__subtitle">Mua sắm nhanh hơn, lưu địa chỉ giao hàng và nhận ưu đãi dành riêng cho thành viên.</p>
      </div>

      <form id="register-form" class="auth-form">
        <div class="form-row">
          <label class="form-field">
            <span>Họ</span>
            <input name="firstName" placeholder="Nguyễn" required />
          </label>
          <label class="form-field">
            <span>Tên</span>
            <input name="lastName" placeholder="Văn A" required />
          </label>
        </div>

        <label class="form-field">
          <span>Email</span>
          <input name="email" type="email" placeholder="email@example.com" required autocomplete="email" />
        </label>

        <label class="form-field">
          <span>Số điện thoại</span>
          <input name="phone" type="tel" placeholder="0901 234 567" required autocomplete="tel" />
        </label>

        <label class="form-field">
          <span>Mật khẩu</span>
          <div class="password-input-wrapper">
            <input name="password" type="password" placeholder="Tối thiểu 6 ký tự" required autocomplete="new-password" />
            <button type="button" class="password-toggle" aria-label="Hiển thị mật khẩu">
              <span class="password-toggle__icon">Hiện</span>
            </button>
          </div>
          <div class="password-strength" id="password-strength">
            <div class="password-strength__bar"></div>
          </div>
        </label>

        <label class="checkbox-wrapper">
          <input type="checkbox" name="agreed" required />
          <span>Tôi đồng ý với <a href="./privacy-policy.html" class="auth-link">chính sách bảo mật</a> và <a href="./guide.html" class="auth-link">điều khoản dịch vụ</a>.</span>
        </label>

        <button class="btn btn--primary btn--block btn--lg" type="submit" id="register-btn">Tạo tài khoản</button>
      </form>

      <p id="auth-message" class="auth-message" style="display:none;"></p>

      <div class="auth-footer">
        <p>Đã có tài khoản? <a href="./login.html${redirectQuery}" class="auth-link">Đăng nhập</a></p>
      </div>
    </div>
  `;
}

function showAuthMessage(type, text) {
  const message = document.getElementById("auth-message");
  if (!message) return;
  message.textContent = text;
  message.style.display = "block";
  message.className = `auth-message auth-message--${type}`;
}

function getUserByIdentityOnly(identity) {
  const normalized = String(identity || "").trim().toLowerCase();
  return accountState.users.find((user) => {
    return user.email?.toLowerCase() === normalized || user.phone?.toLowerCase() === normalized;
  });
}

function enhanceLoginAuthDom() {
  const form = document.getElementById("login-form");
  const message = document.getElementById("auth-message");
  if (!form) return;

  if (!document.querySelector(".social-login--polished")) {
    form.insertAdjacentHTML("beforebegin", `
      <div class="social-login social-login--polished">
        <button class="btn btn--outline btn--block btn--lg" type="button" disabled aria-disabled="true">
          <span class="social-login__icon social-login__icon--google">G</span>
          Google sắp hỗ trợ
        </button>
        <button class="btn btn--outline btn--block btn--lg" type="button" disabled aria-disabled="true">
          <span class="social-login__icon social-login__icon--facebook">f</span>
          Facebook sắp hỗ trợ
        </button>
      </div>
      <div class="divider"><span>hoặc</span></div>
    `);
  }

  if (message && !document.getElementById("forgot-password-panel")) {
    message.insertAdjacentHTML("afterend", `<div id="forgot-password-panel" class="forgot-password-panel" hidden></div>`);
  }
}

function renderForgotPasswordPanel(identity = "") {
  return `
    <form id="forgot-password-form" class="forgot-password-form">
      <div>
        <h2 class="forgot-password-form__title">Đặt lại mật khẩu</h2>
        <p class="forgot-password-form__desc">Nhập email hoặc số điện thoại đã đăng ký để nhận mã xác thực trước khi đổi mật khẩu.</p>
      </div>
      <label class="form-field">
        <span>Email hoặc số điện thoại</span>
        <input name="identity" type="text" value="${escapeHTML(identity)}" placeholder="email@example.com hoặc 0901234567" required />
      </label>
      <button class="btn btn--outline" type="button" data-send-otp>Gửi mã OTP</button>
      <p class="otp-code-hint" data-otp-hint hidden></p>
      <label class="form-field">
        <span>Mã OTP</span>
        <input name="otp" inputmode="numeric" maxlength="6" placeholder="Nhập 6 số" required />
      </label>
      <label class="form-field">
        <span>Mật khẩu mới</span>
        <input name="password" type="password" placeholder="Tối thiểu 6 ký tự" required />
      </label>
      <div class="forgot-password-form__actions">
        <button class="btn btn--primary" type="submit">Cập nhật mật khẩu</button>
        <button class="btn btn--outline" type="button" data-forgot-cancel>Hủy</button>
      </div>
    </form>
  `;
}

function attachForgotPasswordHandlers(identity = "") {
  const panel = document.getElementById("forgot-password-panel");
  if (!panel) return;
  panel.innerHTML = renderForgotPasswordPanel(identity);
  panel.hidden = false;

  panel.querySelector("[data-forgot-cancel]")?.addEventListener("click", () => {
    panel.hidden = true;
    panel.innerHTML = "";
    pendingPasswordOtp = null;
  });

  panel.querySelector("[data-send-otp]")?.addEventListener("click", () => {
    const form = panel.querySelector("#forgot-password-form");
    const targetIdentity = String(form?.querySelector("[name='identity']")?.value || "").trim();
    const user = getUserByIdentityOnly(targetIdentity);
    if (!user) {
      showAuthMessage("error", "Không tìm thấy tài khoản với email hoặc số điện thoại này.");
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    pendingPasswordOtp = {
      code,
      identity: targetIdentity,
      userId: user.id,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    const hint = panel.querySelector("[data-otp-hint]");
    if (hint) {
      hint.hidden = false;
      hint.textContent = `Mã xác thực đã được tạo cho ${targetIdentity}: ${code}. Mã hết hạn sau 5 phút.`;
    }
    showAuthMessage("success", "Đã tạo mã xác thực. Nhập mã để đặt lại mật khẩu.");
  });

  panel.querySelector("#forgot-password-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const targetIdentity = String(data.get("identity") || "").trim();
    const otp = String(data.get("otp") || "").trim();
    const newPassword = String(data.get("password") || "");
    const user = getUserByIdentityOnly(targetIdentity);

    if (!user) {
      showAuthMessage("error", "Không tìm thấy tài khoản với email hoặc số điện thoại này.");
      return;
    }

    if (!pendingPasswordOtp || pendingPasswordOtp.identity !== targetIdentity || pendingPasswordOtp.userId !== user.id) {
      showAuthMessage("error", "Vui lòng bấm gửi OTP trước khi đặt lại mật khẩu.");
      return;
    }

    if (Date.now() > pendingPasswordOtp.expiresAt) {
      pendingPasswordOtp = null;
      showAuthMessage("error", "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.");
      return;
    }

    if (otp !== pendingPasswordOtp.code) {
      showAuthMessage("error", "Mã OTP không đúng.");
      return;
    }

    if (newPassword.length < 6) {
      showAuthMessage("error", "Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    const updatedUser = { ...user, password: newPassword, updatedAt: new Date().toISOString() };
    upsertStoredUser(updatedUser);
    accountState.users = mergeUsers(accountState.users, [updatedUser]);
    pendingPasswordOtp = null;
    panel.hidden = true;
    panel.innerHTML = "";
    showAuthMessage("success", "Đã cập nhật mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.");
  });
}

function loginWithSocialProvider(provider) {
  const label = provider === "facebook" ? "Facebook" : "Google";
  showAuthMessage("info", `Đăng nhập bằng ${label} đang được hoàn thiện.`);
}

function attachLoginHandlersPolished() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".password-input-wrapper")?.querySelector("input");
      if (!input) return;
      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";
      btn.querySelector(".password-toggle__icon").textContent = showPassword ? "Ẩn" : "Hiện";
    });
  });

  document.querySelectorAll("[data-demo-login]").forEach((button) => {
    button.addEventListener("click", () => {
      fillDemoLogin(button.dataset.demoLogin);
    });
  });

  document.querySelector(".forgot-password")?.addEventListener("click", (event) => {
    event.preventDefault();
    const identity = String(new FormData(form).get("identity") || "").trim();
    attachForgotPasswordHandlers(identity);
    showAuthMessage("success", "Nhập thông tin bên dưới để đặt lại mật khẩu.");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const user = getUserByIdentity(String(data.get("identity") || ""), String(data.get("password") || ""));
    const message = document.getElementById("auth-message");

    if (!user) {
      if (message) {
        message.textContent = "Email/SĐT hoặc mật khẩu không đúng.";
        message.style.display = "block";
        message.className = "auth-message auth-message--error";
      }
      return;
    }

    user.lastLoginAt = new Date().toISOString();
    upsertStoredUser(user);
    setCurrentUser(user);
    showToast("Đăng nhập thành công!");
    window.location.href = normalizeRedirectTarget(getQueryParam("redirect"));
  });
}

function attachRegisterHandlersPolished() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".password-input-wrapper")?.querySelector("input");
      if (!input) return;
      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";
      btn.querySelector(".password-toggle__icon").textContent = showPassword ? "Ẩn" : "Hiện";
    });
  });

  const passwordInput = form.querySelector("input[name='password']");
  const strengthBar = document.getElementById("password-strength");
  if (passwordInput && strengthBar) {
    passwordInput.addEventListener("input", () => {
      const value = passwordInput.value;
      const bar = strengthBar.querySelector(".password-strength__bar");
      let score = 0;
      if (value.length >= 6) score += 1;
      if (value.length >= 10) score += 1;
      if (/[A-Z]/.test(value)) score += 1;
      if (/[0-9]/.test(value)) score += 1;
      if (/[^A-Za-z0-9]/.test(value)) score += 1;
      const levels = ["", "weak", "fair", "good", "strong", "very-strong"];
      bar.className = `password-strength__bar ${levels[Math.min(score, 5)]}`;
      strengthBar.style.display = value.length ? "block" : "none";
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName") || "").trim();
    const lastName = String(data.get("lastName") || "").trim();
    const email = String(data.get("email") || "").trim().toLowerCase();
    const phone = String(data.get("phone") || "").trim();
    const password = String(data.get("password") || "");
    const agreed = data.get("agreed");
    const message = document.getElementById("auth-message");

    const showError = (text) => {
      if (!message) return;
      message.textContent = text;
      message.style.display = "block";
      message.className = "auth-message auth-message--error";
    };

    if (!agreed) {
      showError("Vui lòng đồng ý với chính sách trước khi tạo tài khoản.");
      return;
    }

    if (password.length < 6) {
      showError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    const duplicate = accountState.users.find((user) => user.email?.toLowerCase() === email || user.phone === phone);
    if (duplicate) {
      showError("Email hoặc số điện thoại đã tồn tại.");
      return;
    }

    const newUser = {
      id: generateId("u"),
      fullName: `${firstName} ${lastName}`.trim(),
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
    setStoredUsers([...localUsers.filter((user) => user.id !== newUser.id), newUser]);
    setCurrentUser(newUser);
    showToast("Đăng ký thành công!");
    window.location.href = normalizeRedirectTarget(getQueryParam("redirect"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "account") initAccountPage();
  if (page === "login") initLoginPage();
  if (page === "register") initRegisterPage();
  if (page === "wishlist") initWishlistPage();
});

export { initAccountPage, initLoginPage, initRegisterPage, initWishlistPage };
