"""
Scraper Bách Hóa Xanh — lấy sản phẩm thật từ bachhoaxanh.com.vn

Usage:
    python scraper_bachhoaxanh.py                  # Scrape all categories
    python scraper_bachhoaxanh.py --quick           # 10 products/category
    python scraper_bachhoaxanh.py --output data/bhx_products.json

Output: JSON theo schema của project (phù hợp merge vào products.json)
"""

import argparse
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# ── Add parent to path ──
sys.path.insert(0, str(Path(__file__).parent.parent))
from etl.utils import setup_logger, generate_product_id, generate_slug

logger = setup_logger("scraper_bhx")

# ============================================================
# CONFIG
# ============================================================
BASE_URL = "https://www.bachhoaxanh.com"

# Category URLs on BHX
CATEGORY_URLS = {
    "Vegetables": f"{BASE_URL}/rau-cu-qua",
    "Fruits": f"{BASE_URL}/trai-cay",
    "Meat": f"{BASE_URL}/thit-trung",
    "Seafood": f"{BASE_URL}/thuy-hai-san",
    "Milk": f"{BASE_URL}/sua",
    "Beverages": f"{BASE_URL}/nuoc-giai-khat",
    "Instant Noodles": f"{BASE_URL}/mi-chao-pho-bun",
    "Snacks": f"{BASE_URL}/banh-keo",
    "Frozen Foods": f"{BASE_URL}/thuc-pham-dong-lanh",
    "Rice": f"{BASE_URL}/gao",
    "Cooking Oil": f"{BASE_URL}/dau-an-thuc-pham",
    "Sauce": f"{BASE_URL}/nuoc-cham-gia-vi",
    "Seasoning": f"{BASE_URL}/gia-vi",
    "Bakery": f"{BASE_URL}/banh-mi",
    "Coffee": f"{BASE_URL}/ca-phe",
    "Tea": f"{BASE_URL}/tra",
    "Candy": f"{BASE_URL}/keo",
    "Personal Care": f"{BASE_URL}/cham-soc-ca-nhan",
    "Baby": f"{BASE_URL}/me-va-be",
    "Pet": f"{BASE_URL}/thu-cung",
    "Cleaning": f"{BASE_URL}/ve-sinh-nha-cua",
    "Others": f"{BASE_URL}/khac",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
}

REQUEST_DELAY = 1.0  # seconds between requests to be polite


# ============================================================
# DATA MODELS
# ============================================================
@dataclass
class BHXProduct:
    name: str
    price: int
    sale_price: Optional[int] = None
    unit: str = "kg"
    brand: str = "Bách Hóa Xanh"
    image_url: str = ""
    category: str = ""
    description: str = ""


def parse_price(text: str) -> Optional[int]:
    """Parse "12.000₫" or "12,000 đ" → 12000"""
    if not text:
        return None
    cleaned = re.sub(r"[^\d]", "", text)
    return int(cleaned) if cleaned else None


