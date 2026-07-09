"""
Generate realistic Vietnamese Dong prices per category.
"""

import logging
import random
from typing import Dict, List

from utils import setup_logger

logger = setup_logger("generate_prices")

# Price ranges in VND per category (min, max)
PRICE_RANGES: Dict[str, tuple] = {
    "Vegetables": (5_000, 90_000),
    "Fruits": (10_000, 250_000),
    "Meat": (50_000, 600_000),
    "Seafood": (70_000, 800_000),
    "Milk": (20_000, 400_000),
    "Beverages": (6_000, 150_000),
    "Instant Noodles": (3_000, 25_000),
    "Snacks": (5_000, 120_000),
    "Frozen Foods": (20_000, 300_000),
    "Rice": (15_000, 200_000),
    "Cooking Oil": (30_000, 350_000),
    "Sauce": (15_000, 180_000),
    "Seasoning": (8_000, 150_000),
    "Bakery": (10_000, 120_000),
    "Coffee": (30_000, 500_000),
    "Tea": (20_000, 300_000),
    "Candy": (5_000, 150_000),
    "Personal Care": (25_000, 400_000),
    "Baby": (30_000, 500_000),
    "Pet": (20_000, 400_000),
    "Cleaning": (15_000, 250_000),
    "Others": (10_000, 200_000),
}

# Sale probability per category
SALE_PROBABILITY = 0.20  # ~20% of products on sale
SALE_DISCOUNT_RANGE = (0.05, 0.30)  # 5-30% off


def generate_price(category: str) -> int:
    """Generate a realistic price for a category in VND."""
    min_price, max_price = PRICE_RANGES.get(category, PRICE_RANGES["Others"])

    # Use log-normal distribution for more natural price spread
    # Most products cluster near lower end, few expensive ones
    log_min = min_price
    log_max = max_price

    # Generate using log-uniform distribution
    log_price = random.uniform(
        min_price ** 0.5,
        max_price ** 0.5,
    )
    price = int(log_price ** 2)

    # Round to nearest 1000 VND
    price = round(price / 1000) * 1000

    # Clamp
    price = max(min_price, min(max_price, price))
    return price


def generate_sale_price(price: int) -> int:
    """Generate a sale price (discounted)."""
    discount = random.uniform(*SALE_DISCOUNT_RANGE)
    sale_price = int(price * (1 - discount))
    sale_price = round(sale_price / 1000) * 1000
    return max(1000, sale_price)


def apply_prices(products: List[Dict]) -> List[Dict]:
    """Add price, salePrice, stock, sold, rating, reviewCount to products."""
    logger.info("Generating prices for %d products...", len(products))

    for product in products:
        category = product["category"]
        price = generate_price(category)
        product["price"] = price

        # ~20% chance of sale
        if random.random() < SALE_PROBABILITY:
            product["salePrice"] = generate_sale_price(price)
        else:
            product["salePrice"] = None

        # Stock: 10-500 units
        product["stock"] = random.randint(10, 500)

        # Sold: 0-2000 (some popular, some new)
        product["sold"] = random.randint(0, 2000)

        # Rating: 3.5-5.0 (weighted toward higher)
        product["rating"] = round(random.uniform(3.5, 5.0), 1)

        # Review count: 0-500
        product["reviewCount"] = random.randint(0, 500)

        # Featured: ~10% chance
        product["featured"] = random.random() < 0.10

        # Active: always true for now
        product["active"] = True

    logger.info("Price generation complete.")
    return products


def run(products: List[Dict]) -> List[Dict]:
    """Run price generation step."""
    return apply_prices(products)


if __name__ == "__main__":
    logger.info("Run via main.py")