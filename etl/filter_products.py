"""
Filter and normalize products from Open Food Facts.
Streams the CSV, applies filters, deduplicates, normalizes categories.
"""

import csv
import logging
from pathlib import Path
from typing import Dict, List, Optional, Generator, Any, Set

from tqdm import tqdm

from config import (
    EXTRACTED_PATH,
    TARGET_PRODUCT_COUNT,
    CHUNK_SIZE,
    CATEGORY_MAPPING,
    TARGET_CATEGORIES,
    DATA_DIR,
)
from utils import (
    setup_logger,
    clean_string,
    safe_float,
    is_valid_image_url,
    build_fingerprint,
    rewrite_image_url,
)

logger = setup_logger("filter_products")

# Columns we care about (Open Food Facts column names)
REQUIRED_COLUMNS = [
    "code",  # barcode
    "product_name",
    "brands",
    "categories",
    "image_url",
    "nutrition_score_fr",
    "energy_100g",
    "fat_100g",
    "carbohydrates_100g",
    "proteins_100g",
    "fiber_100g",
    "sugars_100g",
    "saturated_fat_100g",
    "salt_100g",
    "nutriscore_grade",
    "ecoscore_score",
    "nova_group",
]


def csv_row_generator(path: Path, chunk_size: int = CHUNK_SIZE) -> Generator[List[Dict], None, None]:
    """
    Yield rows from CSV in chunks (list of dicts per chunk).
    Handles the large Open Food Facts CSV with many columns.
    """
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter="\t")
        chunk: List[Dict] = []
        for row in reader:
            chunk.append(row)
            if len(chunk) >= chunk_size:
                yield chunk
                chunk = []
        if chunk:
            yield chunk


# Name-based overrides: when product name clearly indicates category,
# force it regardless of CSV tags (fixes "onion" → "Beverages" bug).
NAME_CATEGORY_OVERRIDES: Dict[str, str] = {
    # Vegetables
    "onion": "Vegetables",
    "ginger": "Vegetables",
    "spinach": "Vegetables",
    "coriander": "Vegetables",
    "cucumber": "Vegetables",
    "bottle gourd": "Vegetables",
    "bitter gourd": "Vegetables",
    "okra": "Vegetables",
    "bhendi": "Vegetables",
    "carrot": "Vegetables",
    "potato": "Vegetables",
    "tomato": "Vegetables",
    "garlic": "Vegetables",
    "pepper": "Vegetables",
    "chilli": "Vegetables",
    "capsicum": "Vegetables",
    "brinjal": "Vegetables",
    "eggplant": "Vegetables",
    "cauliflower": "Vegetables",
    "broccoli": "Vegetables",
    "mushroom": "Vegetables",
    "beetroot": "Vegetables",
    "turnip": "Vegetables",
    "leek": "Vegetables",
    "celery": "Vegetables",
    "lettuce": "Vegetables",
    "cabbage": "Vegetables",
    "radish": "Vegetables",
    "pumpkin": "Vegetables",
    "corn": "Vegetables",
    "sweet corn": "Vegetables",
    "green peas": "Vegetables",
    "peas": "Vegetables",
    "beans": "Vegetables",
    "asparagus": "Vegetables",
    "artichoke": "Vegetables",
    # Fruits
    "apple": "Fruits",
    "banana": "Fruits",
    "orange": "Fruits",
    "mango": "Fruits",
    "grape": "Fruits",
    "strawberry": "Fruits",
    "blueberry": "Fruits",
    "watermelon": "Fruits",
    "pineapple": "Fruits",
    "papaya": "Fruits",
    "kiwi": "Fruits",
    "lemon": "Fruits",
    "lime": "Fruits",
    "pear": "Fruits",
    "peach": "Fruits",
    "cherry": "Fruits",
    "pomegranate": "Fruits",
    "avocado": "Fruits",
    "coconut": "Fruits",
    "dragon fruit": "Fruits",
    "durian": "Fruits",
    "jackfruit": "Fruits",
    # Meat
    "chicken": "Meat",
    "pork": "Meat",
    "beef": "Meat",
    "lamb": "Meat",
    "duck": "Meat",
    "turkey": "Meat",
    "sausage": "Meat",
    "ham": "Meat",
    "bacon": "Meat",
    "mince": "Meat",
    "steak": "Meat",
    "ribs": "Meat",
    # Seafood
    "fish": "Seafood",
    "shrimp": "Seafood",
    "prawn": "Seafood",
    "crab": "Seafood",
    "lobster": "Seafood",
    "squid": "Seafood",
    "octopus": "Seafood",
    "salmon": "Seafood",
    "tuna": "Seafood",
    "sardine": "Seafood",
    "anchovy": "Seafood",
    "mussel": "Seafood",
    "clam": "Seafood",
    "oyster": "Seafood",
    "milk": "Milk",
    "yogurt": "Milk",
    "yoghurt": "Milk",
    "cheese": "Milk",
    "butter": "Milk",
    "cream": "Milk",
    "rice": "Rice",
    "noodle": "Instant Noodles",
    "pho": "Instant Noodles",
    "ramen": "Instant Noodles",
    "udon": "Instant Noodles",
    "pasta": "Sauce",
    "sauce": "Sauce",
    "ketchup": "Sauce",
    "mayo": "Sauce",
    "vinegar": "Sauce",
    "oil": "Cooking Oil",
    "tea": "Tea",
    "coffee": "Coffee",
    "juice": "Beverages",
    "water": "Beverages",
    "beer": "Beverages",
    "wine": "Beverages",
    "soda": "Beverages",
    "candy": "Candy",
    "chocolate": "Candy",
    "cookie": "Snacks",
    "biscuit": "Snacks",
    "chips": "Snacks",
    "cracker": "Snacks",
    "ice cream": "Snacks",
    "cake": "Bakery",
    "bread": "Bakery",
    "pastry": "Bakery",
    "donut": "Bakery",
    "detergent": "Cleaning",
    "shampoo": "Personal Care",
    "soap": "Personal Care",
    "diaper": "Baby",
    "formula": "Baby",
}


