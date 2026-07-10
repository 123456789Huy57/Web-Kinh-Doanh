# Hướng dẫn cào dữ liệu sản phẩm thực

## Có nên cào không?

**Về mặt kỹ thuật:** Hoàn toàn làm được.
**Về mặt pháp lý:** Dữ liệu sản phẩm (tên, giá, ảnh) thuộc quyền sở hữu của các site đó. Dùng cho đồ án học tập thì OK, **không được dùng thương mại**.
**Khuyến nghị:** Cào tên + giá + category để có data thật. Ảnh thì dùng ảnh public domain hoặc tự chụp.

---

## Flow làm

### Bước 1 — Tìm API có sẵn (nhanh nhất)

Nhiều app grocery có API public không cần auth. Mở DevTools → Network → lọc `fetch/XHR` khi duyệt trang:

| Site | Cách lấy data |
|------|--------------|
| **bachhoaxanh.com** | DevTools Network → tìm request `/api/products` hoặc `/api/v1/...` |
| **winmart.vn** | Tương tự, tìm JSON response khi scroll danh mục |
| **tiki.vn** (có thực phẩm) | API public: `https://tiki.vn/api/v2/products?category=...` |
| **grabmart** | Trong app, khó hơn |

Nếu thấy endpoint trả JSON → copy response → dùng luôn.

### Bước 2 — Scrape bằng Python (nếu không có API)

```python
# scraper.py — cài: pip install requests beautifulsoup4
import requests
from bs4 import BeautifulSoup
import json

def scrape_bachhoaxanh(category_url):
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(category_url, headers=headers)
    soup = BeautifulSoup(res.text, "html.parser")

    products = []
    for card in soup.select(".product-item"):  # inspect để tìm đúng selector
        products.append({
            "name": card.select_one(".product-name").text.strip(),
            "price": card.select_one(".product-price").text.strip(),
            "imageUrl": card.select_one("img")["src"],
        })
    return products

data = scrape_bachhoaxanh("https://www.bachhoaxanh.com/rau-cu-qua")
print(json.dumps(data, ensure_ascii=False, indent=2))
```

### Bước 3 — Transform sang schema project

Schema hiện tại của `data/products.json`:

```json
{
  "id": "p-001",
  "slug": "ten-san-pham",
  "name": "Tên sản phẩm",
  "categoryId": "vegetables",
  "price": 12000,
  "salePrice": 10000,
  "unit": "kg",
  "brand": "BHX",
  "imageUrl": "https://...",
  "description": "Mô tả ngắn",
  "stock": 100,
  "rating": 4.5,
  "reviewCount": 50,
  "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
  "tags": [],
  "badges": [],
  "isFeatured": false,
  "isActive": true
}
```

Script transform:

```python
# transform.py
import json, re

def slugify(text):
    # pip install python-slugify
    from slugify import slugify
    return slugify(text)

def transform(raw_products, category_id):
    result = []
    for i, p in enumerate(raw_products):
        # parse giá: "12.000 ₫" → 12000
        price_text = re.sub(r"[^\d]", "", p["price"])
        price = int(price_text) if price_text else 0

        result.append({
            "id": f"p-{str(i+1).zfill(3)}",
            "slug": slugify(p["name"]),
            "name": p["name"],
            "categoryId": category_id,
            "price": price,
            "salePrice": None,
            "unit": "kg",
            "brand": "BHX",
            "imageUrl": p["imageUrl"],
            "description": "",
            "stock": 50,
            "rating": 4.5,
            "reviewCount": 0,
            "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
            "tags": [],
            "badges": ["fresh"],
            "isFeatured": False,
            "isActive": True
        })
    return result

with open("scraped.json") as f:
    raw = json.load(f)

output = transform(raw, "vegetables")
with open("data/products.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
```

### Bước 4 — Ảnh sản phẩm

**Option A (dễ nhất):** Dùng URL ảnh trực tiếp từ site gốc — chỉ cần update `imageUrl` trong JSON. Hoạt động ngay, không cần download.

**Option B (bền hơn):** Download ảnh về `assets/images/products/`, đổi `imageUrl` thành đường dẫn local.

```python
import requests, os
def download_image(url, product_id):
    res = requests.get(url)
    path = f"assets/images/products/{product_id}.jpg"
    os.makedirs("assets/images/products", exist_ok=True)
    with open(path, "wb") as f:
        f.write(res.content)
    return f"./assets/images/products/{product_id}.jpg"
```

**Option C (cho đồ án):** Dùng ảnh từ Unsplash — free, không cần scrape:
```
https://source.unsplash.com/400x400/?tomato
https://source.unsplash.com/400x400/?chicken+meat
https://source.unsplash.com/400x400/?vegetables
```

---

## Checklist

- [ ] Tìm API endpoint hoặc viết scraper
- [ ] Scrape tối thiểu 30 sản phẩm, 8 category
- [ ] Transform sang schema JSON của project
- [ ] Quyết định ảnh: URL gốc / download / Unsplash
- [ ] Update `data/products.json`
- [ ] Test chạy lại catalog.html — hình ảnh load đúng không
- [ ] Nếu dùng URL ảnh gốc: test kỹ vì site gốc có thể block hotlink
