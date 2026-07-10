# FreshMart - AI Nutrition Commerce

Website thương mại điện tử bán thực phẩm tươi, có danh mục sản phẩm, giỏ hàng, voucher, checkout, tài khoản khách hàng, meal planner và dashboard admin.

## Công nghệ sử dụng

- HTML, CSS, JavaScript thuần
- Dữ liệu tĩnh bằng file JSON trong thư mục `data/`
- Lưu trạng thái demo bằng `localStorage`
- Không dùng backend riêng
- Không dùng database thật
- Deploy bằng Vercel Static Hosting

## Vì sao web frontend nhưng vẫn chạy Python hoặc Node.js?

Dự án này không có backend xử lý nghiệp vụ. Python hoặc Node.js chỉ được dùng để mở một local static server khi chạy thử trên máy.

Nếu mở trực tiếp file `.html` bằng double click, trình duyệt có thể chặn một số chức năng như:

- `fetch()` file JSON trong thư mục `data/`
- import/export JavaScript module
- load tài nguyên qua đường dẫn tương đối
- một số luồng định tuyến bằng query string

Vì vậy khi demo local, em chạy server tĩnh để trình duyệt truy cập website qua `localhost`, giống cách website được host trên Vercel.

Nói ngắn gọn:

- Python/Node.js không phải backend của website.
- Python/Node.js chỉ serve file tĩnh: HTML, CSS, JS, ảnh và JSON.
- Logic đăng nhập, giỏ hàng, wishlist, meal plan đang chạy ở phía trình duyệt.
- Khi deploy lên Vercel, người dùng chỉ cần mở link web, không cần chạy Python hay Node.js.

## Cách chạy dự án

### Cách 1: chạy bằng Node.js

```bash
npm install
npm run serve
```

Sau đó mở:

```text
http://127.0.0.1:8088
```

`npm run serve` dùng file `tools/static-server.cjs` để tạo static server local.

### Cách 2: chạy bằng Python

```bash
python -m http.server 8088
```

Sau đó mở:

```text
http://127.0.0.1:8088
```

Cách này cũng chỉ tạo static server, không phải backend.

### Kiểm tra nhanh dự án

```bash
npm run check
```

Lệnh này chạy `tools/check-static.js` để kiểm tra các file HTML, CSS, JavaScript, JSON và đường dẫn tài nguyên cơ bản.

## Link deploy

```text
https://freshmart-nutrition-commerce.vercel.app
```

## Tài khoản demo

User:

```text
a@example.com
123456
```

Admin:

```text
admin@example.com
admin123
```

Trang đăng nhập có nút fill nhanh tài khoản demo để tiện thuyết trình.

## Cấu trúc thư mục

```text
AI-Nutrition-Commerce/
├── index.html
├── catalog.html
├── product-detail.html
├── cart.html
├── checkout.html
├── orders.html
├── login.html
├── register.html
├── account.html
├── wishlist.html
├── vouchers.html
├── meal-planner.html
├── admin.html
├── stores.html
├── about.html
├── css/
├── js/
├── data/
├── assets/
├── tools/
├── docs/
├── package.json
├── vercel.json
└── README.md
```

## Vai trò các thư mục chính

`css/`

Chứa toàn bộ giao diện, responsive layout và style cho từng trang.

`js/`

Chứa logic frontend: render sản phẩm, giỏ hàng, đăng nhập demo, wishlist, voucher, meal planner, dashboard admin.

`data/`

Chứa dữ liệu JSON tĩnh như sản phẩm, danh mục, voucher, user demo, order demo, nguyên liệu và công thức món ăn.

`assets/`

Chứa hình ảnh, icon và tài nguyên hiển thị.

`tools/`

Chứa công cụ hỗ trợ chạy và kiểm tra dự án:

- `static-server.cjs`: mở local static server
- `check-static.js`: kiểm tra nhanh file và đường dẫn

`docs/`

Chứa tài liệu phụ như mô tả dữ liệu, design brief, sitemap, report assets. Các file này không bắt buộc để website chạy, nhưng dùng để giải thích quá trình làm dự án.

## Các chức năng chính

- Xem sản phẩm theo danh mục và sub-category
- Tìm kiếm sản phẩm
- Xem chi tiết sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Badge giỏ hàng cập nhật tự động
- Lưu wishlist
- Lưu voucher
- Checkout demo
- Đăng nhập user/admin demo
- Meal Planner theo nguyên liệu đã chọn
- Lưu meal plan vào tài khoản người dùng bằng localStorage
- Dashboard admin có thống kê và biểu đồ

## Ghi chú về dữ liệu và backend

Website này dùng dữ liệu tĩnh từ JSON để phù hợp phạm vi đồ án frontend. Các thao tác như đăng nhập, giỏ hàng, wishlist, voucher, meal plan được mô phỏng bằng JavaScript và `localStorage`.

Nếu phát triển thành sản phẩm thật, phần backend có thể được bổ sung sau để xử lý:

- Xác thực tài khoản thật
- Cơ sở dữ liệu sản phẩm
- Đơn hàng thật
- Thanh toán online
- Phân quyền admin bảo mật hơn
