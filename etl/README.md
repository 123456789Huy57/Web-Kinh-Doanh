# Bách Hóa Tươi — ETL Pipeline

Production-quality ETL pipeline that builds a realistic Vietnamese grocery product database (~10,000 products) from **Open Food Facts** open dataset.

## 🎯 Overview

| Feature | Details |
|---------|---------|
| **Source** | Open Food Facts (legally reusable, open license) |
| **Target** | ~10,000 high-quality grocery products |
| **Output** | `products.json`, `products.sql`, `categories.json`, `brands.json` |
| **Images** | Downloaded, resized to 512×512, converted to WebP |
| **Prices** | Realistic VND prices per category |
| **Runtime** | ~15-30 minutes (depends on network) |

## 📁 Project Structure

```
etl/
├── config.py              # All settings, paths, category mappings
├── utils.py               # Logging, ID generation, validation helpers
├── download_dataset.py    # Download & extract Open Food Facts CSV
├── filter_products.py     # Stream CSV, filter, deduplicate
├── normalize.py           # Generate SKU, slug, description, tags, badges
├── generate_prices.py     # Category-based VND price generation
├── download_images.py     # Multi-threaded image download + WebP conversion
├── export_json.py         # Export products.json, categories.json, brands.json
├── export_mysql.py        # Export MySQL CREATE TABLE + INSERT statements
├── main.py                # Pipeline orchestrator
├── requirements.txt       # Python dependencies
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- ~5 GB free disk space (dataset + images)
- Internet connection

### Installation

```bash
cd etl
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/macOS

pip install -r requirements.txt
```

### Run Full Pipeline

```bash
python main.py
```

This will:
1. Download Open Food Facts dataset (~2.5 GB compressed)
2. Stream-filter ~10,000 quality products
3. Normalize (SKU, slug, descriptions, tags, badges)
4. Generate realistic VND prices
5. Download & convert all images to WebP (512×512)
6. Export JSON + SQL files

### Quick Test (100 products)

```bash
python main.py --quick
```

## ⚙️ Configuration

Edit `config.py` to customize:

| Setting | Description |
|---------|-------------|
| `TARGET_PRODUCT_COUNT` | Number of products to collect (default: 10000) |
| `CHUNK_SIZE` | CSV streaming chunk size (default: 10000) |
| `TARGET_CATEGORIES` | List of 22 Vietnamese grocery categories |
| `CATEGORY_MAPPING` | OpenFoodFacts → target category mapping |
| `PRICE_RANGES` | Min/max VND per category |
| `THREADS` | Image download concurrency (default: 8) |
| `TARGET_SIZE` | Image resize dimensions (default: 512×512) |

## 📦 Output Files

### `data/products.json`
```json
[
  {
    "id": "p-000001",
    "sku": "BHX-VEG-000001",
    "slug": "rau-cai-xanh-bhx-veg-000001",
    "barcode": "1234567890123",
    "name": "Rau cải xanh tươi",
    "brand": "Bách Hóa Tươi",
    "category": "Vegetables",
    "description": "Rau cải xanh tươi ngon mỗi ngày, giao hàng nhanh.",
    "price": 15000,
    "salePrice": 12000,
    "unit": "kg",
    "stock": 150,
    "sold": 342,
    "rating": 4.7,
    "reviewCount": 89,
    "imageUrl": "/assets/images/products/BHX-VEG-000001.webp",
    "gallery": [],
    "nutrition": {
      "energy_kcal": 25,
      "fat": 0.3,
      "carbohydrates": 4.7,
      "sugars": 1.2,
      "protein": 2.9,
      "fiber": 3.6,
      "salt": 0.1
    },
    "tags": ["vegetables", "high-fiber", "low-fat"],
    "badges": ["organic", "popular"],
    "featured": true,
    "active": true,
    "createdAt": "2025-06-15T10:30:00Z",
    "updatedAt": "2025-12-29T12:00:00Z"
  }
]
```

### `data/products.sql`
MySQL-compatible `CREATE TABLE` + batched `INSERT` statements (500 rows per batch).

### `data/categories.json`
```json
[
  {
    "id": "vegetables",
    "name": "Vegetables",
    "slug": "vegetables",
    "productCount": 1250,
    "topBrands": ["Bách Hóa Tươi", "VinEco", "Organic Farm"]
  }
]
```

### `data/brands.json`
```json
[
  {
    "name": "Bách Hóa Tươi",
    "slug": "bach-hoa-tuoi",
    "productCount": 2100,
    "categories": ["Vegetables", "Fruits", "Meat", "Seafood"]
  }
]
```

## 🗂️ Categories (22)

| Category | VND Range | Example Products |
|----------|-----------|------------------|
| Vegetables | 5,000 – 90,000 | Rau cải, rau muống, cà rốt |
| Fruits | 10,000 – 250,000 | Xoài, dưa hấu, táo nhập |
| Meat | 50,000 – 600,000 | Heo sạch, bò Úc, gà ta |
| Seafood | 70,000 – 800,000 | Tôm sú, cá hồi, mực |
| Milk | 20,000 – 400,000 | Sữa tươi, sữa chua, phô mai |
| Beverages | 6,000 – 150,000 | Nước suối, nước ép, bia |
| Instant Noodles | 3,000 – 25,000 | Mì gói, phở khô, hủ tiếu |
| Snacks | 5,000 – 120,000 | Khoai tây chiên, bánh mì nướng |
| Frozen Foods | 20,000 – 300,000 | Đồ ăn nhanh đông lạnh |
| Rice | 15,000 – 200,000 | Gạo ST25, gạo nếp, gạo lứt |
| Cooking Oil | 30,000 – 350,000 | Dầu ăn, dầu olive, dầu dừa |
| Sauce | 15,000 – 180,000 | Nước mắm, tương ớt, mayonnaise |
| Seasoning | 8,000 – 150,000 | Muối, tiêu, bột ngọt, hạt nêm |
| Bakery | 10,000 – 120,000 | Bánh mì, croissant, bánh ngọt |
| Coffee | 30,000 – 500,000 | Cà phê rang xay, cà phê hòa tan |
| Tea | 20,000 – 300,000 | Trà xanh, trà đen, trà thảo mộc |
| Candy | 5,000 – 150,000 | Socola, kẹo dẻo, kẹo cứng |
| Personal Care | 25,000 – 400,000 | Xà phòng, dầu gội, kem đánh răng |
| Baby | 30,000 – 500,000 | Sữa bột, chăn ga, đồ ăn dặm |
| Pet | 20,000 – 400,000 | Thức ăn chó, mèo, cát vệ sinh |
| Cleaning | 15,000 – 250,000 | Nước rửa chén, bột giặt, khử khuẩn |
| Others | 10,000 – 200,000 | Sản phẩm khác |

## 🔧 Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt
```

