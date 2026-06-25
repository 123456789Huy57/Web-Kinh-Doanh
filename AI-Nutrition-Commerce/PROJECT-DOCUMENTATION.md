# Bách Hóa Tươi — Tài liệu Dự án

## Tổng quan

**Bách Hóa Tươi** là siêu thị thương mại điện tử Việt Nam chuyên thực phẩm tươi sống. Dự án **frontend-only**: HTML + CSS + JS thuần, JSON data, localStorage. **Không React, không npm, không build tools, không backend.**

Chạy server: `python -m http.server 3001` — mở `http://localhost:3001`

---

## Cách thêm trang mới + Nguyên tắc đồng bộ

Xem file `PROMPT-ADD-PAGE.md` — copy-paste prompt đó cho AI, thay `[TÊN_TRANG]`.

### Nguyên tắc đồng bộ với trang chủ

> **Câu hỏi:** Khi tạo trang mới, làm sao để đồng bộ với các trang khác, đặc biệt là trang chủ?

**Có 3 cơ chế đồng bộ tự động, KHÔNG cần copy code từ trang khác:**

1. **Header + Footer tự động render**: Mọi trang chỉ cần gắn `data-page="..."` trong `<body>`, thẻ `<header id="site-header">` và `<footer id="site-footer">`, và load `main.js` — header/footer sẽ tự động xuất hiện giống hệt các trang khác. Code ở `mountSharedLayout()` trong `main.js`.

2. **CSS design system dùng chung**: File `style.css` chứa tất cả biến CSS, buttons, badges, prices, product card, layout. Trang mới chỉ cần import `style.css` là có toàn bộ hệ thống thiết kế. Chỉ thêm CSS riêng vào file `.css` của trang đó.

3. **Product card dùng chung**: Hàm `renderProductCard(product)` trong `main.js` — gọi import về và dùng lại, đảm bảo card sản phẩm đồng bộ 100% giữa các trang.

**Tóm lại:** Đồng bộ = load `style.css` + load `main.js` + gọi `renderProductCard()`. Không cần đọc code của trang chủ.

---

## Kiến trúc JavaScript

### Luồng khởi tạo

```
DOMContentLoaded
  → mountSharedLayout()        // main.js — render header + footer, bind events
    → initHomePage()            // main.js — chỉ chạy nếu data-page="home"
    → initCatalogPage()         // catalog.js — nếu data-page="catalog"
    → initCartPage()            // cart.js — nếu data-page="cart"
    → ...
```

### module `utils.js` (import từ bất kỳ file nào)

```js
export function formatCurrency(value)       // 99000 → "99.000 ₫"
export function formatNumber(value)          // 1000 → "1.000"
export function formatDate(isoString)        // → "18/06/2026, 14:30"
export function escapeHTML(value)            // Chống XSS — BẮT BUỘC
export function generateId(prefix)           // → "prefix-abc123"
export function slugify(value)               // "Rau củ" → "rau-cu"
export function getQueryParam(name)          // ?slug=ca-chua → "ca-chua"
export function fetchJSON(path)              // fetch + JSON.parse
export function debounce(fn, delay)          // Debounce 200ms
```

### module `storage.js` (import từ bất kỳ file nào)

```js
// User
getCurrentUser() / setCurrentUser(user) / clearCurrentUser()
getStoredUsers() / setStoredUsers(users) / upsertStoredUser(user)

// Cart
getActiveCart() / setActiveCart(cart) / clearActiveCart()
getGuestCart() / setGuestCart(cart) / clearGuestCart()

// Orders
getOrders() / setOrders(orders)

// Wishlist
getWishlist() / setWishlist(items)
toggleWishlist(productId) / isWishlisted(productId)

// Meal Planner
getMealPlans() / setMealPlans(plans)

// Catalog Filters
getCatalogFilters() / setCatalogFilters(filters)

// Checkout
getCheckoutDraft() / setCheckoutDraft(draft) / clearCheckoutDraft()
```

**localStorage keys (prefix `aic_`):**
`aic_current_user`, `aic_cart_guest`, `aic_users`, `aic_orders`, `aic_wishlist`, `aic_meal_plans`, `aic_catalog_filters`, `aic_checkout_draft`

### module `main.js` (import các hàm sau)

```js
import { renderProductCard, showToast, CATEGORY_IMAGES, renderCategorySidebar } from "./main.js";
```

- **`renderProductCard(product)`** — Trả về HTML product card chuẩn. Dùng lại ở mọi trang.
- **`showToast(message, type?)`** — Hiển thị toast notification. type: "success" | "error" | "warning"
- **`CATEGORY_IMAGES`** — Object map categoryId → ảnh thật
- **`renderCategorySidebar(categories, activeCategory)`** — Sidebar danh mục (dùng ở catalog)

---

## Hệ thống thiết kế (CSS)

### Font

| Vai trò | Font | CSS variable |
|---------|------|-------------|
| Display (heading, eyebrow) | EB Garamond | `--font-display` |
| Body (text, buttons) | Be Vietnam Pro | `--font-base` |