def extract_category_tag(categories_str: Optional[str], product_name: str = "") -> Optional[str]:
    """
    Extract the most specific food category tag from Open Food Facts.

    Strategy:
    1. Check name-based overrides first (highest confidence).
    2. Iterate tags RIGHT-TO-LEFT (most specific first in OFF format).
    3. Use exact match before partial match to avoid false positives.
    """
    if not categories_str:
        return None

    # --- Step 1: Name override ---
    name_lower = product_name.lower().strip()
    for keyword, category in NAME_CATEGORY_OVERRIDES.items():
        if keyword in name_lower:
            return category

    # --- Step 2: Category tags (right-to-left = specific first) ---
    categories_str = str(categories_str).lower().strip()
    parts = [p.strip() for p in categories_str.split(",")]
    for part in reversed(parts):
        if ":" in part:
            tag = part.split(":", 1)[1].strip()
        else:
            tag = part.strip()
        if not tag:
            continue

        # Exact match first
        if tag in CATEGORY_MAPPING:
            return CATEGORY_MAPPING[tag]

        # Partial match only if tag is short enough (3-20 chars)
        # to avoid "plant-based foods and beverages" matching "beverages"
        if 3 <= len(tag) <= 25:
            for key, val in CATEGORY_MAPPING.items():
                if key in tag or tag in key:
                    return val

    return None


