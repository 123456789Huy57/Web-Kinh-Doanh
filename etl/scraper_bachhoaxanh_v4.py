"""
Scraper Bách Hóa Xanh v4 — scrape ALL slugs for maximum products

Discovers slugs from GetMenuV2, then scrapes every product-bearing slug.
Maps all products into our 22 target categories.
"""

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Dict, List
import requests
from slugify import slugify

API_BASE = "https://api.bachhoaxanh.com/gw"
BASE_URL = "https://www.bachhoaxanh.com"
PROVINCE_ID = "1027"
STORE_ID = "2546"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.bachhoaxanh.com",
    "Referer": "https://www.bachhoaxanh.com/",
    "xapikey": "bhx-api-core-2022",
    "authorization": "Bearer 5EE81C65659A0C3DC3CB73B6DB9F298B",
    "deviceid": "3c811951-725b-4165-bd51-33fe4270a23b",
    "platform": "webnew",
}

# Map BHX slugs -> our categories
# Add ALL product-bearing slugs discovered
SLUG_CATEGORY_MAP = {
    # Vegetables
    "rau-sach": "Vegetables",
    "cu": "Vegetables",
    "nam-tuoi": "Vegetables",
    # Fruits
    "trai-cay-tuoi-ngon": "Fruits",
    # Meat
    "thit-heo": "Meat",
    "thit-bo": "Meat",
    "thit-ga": "Meat",
    "ca-tom-muc-ech": "Seafood",
    "trung": "Eggs",
    # Milk & Dairy
    "sua-tuoi": "Milk",
    "sua-chua": "Milk",
    "sua-bot-cong-thuc": "Milk",
    "sua-tu-hat": "Milk",
    "sua-dac": "Milk",
    "yen-mach-ngu-coc": "Milk",
    "sua-chua-an": "Milk",
    "kem": "Milk",
    "kem-sua-chua": "Milk",
    # Beverages
    "nuoc-suoi-khoang": "Beverages",
    "bia": "Beverages",
    "nuoc-tra": "Beverages",
    "nuoc-ngot": "Beverages",
    "nuoc-tang-luc": "Beverages",
    "nuoc-yen": "Beverages",
    "nuoc-ep-trai-cay": "Beverages",
    "sua-trai-cay": "Beverages",
    "siro": "Beverages",
    "ruou-ngon-cac-loai": "Beverages",
    "ca-phe-lon": "Beverages",
    "mat-ong": "Beverages",
    "ca-phe-tra": "Beverages",
    "do-uong": "Beverages",
    # Instant Noodles
    "mi": "Instant Noodles",
    "hu-tieu": "Instant Noodles",
    "pho": "Instant Noodles",
    "chao-an-lien": "Instant Noodles",
    "bun-kho": "Instant Noodles",
    "nui-kho": "Instant Noodles",
    "mien-kho": "Instant Noodles",
    "tokbokki": "Instant Noodles",
    "mi-kho": "Instant Noodles",
    "mi-pho-chao-an-lien": "Instant Noodles",
    # Snacks
    "banh-keo-cac-loai": "Snacks",
    "banh-quy": "Snacks",
    "banh-ngot": "Snacks",
    "banh-bong-lan": "Snacks",
    "banh-chocopie-kitkat": "Snacks",
    "snack": "Snacks",
    "banh-gao": "Snacks",
    "banh-dua": "Snacks",
    "banh-que": "Snacks",
    "keo-cung": "Snacks",
    "keo-mem": "Snacks",
    "singum-keo-cao-su": "Snacks",
    "cac-loai-kho-an-lien": "Snacks",
    "trai-cay-say": "Snacks",
    "cac-loai-hat": "Snacks",
    "rau-cau": "Snacks",
    "banh-xop": "Snacks",
    "do-kho-an-lien-khac": "Snacks",
    "socola": "Snacks",
    # Frozen Foods
    "xuc-xich-tuoi": "Frozen Foods",
    "thuc-pham-che-bien-san": "Frozen Foods",
    "do-chua-dua-muoi": "Frozen Foods",
    "cha-gio": "Frozen Foods",
    "ca-vien-bo-vien": "Frozen Foods",
    "ca-hai-san-dong-lanh": "Frozen Foods",
    "san-pham-hang-mat": "Frozen Foods",
    # Rice & Dry Goods
    "gao-gao-nep": "Rice",
    "xuc-xich": "Rice",
    "ca-hop": "Rice",
    "thit-heo-hop": "Rice",
    "mi-chay": "Rice",
    "tuong-chao": "Rice",
    "thuc-pham-chay": "Rice",
    "bot-che-bien-san": "Rice",
    "dau-cac-loai": "Rice",
    "rong-bien": "Rice",
    "ca-mam": "Rice",
    "banh-phong-tom": "Rice",
    "banh-trang": "Rice",
    "nuoc-cot-dua": "Rice",
    "gao-thuc-pham-khac": "Rice",
    # Cooking Oil
    "dau-an": "Cooking Oil",
    # Sauces & Seasonings
    "nuoc-mam": "Sauce",
    "nuoc-tuong": "Sauce",
    "duong": "Sauce",
    "hat-nem": "Sauce",
    "muoi-an": "Sauce",
    "tuong-ot-ca-den": "Sauce",
    "bo": "Sauce",
    "gia-vi-nem-san": "Sauce",
    "sot-nuoc-cham": "Sauce",
    "tieu": "Sauce",
    "bot-gia-vi": "Sauce",
    "nuoc-cham-gia-vi-cac-loai": "Sauce",
    # Coffee & Tea
    "ca-phe-hoa-tan": "Coffee",
    "ca-phe-phin": "Coffee",
    "tra-kho-tui-loc": "Coffee",
    "bot-ngu-coc": "Coffee",
    # Personal Care
    "bang-ve-sinh": "Personal Care",
    "dau-goi": "Personal Care",
    "dau-xa": "Personal Care",
    "sua-tam": "Personal Care",
    "sua-rua-mat": "Personal Care",
    "lan-xit-khu-mui": "Personal Care",
    "kem-danh-rang": "Personal Care",
    "ban-chai-danh-rang": "Personal Care",
    "nuoc-suc-mieng": "Personal Care",
    "nuoc-rua-tay": "Personal Care",
    "xa-bong-cuc": "Personal Care",
    "giay-ve-sinh": "Personal Care",
    "khan-giay-uot": "Personal Care",
    "tay-trang": "Personal Care",
    "kem-chong-nang": "Personal Care",
    "sua-duong-the": "Personal Care",
    "bong-ray-tai": "Personal Care",
    "khau-trang": "Personal Care",
    "kem-u-duong-toc": "Personal Care",
    "thuoc-nhuom-toc": "Personal Care",
    "bao-cao-su": "Personal Care",
    "dung-dich-ve-sinh": "Personal Care",
    "kem-duong-da": "Personal Care",
    "dung-cu-cao-rau": "Personal Care",
    "mat-na-danh-cho-mat": "Personal Care",
    "kem-tay-long": "Personal Care",
    "nuoc-hoa": "Personal Care",
    "cham-soc-ca-nhan": "Personal Care",
    # Baby Products
    "tam-goi-2-trong-1-cho-be": "Baby",
    "nuoc-xa-vai-cho-be": "Baby",
    "kem-danh-rang-cho-be": "Baby",
    "ban-chai-danh-rang-cho-be": "Baby",
    "phan-thom-cham-soc-da-be": "Baby",
    "cham-soc-cho-be": "Baby",
    # Cleaning
    "nuoc-giat": "Cleaning",
    "nuoc-xa": "Cleaning",
    "bot-giat": "Cleaning",
    "nuoc-rua-chen": "Cleaning",
    "nuoc-lau-nha": "Cleaning",
    "tay-rua-bon-cau-nha-tam": "Cleaning",
    "diet-con-trung": "Cleaning",
    "sap-thom-tui-thom": "Cleaning",
    "kem-tay-lau-da-nang": "Cleaning",
    "nuoc-tay-quan-ao": "Cleaning",
    "ve-sinh-nha-cua": "Cleaning",
    # Household (bonus - keep if useful)
    "do-dung-gia-dinh": "Household",
    "mang-boc-thuc-pham-tui-zipper": "Household",
    "to-chen-dia-dung-mot-lan": "Household",
    "khan-tam": "Household",
    "pin-tieu": "Household",
    "chao-chong-dinh": "Household",
    "dao": "Household",
    "do-tho-cung": "Household",
    "dung-cu-chui-rua": "Household",
    "dung-cu-kep-gap": "Household",
    "tui-dung-rac": "Household",
    "co-noi": "Household",
    "lot-noi-nhac-noi": "Household",
    "khan-lau-tap-de": "Household",
    "hop-dung-thuc-pham": "Household",
    "but-thuoc-gom-tay": "Household",
    "do-van-phong-khac": "Household",
    "https://www.bachhoaxanh.com/dua": "Household",
}


