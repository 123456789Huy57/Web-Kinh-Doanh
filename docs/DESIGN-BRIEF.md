# Design Brief — Nâng cấp UI/UX Homepage

Dán prompt này vào Claude Code để redesign homepage và design system.

---

## PROMPT

Bạn là UI/UX designer kiêm frontend developer. Nhiệm vụ: nâng cấp giao diện website bán thực phẩm **Bách Hóa Tươi** để trông chuyên nghiệp như các app thực tế (Bach Hoa Xanh, WinMart, Shopee Food) — bỏ cảm giác "AI-generated placeholder".

### Đọc trước khi làm (theo thứ tự này)

1. `css/style.css` — design system hiện tại (colors, typography, components)
2. `css/home.css` — layout homepage hiện tại
3. `js/main.js` — xem cách header/footer và homepage sections được render (lines 1-200 đủ)
4. `index.html` — xem cấu trúc HTML homepage

Chỉ sửa: `css/style.css`, `css/home.css`, `js/main.js`
Không sửa: bất kỳ file JS nào khác, data/, các HTML khác.

---

### Vấn đề cần fix

**1. Hình ảnh placeholder quá lộ**
- Hiện tại: tất cả sản phẩm dùng `placeholder-product.svg` — nhìn giống mockup chưa hoàn thiện
- Fix: thêm gradient background + icon emoji theo category vào product card khi không có ảnh thật
  ```
  Rau củ → 🥬 nền xanh nhạt
  Thịt   → 🥩 nền đỏ nhạt
  Hải sản → 🦐 nền xanh biển nhạt
  Trái cây → 🍎 nền cam nhạt
  Sữa    → 🥛 nền trắng xám
  Gạo    → 🍚 nền vàng nhạt
  Gia vị → 🧂 nền nâu nhạt
  Đồ uống → 🧃 nền tím nhạt
  ```

**2. Hero section trông generic**
- Hiện tại: text + button đơn giản trên nền màu
- Cần: layout 2 cột — text bên trái, visual element bên phải (grid ảnh sản phẩm nổi bật / floating cards với thống kê)
- Thêm social proof: "10.000+ khách hàng", "Giao trong 2 giờ", "500+ sản phẩm"

**3. Product card thiếu depth**
- Thêm hover effect: card nổi lên nhẹ (`translateY(-4px)`), shadow tăng
- Badge "SALE" / "HOT" / "MỚI" phải nổi bật hơn
- Hiển thị rating stars bằng CSS thay vì chỉ số
- Nút "Thêm vào giỏ" hiện ra khi hover card (không chiếm space khi không hover)

**4. Typography chưa đủ hierarchy**
- Giá sản phẩm phải to + bold + màu primary hơn hiện tại
- Section titles cần có accent line bên trái hoặc underline màu
- Giá gốc (gạch ngang) phải rõ ràng là struck-through, màu muted

**5. Màu sắc flat quá**
- Thêm subtle gradient cho header background
- Section headers có background pattern nhẹ hoặc gradient
- CTA buttons có gradient thay vì flat color

---

### Benchmark UI (tham khảo)

| Element | Bach Hoa Xanh | WinMart | Áp dụng cho project |
|---------|--------------|---------|---------------------|
| Header | Xanh lá đậm, logo trắng, search nổi bật | Xanh WinMart, location picker | Giữ xanh `#2d8f4e`, tăng contrast |
| Product card | Ảnh vuông 1:1, badge góc trái, giá đỏ | Tương tự + rating stars | Thêm hover lift, emoji fallback |
| Hero | Banner full-width với ảnh sản phẩm thật | Carousel lớn | 2-col layout với floating stats |
| Category nav | Icon + text, scroll ngang mobile | Tương tự | Thêm active indicator rõ hơn |
| Flash sale | Countdown timer, badge đỏ rực | Deal of the day | Styling đỏ rực hơn, urgent feel |

---

### CSS cần thêm/sửa trong `css/style.css`

```css
/* Thêm vào design system */

/* Product image fallback với emoji + gradient */
.product-card__image-wrap[data-category] {
  /* gradient background theo category */
}

/* Hover lift effect */
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Rating stars */
.product-card__stars { /* CSS star rating */ }

/* Gradient buttons */
.btn--primary {
  background: linear-gradient(135deg, #2d8f4e, #3aad60);
}

/* Section title accent */
.section-title::before {
  /* left border accent */
}
```

---

### Sections homepage cần có (theo thứ tự)

1. **Top bar** — hotline, giao hàng toàn quốc, tra cứu đơn ✅ có rồi
2. **Header** — logo, location, search, cart/wishlist/account ✅ có rồi
3. **Category nav** — 8 danh mục + "Tất cả" ✅ có rồi
4. **Hero** — redesign 2-col với floating stats
5. **Flash Sale** — timer + sản phẩm giảm giá, badge đỏ rực
6. **Danh mục nổi bật** — grid 4x2 với icon lớn + màu nền riêng từng loại
7. **Sản phẩm bán chạy** — product grid 4 cột
8. **Banner khuyến mãi** — 2 banner side by side
9. **Sản phẩm mới** — product grid
10. **Footer** ✅ có rồi

---

### Không được làm

- Không thêm npm/library mới
- Không sửa file JS ngoài `js/main.js`
- Không đổi data structure trong JSON
- Không xóa CSS variable nào đang có
- Không dùng ảnh external URL (chỉ dùng placeholder SVG + emoji CSS fallback)