def filter_and_collect(csv_path: Path, target_count: int = TARGET_PRODUCT_COUNT) -> List[Dict]:
    """
    Stream through CSV, filter products, collect high-quality ones.

    Returns:
        List of filtered product dicts.
    """
    collected: List[Dict] = []
    seen_barcodes: Set[str] = set()
    seen_fingerprints: Set[str] = set()
    total_scanned = 0
    total_filtered_out = 0

    logger.info("Starting to filter products from %s", csv_path)

    for chunk_num, chunk in enumerate(csv_row_generator(csv_path)):
        if len(collected) >= target_count:
            break

        for row in chunk:
            total_scanned += 1

            # --- Filtering ---
            barcode = clean_string(row.get("code", ""))
            name = clean_string(row.get("product_name", ""))
            brand = clean_string(row.get("brands", ""))
            categories_str = clean_string(row.get("categories", ""))

            # Try multiple image URL fields (Open Food Facts has several)
            image_url = clean_string(row.get("image_url", ""))
            if not is_valid_image_url(image_url):
                image_url = clean_string(row.get("image_front_url", ""))
            if not is_valid_image_url(image_url):
                image_url = clean_string(row.get("image_small_url", ""))
            if not is_valid_image_url(image_url):
                image_url = clean_string(row.get("image_ingredients_url", ""))
            if not is_valid_image_url(image_url):
                image_url = clean_string(row.get("image_nutrition_url", ""))

            # Must have name
            if not name:
                total_filtered_out += 1
                continue

            # Must have brand
            if not brand:
                total_filtered_out += 1
                continue

            # Must have category
            category = extract_category_tag(categories_str, name)
            if not category:
                total_filtered_out += 1
                continue

            # Must have valid image URL
            if not is_valid_image_url(image_url):
                total_filtered_out += 1
                continue

            # Dedup by barcode
            if barcode:
                if barcode in seen_barcodes:
                    total_filtered_out += 1
                    continue
                seen_barcodes.add(barcode)

            # Dedup by name+brand fingerprint
            fp = build_fingerprint(name, brand)
            if fp in seen_fingerprints:
                total_filtered_out += 1
                continue
            seen_fingerprints.add(fp)

            # --- Build product record ---
            # Rewrite images.openfoodfacts.org → static.openfoodfacts.org (blocked CDN fix)
            image_url = rewrite_image_url(image_url)
            product = {
                "barcode": barcode or f"unknown-{total_scanned}",
                "name": name,
                "brand": brand,
                "category": category,
                "description": _build_description(row, name),
                "image_url": image_url,
                "nutrition": {
                    "energy_kcal": safe_float(row.get("energy_100g", 0)) / 4.184 if safe_float(row.get("energy_100g", 0)) else 0,
                    "fat": safe_float(row.get("fat_100g", 0)),
                    "saturated_fat": safe_float(row.get("saturated_fat_100g", 0)),
                    "carbohydrates": safe_float(row.get("carbohydrates_100g", 0)),
                    "sugars": safe_float(row.get("sugars_100g", 0)),
                    "protein": safe_float(row.get("proteins_100g", 0)),
                    "fiber": safe_float(row.get("fiber_100g", 0)),
                    "salt": safe_float(row.get("salt_100g", 0)),
                },
                "nutriscore": row.get("nutriscore_grade", ""),
            }

            collected.append(product)

            if len(collected) % 1000 == 0:
                logger.info(
                    "Scanned %d, collected %d, filtered %d",
                    total_scanned,
                    len(collected),
                    total_filtered_out,
                )

    logger.info(
        "Filter complete: scanned=%d, collected=%d, filtered=%d",
        total_scanned,
        len(collected),
        total_filtered_out,
    )
    return collected


def _build_description(row: Dict, name: str) -> str:
    """Build a natural description from available fields."""
    parts = []
    brand = clean_string(row.get("brands", ""))
    if brand:
        parts.append(brand)
    parts.append(name)

    # Add nutrition highlights
    protein = safe_float(row.get("proteins_100g", 0))
    fiber = safe_float(row.get("fiber_100g", 0))
    if protein and protein > 10:
        parts.append(f"(High protein: {protein:.1f}g/100g)")
    if fiber and fiber > 5:
        parts.append(f"(High fiber: {fiber:.1f}g/100g)")

    desc = " - ".join(parts) if len(parts) > 1 else parts[0]
    return desc[:500]


def run() -> List[Dict]:
    """Run the filtering step. Returns list of filtered products."""
    csv_path = EXTRACTED_PATH
    if not csv_path.exists():
        logger.error("CSV not found at %s. Run download_dataset.py first.", csv_path)
        raise FileNotFoundError(f"Dataset not found: {csv_path}")

    products = filter_and_collect(csv_path)
    logger.info("Collected %d products", len(products))
    return products


if __name__ == "__main__":
    products = run()
    logger.info("Done. Collected %d products.", len(products))