### Màu sắc

| Tên | Mã | Usage |
|-----|-----|-------|
| `--color-bg` | `#f7f3ed` | Nền trang |
| `--color-surface` | `#ffffff` | Card, section |
| `--color-surface-alt` | `#f0ece4` | Section phụ |
| `--color-primary` | `#1a3c2a` | Xanh chủ đạo |
| `--color-primary-dark` | `#0f2818` | Xanh đậm |
| `--color-primary-light` | `#e6eee6` | Xanh nhạt |
| `--color-accent` | `#c4883a` | Vàng gold (CTA, badge) |
| `--color-sale` | `#b5372a` | Đỏ sale |
| `--color-text` | `#1b1b19` | Text chính |
| `--color-text-secondary` | `#5c5b57` | Text phụ |
| `--color-muted` | `#93918b` | Text mờ |
| `--color-border` | `#ddd7cd` | Viền |
| `--color-footer-bg` | `#112b1c` | Footer |

### Radius

`--radius-xs: 4px` | `--radius-sm: 8px` | `--radius-md: 12px` | `--radius-lg: 18px` | `--radius-xl: 24px` | `--radius-2xl: 32px` | `--radius-pill: 9999px`

### Buttons (class có sẵn)

```html
<button class="btn">Base</button>
<button class="btn btn--primary">Primary</button>
<button class="btn btn--accent">Accent</button>
<button class="btn btn--outline">Outline</button>
<button class="btn btn--sale">Sale</button>
<button class="btn btn--ghost">Ghost</button>
<button class="btn btn--white">White</button>
<button class="btn btn--lg">Large</button>
<button class="btn btn--sm">Small</button>
<a class="btn btn--primary btn--lg" href="...">Link button</a>
```

### Badges

```html
<span class="badge badge--sale">-20%</span>
<span class="badge badge--new">Mới</span>
<span class="badge badge--hot">HOT</span>
<span class="badge badge--organic">Hữu cơ</span>
<span class="badge badge--premium">Cao cấp</span>
```

### Price

```html
<div class="price">
  <span class="price__current">99.000 ₫</span>
  <span class="price__original">120.000 ₫</span>
</div>
```

### Eyebrow (section label)

```html
<span class="eyebrow">Tại sao chọn chúng tôi</span>
```

### Layout

```html
<div class="container"><!-- padding 32px, full width --></div>
<main class="page-shell"><!-- main wrapper --></main>

<!-- Page + sidebar layout (catalog) -->
<div class="page-layout">
  <aside class="category-sidebar"><!-- 280px sidebar --></aside>
  <div class="page-content"><!-- main content --></div>
</div>
```

### Section header pattern

```html
<div class="section-header">
  <div class="section-header__text">
    <span class="eyebrow">Khuyến mãi</span>
    <h2 class="section-header__title">Tiêu đề section</h2>
  </div>
</div>
```

---

## Cấu trúc HTML mỗi trang

### Mẫu chung

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#1a3c2a" />
  <title>Tên trang | Bách Hóa Tươi</title>
  <link rel="stylesheet" href="./css/style.css" />
  <link rel="stylesheet" href="./css/trang-moi.css" />
</head>
<body data-page="trang-moi">
  <header id="site-header"></header>
  <main class="page-shell">
    <div class="container" id="trang-moi-root"></div>
  </main>
  <footer id="site-footer" class="site-footer"></footer>
  <script type="module" src="./js/main.js"></script>
  <script type="module" src="./js/trang-moi.js"></script>
</body>
</html>
```

### Mẫu JS cho trang mới

```js
import { fetchJSON, formatCurrency, escapeHTML } from "./utils.js";
import { getActiveCart, getCurrentUser } from "./storage.js";
import { showToast, renderProductCard } from "./main.js";

let state = {};

async function initTrangMoiPage() {
  const root = document.getElementById("trang-moi-root");
  if (!root) return;

  const products = await fetchJSON("./data/products.json");

  root.innerHTML = renderPage({ products });
  bindEvents();
}

function renderPage(data) {
  return `
    <div class="section-header">
      <div class="section-header__text">
        <span class="eyebrow">Tiêu đề phụ</span>
        <h2 class="section-header__title">Tiêu đề chính</h2>
      </div>
    </div>
    <div class="product-grid">
      ${data.products.map(p => renderProductCard(p)).join("")}
    </div>
  `;
}

function bindEvents() {
  // Event listeners
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "trang-moi") {
    initTrangMoiPage();
  }
});
```

---

## Breakpoints (responsive)

```css
/* Mobile: < 480px */
@media (max-width: 479px) { }

/* Tablet nhỏ: 480-767px */
@media (max-width: 767px) { }

/* Tablet lớn: 768-1023px */
@media (max-width: 1023px) { }

