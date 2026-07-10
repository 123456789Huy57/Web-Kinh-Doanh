# Thêm trang mới vào Bách Hóa Tươi

Dán prompt bên dưới vào AI (Claude Code / Copilot / Cursor).
Thay `[TÊN_TRANG]` bằng tên thực tế (ví dụ: `compare`, `blog`, `promotion`).

---

## PROMPT

Tôi có project Vietnamese grocery ecommerce (Bách Hóa Tươi).
Frontend-only: HTML + CSS + JS thuần, JSON data, localStorage. KHÔNG dùng React/Next.js/npm/backend.

### Cấu trúc project (flat)
```
├── [TÊN_TRANG].html       ← tạo ở root
├── css/
│   ├── style.css          ← design system, KHÔNG sửa
│   └── [TÊN_TRANG].css    ← tạo mới
├── js/
│   ├── main.js            ← shared layout, KHÔNG sửa
│   ├── storage.js         ← localStorage wrapper, KHÔNG sửa
│   ├── utils.js           ← helpers, KHÔNG sửa
│   └── [TÊN_TRANG].js     ← tạo mới
└── data/                  ← JSON files, KHÔNG sửa
```

### Trang cần tạo: [TÊN_TRANG]
**Chức năng:** [Mô tả ngắn]

### Template HTML
```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>[Tên trang] | Bách Hóa Tươi</title>
    <link rel="stylesheet" href="./css/style.css" />
    <link rel="stylesheet" href="./css/[TÊN_TRANG].css" />
  </head>
  <body data-page="[TÊN_TRANG]">
    <header id="site-header"></header>
    <main class="page-shell">
      <div class="container" id="[TÊN_TRANG]-root"></div>
    </main>
    <footer id="site-footer"></footer>
    <script type="module" src="./js/main.js"></script>
    <script type="module" src="./js/[TÊN_TRANG].js"></script>
  </body>
</html>
```

### Template JS
```js
import { fetchJSON, formatCurrency, escapeHTML, generateId, getQueryParam } from "./utils.js";
import { getActiveCart, setActiveCart, getCurrentUser } from "./storage.js";
import { showToast } from "./main.js";

let pageState = {};

function renderPage() {
  return `<div>Nội dung trang</div>`;
}

async function init[TênTrang]Page() {
  const main = document.querySelector("main");
  if (!main) return;
  const container = main.querySelector(".container") || main;
  container.innerHTML = renderPage();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "[TÊN_TRANG]") {
    init[TênTrang]Page();
  }
});
```

### Design tokens (CSS variables từ style.css)
```css
var(--color-primary)       /* #2d8f4e xanh lá */
var(--color-accent)        /* #f97316 cam */
var(--color-sale)          /* #ef4444 đỏ */
var(--color-text)          /* #1a1a1a */
var(--color-muted)         /* #6b7280 */
var(--color-bg)            /* #f0f7f0 */
var(--color-surface)       /* #ffffff */
var(--color-primary-light) /* #e8f5e9 */
var(--radius-md)           /* border-radius vừa */
var(--radius-lg)           /* border-radius lớn */
var(--shadow-sm / --shadow-md / --shadow-lg)
```

### CSS classes có sẵn (dùng lại, không tạo trùng)
```css
/* Layout */
.container          /* max-width 1200px, centered */
.page-shell         /* padding top/bottom cho main */

/* Buttons */
.btn                /* base button */
.btn--primary       /* nền xanh */
.btn--outline       /* viền xanh */
.btn--sale          /* nền đỏ */
.btn--ghost         /* không viền */
.btn--sm / --lg     /* kích thước */
.btn--block         /* full width */
.btn--pill          /* border-radius tròn */

/* Form */
.form-field         /* label + input block */
.form-field--full   /* span 2 cột */

/* Cards */
.product-card       /* card sản phẩm chuẩn */
```

### Helpers từ utils.js
```js
formatCurrency(number)    // 99000 → "99.000 đ"
formatNumber(number)      // 1000 → "1.000"
formatDate(isoString)     // → "18/06/2026"
escapeHTML(str)           // chống XSS — BẮT BUỘC dùng khi render user data
generateId(prefix)        // → "prefix-abc123"
getQueryParam(key)        // lấy ?key=value từ URL
fetchJSON(url)            // fetch + JSON.parse
```

### Storage từ storage.js
```js
getActiveCart() / setActiveCart(cart) / clearActiveCart()
getCurrentUser() / setCurrentUser(user) / clearCurrentUser()
getOrders() / setOrders(orders)
getWishlist() / setWishlist(items) / toggleWishlist(productId)
isWishlisted(productId)
getMealPlans() / setMealPlans(plans)
getCheckoutDraft() / setCheckoutDraft(draft) / clearCheckoutDraft()
```

### Data files
```
./data/products.json       30 sản phẩm, id: p-001 → p-030
./data/categories.json     8 danh mục
./data/vouchers.json       10 voucher
./data/meals.json          20 meal templates
./data/recipes.json        20 recipes
```

### Chạy dev server
```
python -m http.server 3001
```
Mở: `http://localhost:3001/[TÊN_TRANG].html`

### Lưu ý
- Mọi text render từ data phải qua `escapeHTML()`
- Dùng `showToast("message")` để thông báo thay alert()
- Không dùng `document.write()`, `eval()`, inline onclick
- CSS mobile-first, breakpoints: 480px / 768px / 1024px
