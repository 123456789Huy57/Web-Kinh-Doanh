# Bách Hóa Tươi 🛒

Website thương mại điện tử thực phẩm Việt Nam — đồ án môn Phát triển Web Kinh doanh.

**Stack:** HTML + CSS + JavaScript thuần. Không có backend, không có npm, không có framework.

---

## Chạy dự án

```bash
python -m http.server 3001
```

Mở trình duyệt: **http://localhost:3001**

> Yêu cầu Python 3. Không dùng `npx serve` hay `Live Server` vì sẽ lỗi query string.

---

## Cấu trúc project

```
├── index.html              # Trang chủ
├── catalog.html            # Danh mục sản phẩm
├── product-detail.html     # Chi tiết sản phẩm  (?slug=xxx)
├── cart.html               # Giỏ hàng
├── checkout.html           # Thanh toán
├── orders.html             # Đơn hàng
├── login.html              # Đăng nhập
├── register.html           # Đăng ký
├── account.html            # Tài khoản
├── wishlist.html           # Yêu thích
├── meal-planner.html       # Lập thực đơn
│
├── css/
│   ├── style.css           # Design system (màu, font, button, grid...)
│   ├── home.css            # Trang chủ
│   ├── catalog.css         # Danh mục
│   ├── product.css         # Chi tiết sản phẩm
│   ├── cart.css            # Giỏ hàng
│   ├── checkout.css        # Thanh toán
│   ├── orders.css          # Đơn hàng
│   ├── account.css         # Tài khoản / Auth
│   └── meal.css            # Meal Planner
│
├── js/
│   ├── utils.js            # Helpers: formatCurrency, fetchJSON, escapeHTML...
│   ├── storage.js          # localStorage wrapper (prefix: aic_)
│   ├── main.js             # Header/footer + homepage logic (SHARED)
│   ├── catalog.js
│   ├── product.js
│   ├── cart.js
│   ├── checkout.js
│   ├── orders.js
│   ├── account.js          # Xử lý 4 trang: login/register/account/wishlist
│   └── meal-planner.js
│
├── data/                   # JSON tĩnh, load bằng fetch()
│   ├── products.json       # 30 sản phẩm (id: p-001 → p-030)
│   ├── categories.json     # 8 danh mục
│   ├── vouchers.json       # 10 voucher
│   ├── meals.json          # 20 meal templates
│   ├── recipes.json        # 20 recipes
│   ├── meal-templates.json # 5 weekly templates
│   ├── users.json          # Seed users
│   └── orders.json         # Seed orders
│
└── assets/
    └── images/             # SVG placeholder images
```

---

## Phân chia công việc nhóm (4 người)

| Người | Phụ trách |
|-------|-----------|
| **Người 1** | `css/style.css`, `js/main.js`, `js/storage.js`, `js/utils.js`, `index.html` + `css/home.css` |
| **Người 2** | `catalog.html/css/js`, `product-detail.html/css/js` |
| **Người 3** | `cart.html/css/js`, `checkout.html/css/js`, `orders.html/css/js` |
| **Người 4** | `login/register/account/wishlist` (account.html/css/js), `meal-planner.html/css/js` |

> Mỗi người chỉ sửa file của mình để tránh conflict khi merge.

---

## Quy tắc code

- **Không dùng** React, Vue, jQuery, npm packages
- **escapeHTML()** bắt buộc khi render dữ liệu người dùng vào DOM
- **showToast()** thay cho `alert()`
- CSS đặt tên theo BEM: `.block__element--modifier`
- Mobile-first, breakpoints: `480px / 768px / 1024px`
- Màu sắc dùng CSS variables: `var(--color-primary)`, `var(--color-accent)`, `var(--color-sale)`

---

## Thêm trang mới

Xem file **`PROMPT-ADD-PAGE.md`** — copy prompt vào AI, thay `[TÊN_TRANG]` là xong.

---

## Design tokens chính

| Variable | Giá trị | Dùng cho |
|----------|---------|---------|
| `--color-primary` | `#2d8f4e` | Xanh lá chính |
| `--color-accent` | `#f97316` | Cam highlight |
| `--color-sale` | `#ef4444` | Giá sale / badge đỏ |
| `--color-muted` | `#6b7280` | Text phụ |
| `--color-bg` | `#f0f7f0` | Nền trang |
| `--color-surface` | `#ffffff` | Card / panel |