/* Desktop: >= 1024px */
/* Mặc định — không cần media query */
```

---

## Các trang hiện tại và trạng thái

| Trang | File HTML | File JS | File CSS | Trạng thái |
|-------|-----------|---------|----------|------------|
| Trang chủ | `index.html` | `main.js` | `style.css` + `home.css` | ✅ Hoàn thiện |
| Danh mục | `catalog.html` | `catalog.js` | `style.css` + `catalog.css` | ✅ Hoàn thiện |
| Giỏ hàng | `cart.html` | `cart.js` | `style.css` + `cart.css` | ✅ Hoàn thiện |
| Thanh toán | `checkout.html` | `checkout.js` | `style.css` + `checkout.css` | ✅ Hoàn thiện |
| Tài khoản | `account.html` | `account.js` | `style.css` + `account.css` | ✅ Hoàn thiện |
| Đơn hàng | `orders.html` | `orders.js` | `style.css` + `orders.css` | ✅ Hoàn thiện |
| Chi tiết sản phẩm | `product-detail.html` | `product.js` | `style.css` + `product.css` | ✅ Hoàn thiện |
| Đăng nhập | `login.html` | - | `style.css` | ✅ Hoàn thiện |
| Đăng ký | `register.html` | - | `style.css` | ✅ Hoàn thiện |
| Lập thực đơn | `meal-planner.html` | `meal-planner.js` | `style.css` + `meal.css` | ✅ Hoàn thiện |
| Yêu thích | `wishlist.html` | - | `style.css` | ✅ Hoàn thiện |

---

## Hướng dẫn phát triển

### Lỗi thường gặp

1. **Không thấy thay đổi CSS/JS trong trình duyệt:**
   - Xóa cache trình duyệt (Ctrl+Shift+R) hoặc thêm tham số cache-busting: `?v=2.0`
   - Đảm bảo file JS/CSS mới nhất được tải

2. **Sidebar hiển thị icon/emoji thay vì ảnh thật:**
   - Kiểm tra `CATEGORY_IMAGES` trong `main.js`
   - Đảm bảo `assets/images/cat-*.jpg` tồn tại
   - Sidebar đã được thiết kế lại với ảnh thật 56×56px, img/text wrapper

3. **Product card hiển thị placeholder:**
   - Kiểm tra `CATEGORY_IMAGES` fallback trong `renderProductCard`
   - Đảm bảo `assets/images/placeholder-product.svg` tồn tại

### Quy tắc code

- **HTML:** `escapeHTML()` cho mọi user input, `data-page` attribute cho page detection
- **CSS:** Chỉ dùng CSS custom properties, class utility, không inline styles
- **JS:** ES Modules, import từ `utils.js`/`storage.js`/`main.js`, strict error handling
- **Data:** JSON files chỉ đọc, localStorage với prefix `aic_` (không mã hóa)

### Chạy server

```bash
# Mở terminal trong thư mục project
cd "c:\Users\Huynguyen\OneDrive\Downloads\Học kì 6\Phát triển web kinh doanh\Visual Studio Code\AI-Nutrition-Commerce"
python -m http.server 3001
```

### Dữ liệu

- **products.json:** 30 sản phẩm (p-001 → p-030)
- **categories.json:** 8 danh mục (c-001 → c-008)
- **vouchers.json:** 10 voucher
- **meals.json:** 20 mẫu thực đơn
- **recipes.json:** 20 công thức
- **users.json:** 5 người dùng mẫu
- **orders.json:** Đơn hàng mẫu

### Hệ thống thiết kế

- **Font:** EB Garamond (`--font-display`), Be Vietnam Pro (`--font-base`)
- **Màu sắc:** Cream `#f7f3ed`, Forest green `#1a3c2a`, Gold `#c4883a`, Deep red `#b5372a`
- **Layout:** Full-width container 32px padding, sidebar 280px sticky
- **Components:** Buttons, badges, price, toast, section-header

### Đồng bộ trang

**3 cơ chế đồng bộ tự động, KHÔNG cần copy code từ trang khác:**

1. **Header + Footer tự động render:** Mọi trang chỉ cần gắn `data-page="..."` trong `<body>`, thẻ `<header id="site-header">` và `<footer id="site-footer">`, và load `main.js` — header/footer sẽ tự động xuất hiện giống hệt các trang khác. Code ở `mountSharedLayout()` trong `main.js`.

2. **CSS design system dùng chung:** File `style.css` chứa tất cả biến CSS, buttons, badges, prices, product card, layout. Trang mới chỉ cần import `style.css` là có toàn bộ hệ thống thiết kế. Chỉ thêm CSS riêng vào file `.css` của trang đó.

3. **Product card dùng chung:** Hàm `renderProductCard(product)` trong `main.js` — gọi import về và dùng lại, đảm bảo card sản phẩm đồng bộ 100% giữa các trang.

**Tóm lại:** Đồng bộ = load `style.css` + load `main.js` + gọi `renderProductCard()`. Không cần đọc code của trang chủ.

---

## Tài liệu tham khảo

- **PROMPT-ADD-PAGE.md:** Prompt để AI tạo trang mới
- **DESIGN-BRIEF.md:** Yêu cầu thiết kế
- **README.md:** Hướng dẫn chạy
- **DATA-SCRAPING.md:** Hướng dẫn crawl dữ liệu