def scrape_category(url: str, category_name: str, max_products: int = 100) -> List[BHXProduct]:
    """
    Scrape products from a BHX category page.
    Tries multiple strategies to find product cards.
    """
    products = []
    logger.info("Scraping %s from %s", category_name, url)

    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        logger.error("Failed to fetch %s: %s", url, e)
        return products

    soup = BeautifulSoup(resp.text, "html.parser")

    # ── Strategy A: box-product (common BHX class) ──
    cards = soup.select(".box-product, .product-item, .item-product, .product-box")
    logger.info("  Found %d product cards (strategy A)", len(cards))

    # ── Strategy B: look for any box with price + name ──
    if not cards:
        # Find all boxes containing price info
        price_elements = soup.select(
            ".price, .box-price, [class*=price], [class*=Price]"
        )
        for el in price_elements:
            parent = el.find_parent(["div", "li", "article"])
            if parent and parent not in cards:
                cards.append(parent)
        logger.info("  Found %d product cards (strategy B)", len(cards))

    # ── Strategy C: regex scan for product patterns ──
    if not cards:
        logger.warning("  No product cards found for %s. Saving HTML for debug.", category_name)
        debug_path = Path(f"debug_{category_name}.html")
        debug_path.write_text(resp.text, encoding="utf-8")
        return products

    for card in cards[:max_products]:
        try:
            # Name
            name_el = card.select_one(
                ".name, .product-name, .title, h2, h3, a[title]"
            )
            if not name_el:
                name_el = card.select_one("a")
            if not name_el:
                continue
            name = name_el.get_text(strip=True)
            if not name or len(name) < 3:
                continue

            # Price
            price_el = card.select_one(
                ".price, .box-price, .product-price, .special-price, .current-price"
            )
            price = None
            sale_price = None
            if price_el:
                price_text = price_el.get_text(strip=True)
                price = parse_price(price_text)

            # Old price / sale
            old_price_el = card.select_one(
                ".old-price, .old, .compare-price, .original-price"
            )
            if old_price_el:
                old_text = old_price_el.get_text(strip=True)
                old_price = parse_price(old_text)
                if old_price and price:
                    sale_price = price
                    price = old_price
                elif old_price and not price:
                    price = old_price

            # If still no price, try data attributes
            if not price:
                price = int(card.get("data-price", 0) or card.get("price", 0))
            if not price:
                continue

            # Image
            img_el = card.select_one("img")
            image_url = ""
            if img_el:
                image_url = (
                    img_el.get("data-src")
                    or img_el.get("src")
                    or img_el.get("data-original")
                    or ""
                )
                if image_url and not image_url.startswith("http"):
                    image_url = urljoin(BASE_URL, image_url)

            # Unit
            unit_el = card.select_one(".unit, .weight, .product-weight, .quantity")
            unit = unit_el.get_text(strip=True) if unit_el else "kg"

            product = BHXProduct(
                name=name,
                price=price,
                sale_price=sale_price,
                unit=unit,
                brand="Bách Hóa Xanh",
                image_url=image_url,
                category=category_name,
                description=f"{name} - {category_name} chất lượng tại Bách Hóa Xanh.",
            )
            products.append(product)

        except Exception as e:
            logger.debug("  Error parsing card: %s", e)
            continue

    logger.info("  Collected %d products from %s", len(products), category_name)
    return products


def transform_to_project_schema(
    bhx_products: List[BHXProduct], category_id: str
) -> List[Dict]:
    """Transform BHX products to project schema (matches products.json format)."""
    result = []
    for i, p in enumerate(bhx_products):
        pid = generate_product_id()
        result.append(
            {
                "id": pid,
                "sku": f"BHX-{category_id.upper()[:3]}-{pid}",
                "slug": generate_slug(p.name),
                "barcode": "",
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "categoryId": category_id.lower().replace(" ", "-"),
                "price": p.sale_price or p.price,
                "salePrice": p.sale_price if p.sale_price else None,
                "unit": p.unit,
                "imageUrl": p.image_url,
                "description": p.description,
                "stock": 50,
                "rating": 4.5,
                "reviewCount": 0,
                "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
                "tags": [],
                "badges": ["fresh"],
                "isFeatured": False,
                "isActive": True,
            }
        )
    return result


def run(max_per_category: int = 100, output_path: Optional[Path] = None):
    """Run the scraper for all categories."""
    if output_path is None:
        output_path = Path(__file__).parent.parent / "data" / "bhx_products.json"

    all_products = []

    for cat_name, cat_url in CATEGORY_URLS.items():
        logger.info("─" * 50)
        products = scrape_category(cat_url, cat_name, max_products=max_per_category)
        if products:
            transformed = transform_to_project_schema(products, cat_name)
            all_products.extend(transformed)
        # Be polite: delay between categories
        time.sleep(REQUEST_DELAY)

    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    logger.info(
        "Scraping complete! %d products saved to %s",
        len(all_products),
        output_path,
    )
    return all_products


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape Bách Hóa Xanh products")
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Scrape only 10 products per category",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(
            Path(__file__).parent.parent / "data" / "bhx_products.json"
        ),
        help="Output JSON path",
    )
    args = parser.parse_args()

    max_per_cat = 10 if args.quick else 100
    run(max_per_category=max_per_cat, output_path=Path(args.output))
