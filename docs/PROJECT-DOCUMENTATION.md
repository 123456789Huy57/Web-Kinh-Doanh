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

---

## Phân công nhóm (4 người)

### Bạn A (bạn) — Trang chủ, Danh mục, Giỏ hàng, Thanh toán
Đã hoàn thiện core flow (mua sắm, thanh toán cơ bản). Không cần làm thêm.

### Bạn B — Meal Planner + Tài khoản

**Meal Planner** (`meal-planner.html`, `js/meal-planner.js`, `css/meal.css`)
- [ ] Giao diện lịch tuần: hiển thị 7 cột (Thứ 2 → Chủ nhật), mỗi cột có 3 bữa (Sáng, Trưa, Tối)
- [ ] Load mẫu thực đơn từ `data/meals.json` — hiển thị dạng card gợi ý bên cạnh lịch
- [ ] Kéo-thả (drag & drop) mẫu thực đơn vào ô trong lịch — hoặc click để thêm
- [ ] Lưu lịch tuần vào localStorage qua `getMealPlans()` / `setMealPlans()` trong `storage.js`
- [ ] Nút "Tạo thực đơn tự động" — random 7 ngày từ meals.json, mỗi ngày 3 bữa
- [ ] Nút "Xoá tuần" — xoá toàn bộ lịch hiện tại
- [ ] Tính năng tạo danh sách mua sắm: tổng hợp nguyên liệu từ các món đã chọn trong tuần
- [ ] Responsive: trên mobile lịch chuyển thành dạng danh sách dọc

**Tài khoản** (`account.html`, `js/account.js`, `css/account.css`)
- [ ] Form thông tin cá nhân: Họ tên, Email, Số điện thoại, Địa chỉ — load từ `getCurrentUser()`
- [ ] Nút "Lưu thay đổi" — gọi `setCurrentUser(user)` + `showToast("Cập nhật thành công", "success")`
- [ ] Đổi mật khẩu: form gồm Mật khẩu cũ, Mật khẩu mới, Xác nhận — validate match
- [ ] Lịch sử đơn hàng: render danh sách đơn từ `getOrders()`, dùng `formatCurrency()`, `formatDate()`
- [ ] Mỗi đơn hàng hiển thị: mã đơn, ngày, tổng tiền, trạng thái (đã giao/đang xử lý/đã huỷ)
- [ ] Click vào đơn hàng → expand chi tiết (danh sách sản phẩm trong đơn)
- [ ] Avatar người dùng: hiển thị avatar mặc định từ `placeholder-avatar.svg`, cho phép upload ảnh mới (chỉ preview, không lưu server)

### Bạn C — Đơn hàng + Chi tiết sản phẩm + Đăng nhập/Đăng ký

**Đơn hàng** (`orders.html`, `js/orders.js`, `css/orders.css`)
- [ ] Danh sách đơn hàng (dạng bảng hoặc card): mã đơn, ngày, sản phẩm, tổng tiền, trạng thái
- [ ] Bộ lọc trạng thái: Tất cả / Đang xử lý / Đã giao / Đã huỷ
- [ ] Click đơn hàng → modal/xem chi tiết: danh sách sản phẩm kèm ảnh, số lượng, đơn giá
- [ ] Tổng hợp: tổng tiền hàng, phí ship, giảm giá (nếu có), tổng thanh toán
- [ ] Nút "Mua lại" — thêm tất cả sản phẩm từ đơn cũ vào giỏ hàng
- [ ] Responsive: trên mobile bảng chuyển thành card

**Chi tiết sản phẩm** (`product-detail.html`, `js/product.js`, `css/product.css`)
- [ ] Load sản phẩm từ `data/products.json` theo query param `?slug=...` (dùng `getQueryParam()`)
- [ ] Hiển thị: ảnh lớn, tên, giá (`price__current` + `price__original` nếu có sale), badge
- [ ] Mô tả sản phẩm + bảng thành phần dinh dưỡng (nếu có)
- [ ] Bộ chọn số lượng (+, -) + nút "Thêm vào giỏ" → gọi `getActiveCart()` / `setActiveCart()`
- [ ] Nút "Yêu thích" → `toggleWishlist(productId)` + đổi trạng thái icon tim
- [ ] Section "Sản phẩm liên quan": render 4 sản phẩm cùng danh mục bằng `renderProductCard()`
- [ ] Breadcrumb: Trang chủ > Danh mục > Tên sản phẩm

**Đăng nhập** (`login.html`)
- [ ] Form: Email, Mật khẩu — validate không để trống
- [ ] Nút "Đăng nhập" — kiểm tra trong `getStoredUsers()`, nếu đúng → `setCurrentUser(user)` → redirect về trang chủ
- [ ] Link "Quên mật khẩu" (hiện tại để placeholder, chưa có trang riêng)
- [ ] Link "Đăng ký" → `register.html`

**Đăng ký** (`register.html`)
- [ ] Form: Họ tên, Email, Số điện thoại, Mật khẩu, Xác nhận mật khẩu
- [ ] Validate: email đúng định dạng, mật khẩu ≥ 6 ký tự, xác nhận khớp
- [ ] Nút "Đăng ký" → `upsertStoredUser(newUser)` → `setCurrentUser(user)` → redirect
- [ ] Link "Đã có tài khoản? Đăng nhập" → `login.html`