def get_category_products(category_slug: str, page: int = 1, page_size: int = 12) -> Dict:
    url = f"{API_BASE}/Category/V2/GetCate"
    params = {
        "provinceId": PROVINCE_ID, "wardId": "0", "districtId": "0",
        "storeId": STORE_ID, "categoryUrl": category_slug,
        "isMobile": "true", "isV2": "true",
        "pageSize": str(page_size), "page": str(page),
    }
    headers = HEADERS.copy()
    headers["referer-url"] = f"{BASE_URL}/{category_slug}"
    headers["referer"] = f"{BASE_URL}/{category_slug}"
    r = requests.get(url, headers=headers, params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def parse_product(p: Dict, cat_name: str, idx: int) -> Dict:
    prices = p.get("productPrices", [])
    pi = prices[0] if prices else {}
    price = pi.get("sysPrice", 0) or 0
    sale_price = pi.get("price", 0) or 0
    if sale_price and sale_price >= price:
        sale_price = None

    avatar = p.get("avatar", "")
    if avatar and not avatar.startswith("http"):
        avatar = "https:" + avatar if avatar.startswith("//") else avatar

    name = p.get("fullName") or p.get("name", "")

    return {
        "id": f"p-{idx:06d}",
        "name": name,
        "price": price,
        "sale_price": sale_price,
        "unit": p.get("unit", "kg"),
        "brand": p.get("brandName", "Bách Hóa Xanh") or "Bách Hóa Xanh",
        "image_url": avatar,
        "category": cat_name,
        "description": "Nguồn: Bách Hóa Xanh",
        "slug": slugify(name[:80]) or "product",
        "rating": p.get("rateStar", 0) or 4.5,
        "review_count": p.get("totalReview", 0) or 0,
        "in_stock": True,
        "bhx_id": p.get("id", 0),
        "bhx_url": BASE_URL + (p.get("url", "") or ""),
        "isFeatured": True,
        "origin": "Bách Hóa Xanh",
        "tags": ["Bách Hóa Xanh"],
        "attributes": {},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--quick", action="store_true", help="1 slug per category")
    parser.add_argument("--output", default="../data/bhx_products_flat.json")
    args = parser.parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    all_products = {}  # id -> product
    idx = 0

    # Group slugs by category
    cat_slugs = {}
    for slug, cat in SLUG_CATEGORY_MAP.items():
        if slug.startswith("http") or not slug:
            continue
        if cat not in cat_slugs:
            cat_slugs[cat] = []
        cat_slugs[cat].append(slug)

    print(f"Categories: {len(cat_slugs)}")
    print(f"Total slugs: {sum(len(v) for v in cat_slugs.values())}")

    for cat_name, slugs in cat_slugs.items():
        cat_products = set()
        print(f"\n[{cat_name}] {len(slugs)} slugs", flush=True)

        for slug in slugs:
            try:
                resp = get_category_products(slug)
                data = resp.get("data", {})
                products = data.get("products", [])

                new_count = 0
                for p in products:
                    pid = p["id"]
                    if pid not in all_products:
                        idx += 1
                        parsed = parse_product(p, cat_name, idx)
                        all_products[pid] = parsed
                        new_count += 1
                cat_products.update(p["id"] for p in products)

                total = data.get("total", 0)
                print(f"  {slug:30s} api_total={str(total):4s} returned={len(products):2d} new={new_count:2d}", flush=True)
                time.sleep(0.2)
            except Exception as e:
                print(f"  {slug:30s} ERROR={e}", flush=True)

        cat_count = len([p for p in all_products.values() if p["category"] == cat_name])
        print(f"  => {cat_count} unique in category", flush=True)

    flat = list(all_products.values())
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(flat, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"Total unique products: {len(flat)}")
    print(f"Saved to: {output_path}")

    # Print per-category breakdown
    for cat in sorted(set(p["category"] for p in flat)):
        cnt = len([p for p in flat if p["category"] == cat])
        print(f"  {cat}: {cnt}")

if __name__ == "__main__":
    main()