### Download fails / times out
- Check internet connection
- Re-run: the downloader supports **resume** (continues partial downloads)
- Increase timeout in `download_dataset.py` if needed

### Out of memory
- Pipeline streams CSV in chunks (`CHUNK_SIZE`), never loads full dataset
- Reduce `CHUNK_SIZE` in `config.py` if needed

### Image download failures
- Failed downloads are retried up to 3 times with exponential backoff
- Check `logs/` for failed URLs
- Re-run `download_images.py` separately if needed

### Not enough products collected
- Open Food Facts may not have enough products matching all filters
- Adjust filters in `filter_products.py` (e.g., relax brand requirement)
- Check category mapping coverage in `config.py`

### SQL import errors
- Ensure MySQL 8.0+ (for JSON columns)
- Use `utf8mb4` charset
- Import in batches if needed

## 📊 Performance Tips

| Task | Recommendation |
|------|----------------|
| Faster download | Use wired connection, run during off-peak hours |
| More products | Increase `TARGET_PRODUCT_COUNT` (max ~50k available) |
| Faster images | Increase `THREADS` (max 16, respect server limits) |
| Less disk space | Delete `openfoodfacts.csv` after pipeline completes |

## 📝 License

- **Pipeline code**: MIT License
- **Open Food Facts data**: Open Database License (ODbL) v1.0
- **Generated database**: Derived work, inherits ODbL — must share alike

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Add tests for new functionality
4. Submit PR

## 📞 Support

For issues, check:
1. Logs in console output
2. `data/` directory for partial outputs
3. Open Food Facts API status: https://world.openfoodfacts.org/data

---

**Built for Bách Hóa Tươi — Vietnamese grocery e-commerce platform**