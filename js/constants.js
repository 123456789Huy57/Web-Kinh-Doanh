/* =============================================================
   Constants - data, images, and static homepage content
   ============================================================= */

export const CATEGORY_IMAGES = {
  vegetables: "./assets/images/cat-vegetables.webp",
  fruits: "./assets/images/cat-fruits.webp",
  meat: "./assets/images/cat-meat.webp",
  seafood: "./assets/images/cat-seafood.webp",
  dairy: "./assets/images/cat-dairy.webp",
  beverages: "./assets/images/cat-beverages.webp",
  bakery: "./assets/images/cat-pantry.webp",
  snacks: "./assets/images/cat-condiments.webp",
  pantry: "./assets/images/cat-pantry.webp",
  noodles: "./assets/images/cat-pantry.webp",
  condiments: "./assets/images/cat-condiments.webp",
  frozen: "./assets/images/cat-meat.webp",
  "tea-coffee": "./assets/images/cat-beverages.webp"
};

export const SUBCATEGORY_IMAGES = {
  "vegetables-leafy": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80",
  "vegetables-fruit": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80",
  "vegetables-other": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80",
  "fruits-tropical": "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=500&q=80",
  "fruits-berries": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=500&q=80",
  "fruits-imported": "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=500&q=80",
  "fruits-dried": "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=500&q=80",
  "fruits-other": "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=500&q=80",
  "meat-chicken": "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=500&q=80",
  "meat-beef": "https://images.unsplash.com/photo-1603048297172-c92544798d1a?auto=format&fit=crop&w=500&q=80",
  "meat-pork": "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?auto=format&fit=crop&w=500&q=80",
  "meat-processed": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=500&q=80",
  "seafood-fish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80",
  "seafood-shrimp-crab": "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=500&q=80",
  "seafood-other": "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=500&q=80",
  "dairy-milk": "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=80",
  "dairy-yogurt": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80",
  "dairy-eggs": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80",
  "dairy-cheese": "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=500&q=80",
  "beverages-water": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=500&q=80",
  "beverages-juice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=500&q=80",
  "beverages-soft-drink": "https://images.unsplash.com/photo-1596803244618-8b702b0eae8a?auto=format&fit=crop&w=500&q=80",
  "beverages-other": "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=500&q=80",
  "bakery-bread": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
  "bakery-cake": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80",
  "bakery-other": "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=500&q=80",
  "snacks-candy": "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=500&q=80",
  "snacks-cookies": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=500&q=80",
  "snacks-other": "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=500&q=80",
  "pantry-rice": "https://images.unsplash.com/photo-1586201375761-83865011e356?auto=format&fit=crop&w=500&q=80",
  "pantry-grains": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80",
  "pantry-other": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=500&q=80",
  "noodles-instant": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80",
  "noodles-rice-noodle": "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=500&q=80",
  "noodles-other": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=500&q=80",
  "condiments-sauce": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80",
  "condiments-seasoning": "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=500&q=80",
  "condiments-oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80",
  "condiments-other": "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=500&q=80",
  "frozen-meat": "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=500&q=80",
  "frozen-ready-meal": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
  "frozen-other": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=500&q=80",
  "tea-coffee-tea": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80",
  "tea-coffee-coffee": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80",
  "tea-coffee-other": "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=500&q=80"
};

export const PRODUCT_IMAGES = {};

Object.assign(SUBCATEGORY_IMAGES, {
  "fruits-fresh": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80",
  "meat-other": "https://images.unsplash.com/photo-1603048297172-c92544798d1a?auto=format&fit=crop&w=800&q=80",
  "dairy-other": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80",
  "beverages-soft": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
  "bakery-sweet": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  "snacks-biscuit": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
  "rice-rice": "https://images.unsplash.com/photo-1586201375761-83865011e356?auto=format&fit=crop&w=800&q=80",
  "rice-other": "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=80",
  "frozen-ready": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
  tea: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
});

