"""
Export products to JSON files: products.json, categories.json, brands.json.
"""

import json
import logging
from collections import Counter
from pathlib import Path
from typing import Dict, List, Any

from config import DATA_DIR
from utils import setup_logger, CustomEncoder

logger = setup_logger("export_json")


def export_products_json(products: List[Dict], path: Path) -> Path:
    """Export products to JSON file."""
    logger.info("Exporting %d products to %s", len(products), path)

    # Clean up products for export
    export_data = []
    for p in products:
        export_data.append({
            "id": p["id"],
            "sku": p["sku"],
            "slug": p["slug"],
            "barcode": p.get("barcode", ""),
            "name": p["name"],
            "brand": p.get("brand", ""),
            "category": p.get("category", "Others"),
            "description": p.get("description", ""),
            "price": p.get("price", 0),
            "salePrice": p.get("salePrice"),
            "unit": p.get("unit", "cái"),
            "stock": p.get("stock", 0),
            "sold": p.get("sold", 0),
            "rating": p.get("rating", 0),
            "reviewCount": p.get("reviewCount", 0),
            "imageUrl": p.get("imageUrl", ""),
            "gallery": p.get("gallery", []),
            "nutrition": p.get("nutrition", {}),
            "tags": p.get("tags", []),
            "badges": p.get("badges", []),
            "featured": p.get("featured", False),
            "active": p.get("active", True),
            "createdAt": p.get("createdAt", ""),
            "updatedAt": p.get("updatedAt", ""),
        })

    with open(path, "w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2, cls=CustomEncoder)

    logger.info("Exported %d products to %s (%.1f MB)", len(export_data), path, path.stat().st_size / 1e6)
    return path


def export_categories_json(products: List[Dict], path: Path) -> Path:
    """Extract and export unique categories to JSON."""
    logger.info("Exporting categories to %s", path)

    cat_counts = Counter(p.get("category", "Others") for p in products)
    brand_counts = Counter(p.get("brand", "") for p in products)

    categories = []
    for cat_name in sorted(cat_counts.keys()):
        # Get top 10 brands for this category
        top_brands = [
            brand for brand, _ in brand_counts.most_common(50)
            if brand and any(p.get("category") == cat_name for p in products if p.get("brand") == brand)
        ][:10]

        categories.append({
            "id": cat_name.lower().replace(" ", "-"),
            "name": cat_name,
            "slug": cat_name.lower().replace(" ", "-"),
            "productCount": cat_counts[cat_name],
            "topBrands": top_brands,
        })

    with open(path, "w", encoding="utf-8") as f:
        json.dump(categories, f, ensure_ascii=False, indent=2)

    logger.info("Exported %d categories", len(categories))
    return path


def export_brands_json(products: List[Dict], path: Path) -> Path:
    """Extract and export unique brands to JSON."""
    logger.info("Exporting brands to %s", path)

    brand_counts = Counter(p.get("brand", "") for p in products if p.get("brand"))

    brands = []
    for brand_name, count in brand_counts.most_common(500):
        categories = list(set(
            p.get("category", "Others")
            for p in products
            if p.get("brand") == brand_name and p.get("category")
        ))

        brands.append({
            "name": brand_name,
            "slug": brand_name.lower().replace(" ", "-").replace("/", "-"),
            "productCount": count,
            "categories": sorted(categories)[:5],
        })

    with open(path, "w", encoding="utf-8") as f:
        json.dump(brands, f, ensure_ascii=False, indent=2)

    logger.info("Exported %d brands", len(brands))
    return path


def run(products: List[Dict]) -> Dict[str, Path]:
    """Run all JSON exports. Returns dict of export paths."""
    products_path = export_products_json(products, DATA_DIR / "products.json")
    categories_path = export_categories_json(products, DATA_DIR / "categories.json")
    brands_path = export_brands_json(products, DATA_DIR / "brands.json")

    return {
        "products": products_path,
        "categories": categories_path,
        "brands": brands_path,
    }


if __name__ == "__main__":
    logger.info("Run via main.py")