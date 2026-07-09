# FreshMart - Customized Nutrition E-commerce Website

FreshMart là website thương mại điện tử thực phẩm/nguyên liệu nấu ăn, có chức năng gợi ý món ăn theo nguyên liệu người dùng đang có. Dự án được thực hiện cho môn **Phát triển Web Kinh doanh**.

## 1. Thông Tin Chung

- Tên dự án: **FreshMart - A Customized Nutrition E-commerce Website**
- Loại dự án: Website thương mại điện tử thực phẩm
- Công nghệ: HTML, CSS, JavaScript thuần
- Dữ liệu: JSON tĩnh trong thư mục `data/`
- Lưu trạng thái người dùng: `localStorage`
- Backend: Chưa có backend thật, dự án chạy dưới dạng web tĩnh/prototype

## 2. Cách Chạy Dự Án

Không nên mở trực tiếp file `index.html` bằng double click, vì trình duyệt có thể chặn việc đọc dữ liệu JSON. Hãy chạy bằng local server.

### Cách 1: Dùng Python

Mở terminal tại thư mục dự án rồi chạy:

```bash
python -m http.server 8088
```

Sau đó mở trình duyệt:

```text
http://127.0.0.1:8088/index.html
```

### Cách 2: Dùng Node.js

Nếu máy đã có Node.js, có thể chạy:

```bash
npx http-server -p 8088
```

Sau đó mở:

```text
http://127.0.0.1:8088/index.html
```

## 3. Tài Khoản Demo

Các tài khoản mẫu nằm trong file `data/users.json`.

### Tài khoản khách hàng

```text
Email: a@example.com
Mật khẩu: 123456
```

### Tài khoản quản trị

```text
Email: admin@example.com
Mật khẩu: admin123
```

Lưu ý: Trang admin hiện tại là prototype và có thể truy cập trực tiếp qua `admin.html`, chưa có lớp bảo vệ đăng nhập riêng cho admin.

## 4. Các Trang Chính

### Trang khách hàng

- `index.html`: Trang chủ
- `catalog.html`: Danh mục sản phẩm
- `product-detail.html`: Chi tiết sản phẩm
- `cart.html`: Giỏ hàng
- `checkout.html`: Thanh toán
- `login.html`: Đăng nhập
- `register.html`: Đăng ký
- `account.html`: Thông tin cá nhân
- `orders.html`: Lịch sử đơn hàng
- `wishlist.html`: Sản phẩm yêu thích
- `compare.html`: So sánh sản phẩm
- `vouchers.html`: Mã giảm giá
- `blog.html`, `guide.html`: Nội dung hỗ trợ/blog
- `meal-planner.html`: AI Cooking Assistant

### Trang quản trị

- `admin.html#dashboard`: Dashboard
- `admin.html#products`: Quản lý sản phẩm
- `admin.html#orders`: Quản lý đơn hàng
- `admin.html#inventory`: Quản lý tồn kho
- `admin.html#vouchers`: Quản lý voucher
- `admin.html#banners`: Quản lý banner/nội dung
- `admin.html#users`: Quản lý khách hàng

## 5. Hướng Dẫn Thao Tác Demo

### 5.1 Xem sản phẩm và mua hàng

1. Mở `index.html`.
2. Vào `catalog.html` để xem danh mục sản phẩm.
3. Chọn một sản phẩm để xem chi tiết.
4. Bấm thêm vào giỏ hàng.
5. Vào `cart.html` để kiểm tra giỏ hàng.
6. Vào `checkout.html` để xem màn hình thanh toán.

### 5.2 Đăng nhập và xem tài khoản

1. Mở `login.html`.
2. Đăng nhập bằng tài khoản:

```text
a@example.com / 123456
```

3. Mở `account.html` để xem thông tin cá nhân.
4. Mở `orders.html` để xem lịch sử đơn hàng.

### 5.3 Sử dụng AI Cooking Assistant

Chức năng AI của dự án là **Ingredient-based AI Cooking Assistant**, không phải chức năng lập thực đơn 7 ngày.

Cách thao tác:

1. Mở `meal-planner.html`.
2. Chọn các nguyên liệu người dùng đang có.
3. Chọn tiêu chí nấu ăn như phong cách món, thời gian, khẩu phần, chế độ ăn.
4. Bấm **Tạo món ngay**.
5. Hệ thống gợi ý một món ăn phù hợp.
6. Nếu thiếu nguyên liệu, hệ thống hiển thị các sản phẩm tương ứng trong shop để người dùng có thể thêm vào giỏ.

Dữ liệu liên quan:

- `data/ingredients.json`: Danh sách nguyên liệu
- `data/recipes.json`: Danh sách công thức/món ăn
- `data/ingredient-product-map.json`: Liên kết nguyên liệu còn thiếu với sản phẩm trong shop
- `js/meal-planner.js`: Logic xử lý gợi ý món và liên kết sản phẩm

### 5.4 Sử dụng trang admin

1. Mở `admin.html`.
2. Xem dashboard tổng quan.
3. Vào mục **Sản phẩm** để xem danh sách sản phẩm.
4. Bấm **Thêm sản phẩm** để xem form thêm/sửa sản phẩm.
5. Vào mục **Đơn hàng** để xem danh sách đơn hàng và trạng thái xử lý.
6. Vào mục **Tồn kho** để xem số lượng sản phẩm.
7. Vào mục **Voucher** để xem mã giảm giá.
8. Vào mục **Người dùng** để xem tài khoản khách hàng.

## 6. Cấu Trúc Thư Mục

```text
FreshMart/
|-- index.html
|-- catalog.html
|-- product-detail.html
|-- cart.html
|-- checkout.html
|-- orders.html
|-- login.html
|-- register.html
|-- account.html
|-- meal-planner.html
|-- admin.html
|-- css/
|   |-- style.css
|   |-- home.css
|   |-- catalog.css
|   |-- product.css
|   |-- cart.css
|   |-- checkout.css
|   |-- orders.css
|   |-- account.css
|   |-- meal.css
|   `-- admin.css
|-- js/
|   |-- main.js
|   |-- storage.js
|   |-- utils.js
|   |-- catalog.js
|   |-- product.js
|   |-- cart.js
|   |-- checkout.js
|   |-- orders.js
|   |-- account.js
|   |-- meal-planner.js
|   `-- admin.js
|-- data/
|   |-- products.json
|   |-- categories.json
|   |-- users.json
|   |-- orders.json
|   |-- vouchers.json
|   |-- ingredients.json
|   |-- recipes.json
|   `-- ingredient-product-map.json
|-- assets/
|-- report-assets/
`-- README.md
```

## 7. Các File Quan Trọng

- `js/main.js`: Header, footer, logic dùng chung
- `js/storage.js`: Lưu/đọc dữ liệu localStorage
- `js/catalog.js`: Danh mục, tìm kiếm, lọc sản phẩm
- `js/product.js`: Chi tiết sản phẩm
- `js/cart.js`: Giỏ hàng
- `js/checkout.js`: Thanh toán
- `js/orders.js`: Đơn hàng
- `js/account.js`: Đăng nhập, đăng ký, tài khoản
- `js/meal-planner.js`: AI Cooking Assistant
- `js/admin.js`: Dashboard và các chức năng admin
- `css/style.css`: Style tổng quát và design tokens
- `data/products.json`: Dữ liệu sản phẩm chính

## 8. Ghi Chú Về Dữ Liệu Và Backend

Dự án hiện chưa dùng database hoặc server API thật. Các thao tác như đăng nhập, giỏ hàng, đơn hàng và cập nhật admin được mô phỏng bằng JSON tĩnh kết hợp localStorage. Vì vậy:

- Dữ liệu có thể thay đổi trong trình duyệt sau khi thao tác.
- Nếu muốn reset trạng thái demo, có thể xóa localStorage của website trong trình duyệt.
- Khi triển khai thực tế, cần bổ sung backend, database, xác thực người dùng và phân quyền admin.

## 9. Tài Liệu Báo Cáo Và Ảnh Chụp

Các ảnh chụp và ghi chú cho Chương 4 nằm trong:

```text
report-assets/chapter-4-screenshots/
```

Trong đó có:

- `chapter-4-screenshot-notes.md`: Ghi chú các màn hình đã chụp, tính năng đã kiểm tra và phần còn thiếu
- `chapter-4-draft.md`: Bản nháp nội dung Chương 4
- `figure-4-xx-...png`: Ảnh chụp giao diện thật của sản phẩm

## 10. Giới Hạn Hiện Tại

- Chưa có backend/API thật.
- Chưa có database.
- Admin login chưa tách riêng thành màn bảo vệ quyền truy cập.
- Một số phần admin như banner/support mới ở mức prototype.
- Lighthouse chưa được đo trong bản nộp này.

## 11. Cách Push Lên GitHub

Thư mục này đã được làm gọn để push lên GitHub. Các thư mục/file nặng như `.git`, `.venv`, `node_modules` và dữ liệu scrape lớn đã được loại bỏ.

Nếu dùng GitHub Desktop:

1. Mở GitHub Desktop.
2. Chọn **File > Add local repository**.
3. Chọn thư mục này.
4. Nếu GitHub Desktop hỏi tạo repository mới, chọn **Create a repository**.
5. Commit lần đầu.
6. Chọn **Publish repository** để đẩy lên GitHub.