export const HERO_SLIDES = [
  {
    badge: "Tươi mỗi ngày - giao tận nhà",
    title: "Thực phẩm tươi cho bữa cơm gia đình Việt",
    subtitle: "Rau củ sạch, trái cây chín mọng, thịt cá tươi ngon được chọn lọc mỗi sáng. Giao nhanh trong 2 giờ tại khu vực nội thành.",
    btnText: "Mua sắm ngay",
    btnLink: "./catalog.html",
    image: "./assets/images/hero-fresh.webp"
  },
  {
    badge: "Flash sale - giảm đến 30%",
    title: "Ưu đãi hôm nay cho căn bếp luôn đầy",
    subtitle: "Săn voucher rau củ, thịt cá, trái cây và đồ uống. Giá rõ ràng, sản phẩm dễ chọn, giao đúng khung giờ.",
    btnText: "Xem khuyến mãi",
    btnLink: "./catalog.html?sort=sale",
    image: "./assets/images/hero-sale.webp"
  },
  {
    badge: "Meal planner miễn phí",
    title: "Chọn món nhanh hơn cho cả tuần",
    subtitle: "Gợi ý thực đơn theo số người, ngân sách và mục tiêu sức khỏe. Thêm nguyên liệu vào giỏ chỉ trong vài lượt chạm.",
    btnText: "Khám phá Meal Planner",
    btnLink: "./meal-planner.html",
    image: "./assets/images/hero-mealplan.webp"
  }
];

export const FEATURES = [
  { title: "Giao nhanh 2h", desc: "Nội thành TP.HCM", image: "./assets/images/hero-sale.webp" },
  { title: "Tươi mỗi ngày", desc: "Nhập hàng mỗi sáng", image: "./assets/images/hero-fresh.webp" },
  { title: "Deal mỗi ngày", desc: "Ưu đãi đến 30%", image: "./assets/images/cat-pantry.webp" },
  { title: "Đổi trả 24h", desc: "Hoàn tiền nếu không tươi", image: "./assets/images/cat-fruits.webp" }
];

export const BENEFITS = [
  { title: "Tươi sạch mỗi ngày", desc: "Hàng tươi được chọn lọc kỹ, nhập về mỗi sáng để giữ đúng chất lượng.", image: "./assets/images/hero-fresh.webp" },
  { title: "Giao hàng đúng hẹn", desc: "Đóng gói riêng từng nhóm hàng, giao nhanh trong 2 giờ tại nội thành.", image: "./assets/images/hero-sale.webp" },
  { title: "Giá tốt, voucher rõ", desc: "Giá niêm yết minh bạch, voucher tách riêng để dễ dùng khi thanh toán.", image: "./assets/images/cat-pantry.webp" },
  { title: "Nguồn gốc rõ ràng", desc: "Thông tin sản phẩm, xuất xứ và dinh dưỡng được trình bày để dễ kiểm tra.", image: "./assets/images/cat-vegetables.webp" }
];

export const PROMO_BANNERS = [
  { theme: "green", title: "Rau củ tươi", desc: "Giảm 15% cho nhóm rau củ", link: "./catalog.html?category=rau-cu" },
  { theme: "orange", title: "Combo tiết kiệm", desc: "Mua đủ bữa với thịt cá tươi", link: "./catalog.html?category=thit" },
  { theme: "blue", title: "Đồ uống mùa hè", desc: "Nước ép, sữa và trà cà phê", link: "./catalog.html?category=do-uong" }
];

export const TESTIMONIALS = [
  { name: "Chị Ngọc Hân", title: "Khách hàng Quận 7", text: "Rau củ tươi, đóng gói sạch và giao đúng giờ. Tôi hay đặt trước giờ tan làm để tối về nấu ngay.", rating: 5, image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&h=600&q=82" },
  { name: "Anh Quốc Bảo", title: "Dân văn phòng", text: "Web dễ chọn hàng, phần gợi ý bán chạy khá hữu ích. Giá và voucher hiển thị rõ nên đặt hàng nhanh hơn.", rating: 5, image: "https://images.unsplash.com/photo-1746105625407-5d49d69a2a47?auto=format&fit=crop&w=600&h=600&q=82" },
  { name: "Chị Minh Tâm", title: "Khách hàng Thủ Đức", text: "Tôi thích phần thịt cá và trái cây. Sản phẩm về tới nhà vẫn lạnh và nhìn rất tươi.", rating: 5, image: "https://images.unsplash.com/photo-1580894908361-967195033215?auto=format&fit=crop&w=600&h=600&q=82" }
];

export const TRUST_STATS = [
  { value: "200", label: "Sản phẩm chọn lọc", num: 200, suffix: "" },
  { value: "12+", label: "Cửa hàng TP.HCM", num: 12, suffix: "+" },
  { value: "2h", label: "Giao nhanh nội thành", num: 2, suffix: "h" },
  { value: "99%", label: "Đơn hàng hài lòng", num: 99, suffix: "%" }
];

export const MEAL_STEPS = [
  "Chọn số người và ngân sách",
  "Chọn mục tiêu sức khỏe",
  "Nhận thực đơn tuần và danh sách mua sắm"
];