### Bạn D — Yêu thích + Tìm kiếm + Voucher + Trang phụ

**Yêu thích** (`wishlist.html`)
- [ ] Load danh sách yêu thích từ `getWishlist()` — mảng các productId
- [ ] Render sản phẩm yêu thích dùng `renderProductCard()`, lọc từ `data/products.json`
- [ ] Nút "Xoá khỏi yêu thích" → `toggleWishlist(productId)` → re-render
- [ ] Nút "Thêm tất cả vào giỏ" → map từng sản phẩm vào `getActiveCart()` + `showToast()`
- [ ] Nếu wishlist rỗng: hiển thị ảnh placeholder + "Chưa có sản phẩm yêu thích"

**Tìm kiếm** (global search — thêm vào header, không có trang riêng)
- [ ] Ô search trong header (`#search-input`) — gõ tìm kiếm sản phẩm trong `data/products.json`
- [ ] Tìm kiếm theo tên (`product.name.includes(query)`) — không phân biệt hoa thường
- [ ] Hiển thị kết quả dạng dropdown: 5 kết quả đầu, mỗi kết quả có ảnh nhỏ + tên + giá
- [ ] Click kết quả → redirect đến `product-detail.html?slug=...`
- [ ] Debounce 300ms (dùng `debounce()` từ `utils.js`)

**Voucher** (trang mới — `voucher.html`, `js/voucher.js`, `css/voucher.css`)
- [ ] Load danh sách voucher từ `data/vouchers.json`
- [ ] Render dạng card: mã voucher, mô tả giảm giá, hạn sử dụng, điều kiện
- [ ] Nút "Sao chép mã" — copy vào clipboard + `showToast("Đã sao chép mã", "success")`
- [ ] Nút "Lưu" — lưu voucher vào localStorage (tạo mảng `aic_saved_vouchers`)
- [ ] Tab "Voucher của tôi" / "Voucher sự kiện" — phân loại

**Cài đặt** (`settings.html`)
- [ ] Theme: nút chuyển đổi chế độ sáng/tối (thêm class `dark-mode` vào `<html>`, lưu vào localStorage)
- [ ] Ngôn ngữ: dropdown Tiếng Việt / English (placeholder — chưa có i18n)
- [ ] Thông báo: toggle bật/tắt thông báo (localStorage)
- [ ] Nút "Xoá dữ liệu" — xoá tất cả localStorage keys prefix `aic_` + confirm dialog

### Bạn E — Trang Footer (9 trang tĩnh)

**Về chúng tôi:**
- **about.html** — Giới thiệu Bách Hóa Tươi: lịch sử, sứ mệnh, tầm nhìn, giá trị cốt lõi
- **stores.html** — Cửa hàng của chúng tôi: danh sách chi nhánh, bản đồ, giờ mở cửa
- **team.html** — Đội ngũ phát triển: giới thiệu thành viên, vai trò, liên hệ
- **partner.html** — Đồng hành cùng Bách Hóa Tươi: đối tác cung ứng, chương trình cộng tác viên

**Chăm sóc khách hàng:**
- **blog.html** — Blog ẩm thực: danh sách bài viết, tìm kiếm, phân trang, chi tiết bài viết
- **guide.html** — Hướng dẫn mua hàng: quy trình đặt hàng, thanh toán, giao nhận
- **shipping-policy.html** — Chính sách giao hàng: phí ship, thời gian, khu vực phục vụ
- **return-policy.html** — Chính sách đổi trả hoàn tiền: điều kiện, quy trình, thời hạn
- **privacy-policy.html** — Chính sách bảo mật thông tin: thu thập, sử dụng, bảo vệ dữ liệu

*Lưu ý: 9 trang này là trang tĩnh (static content), không cần JS phức tạp — chỉ HTML + CSS. Phân công cho 1 người hoặc chia nhỏ cho nhóm.*

### Nguyên tắc làm việc chung

1. **Mỗi người tạo file riêng**: `css/ten-trang.css`, `js/ten-trang.js` — không sửa file của người khác
2. **Import shared modules**: Luôn import từ `utils.js`, `storage.js`, `main.js` — không copy code
3. **Đồng bộ qua design system**: Dùng class CSS có sẵn trong `style.css` (btn, badge, price, eyebrow, container, section-header)
4. **Product card**: Dùng `renderProductCard()` từ `main.js` — đảm bảo đồng bộ 100%
5. **Header/Footer**: Chỉ cần `<header id="site-header">`, `<footer id="site-footer">`, `data-page` + load `main.js`
6. **Commit message format**: `[TÊN_TRANG] Mô tả thay đổi` — ví dụ: `[meal-planner] Thêm tính năng lọc theo ngày`

### Checklist khi tạo trang mới

- [ ] Tạo `trang-moi.html` theo template trong `PROMPT-ADD-PAGE.md`
- [ ] Tạo `css/trang-moi.css` — chỉ CSS riêng trang đó
- [ ] Tạo `js/trang-moi.js` — import shared modules, dùng `renderProductCard()`
- [ ] Thêm `data-page="trang-moi"` vào `<body>`
- [ ] Test: header/footer tự động render, product card đồng bộ, responsive OK
- [ ] Cập nhật bảng trạng thái trong `PROJECT-DOCUMENTATION.md`
