"""
Configuration module for ETL pipeline.
Centralizes all settings, paths, and constants.
"""

import os
from pathlib import Path
from typing import Dict, List, Tuple


# ============================================================
# PATHS — check D: (527GB free) first, fallback project root
# ============================================================
PROJECT_ROOT = Path(__file__).parent.parent
ETL_DIR = Path(__file__).parent

_D_BASE = Path("D:/AI-Nutrition-Commerce")
if _D_BASE.exists():
    DATA_DIR = _D_BASE / "data"
    ASSETS_DIR = _D_BASE / "assets"
else:
    DATA_DIR = PROJECT_ROOT / "data"
    ASSETS_DIR = PROJECT_ROOT / "assets"

IMAGES_DIR = ASSETS_DIR / "images" / "products"

# Ensure directories exist
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# DATASET CONFIG
# ============================================================
OPENFOODFACTS_URL = "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"
DATASET_PATH = DATA_DIR / "openfoodfacts.csv.gz"
EXTRACTED_PATH = DATA_DIR / "openfoodfacts.csv"

# Target product count
TARGET_PRODUCT_COUNT = 10000

# Streaming chunk size
CHUNK_SIZE = 10000


# ============================================================
# CATEGORY NORMALIZATION
# ============================================================
# Target categories (Vietnamese grocery style)
TARGET_CATEGORIES = [
    "Vegetables",
    "Fruits",
    "Meat",
    "Seafood",
    "Milk",
    "Beverages",
    "Instant Noodles",
    "Snacks",
    "Frozen Foods",
    "Rice",
    "Cooking Oil",
    "Sauce",
    "Seasoning",
    "Bakery",
    "Coffee",
    "Tea",
    "Candy",
    "Personal Care",
    "Baby",
    "Pet",
    "Cleaning",
    "Others",
]

# Mapping from OpenFoodFacts categories to target categories
CATEGORY_MAPPING: Dict[str, str] = {
    # Vegetables
    "vegetables": "Vegetables",
    "vegetable": "Vegetables",
    "root-vegetables": "Vegetables",
    "leafy-vegetables": "Vegetables",
    "cabbages": "Vegetables",
    "salads": "Vegetables",
    "tomatoes": "Vegetables",
    "carrots": "Vegetables",
    "potatoes": "Vegetables",
    "onions": "Vegetables",
    "garlic": "Vegetables",
    "peppers": "Vegetables",
    "cucumbers": "Vegetables",
    "eggplants": "Vegetables",
    "zucchinis": "Vegetables",
    "mushrooms": "Vegetables",
    "legumes": "Vegetables",
    "beans": "Vegetables",
    "peas": "Vegetables",
    "lentils": "Vegetables",
    "sprouts": "Vegetables",
    "herbs": "Vegetables",
    "spices": "Vegetables",
    "aromatic-herbs": "Vegetables",
    "edible-plants": "Vegetables",
    "seaweeds": "Vegetables",
    "algae": "Vegetables",

    # Fruits
    "fruits": "Fruits",
    "fruit": "Fruits",
    "citrus-fruits": "Fruits",
    "berries": "Fruits",
    "tropical-fruits": "Fruits",
    "stone-fruits": "Fruits",
    "pome-fruits": "Fruits",
    "melons": "Fruits",
    "apples": "Fruits",
    "bananas": "Fruits",
    "oranges": "Fruits",
    "grapes": "Fruits",
    "strawberries": "Fruits",
    "mangoes": "Fruits",
    "pineapples": "Fruits",
    "avocados": "Fruits",
    "pears": "Fruits",
    "peaches": "Fruits",
    "plums": "Fruits",
    "cherries": "Fruits",
    "kiwis": "Fruits",
    "watermelons": "Fruits",
    "cantaloupes": "Fruits",
    "dried-fruits": "Fruits",
    "nuts": "Fruits",
    "seeds": "Fruits",

    # Meat
    "meat": "Meat",
    "beef": "Meat",
    "pork": "Meat",
    "chicken": "Meat",
    "poultry": "Meat",
    "lamb": "Meat",
    "duck": "Meat",
    "turkey": "Meat",
    "game-meat": "Meat",
    "offal": "Meat",
    "processed-meat": "Meat",
    "sausages": "Meat",
    "ham": "Meat",
    "bacon": "Meat",
    "cured-meat": "Meat",
    "charcuterie": "Meat",

    # Seafood
    "seafood": "Seafood",
    "fish": "Seafood",
    "shellfish": "Seafood",
    "crustaceans": "Seafood",
    "mollusks": "Seafood",
    "salmon": "Seafood",
    "tuna": "Seafood",
    "cod": "Seafood",
    "shrimp": "Seafood",
    "prawns": "Seafood",
    "crab": "Seafood",
    "lobster": "Seafood",
    "squid": "Seafood",
    "octopus": "Seafood",
    "mussels": "Seafood",
    "clams": "Seafood",
    "oysters": "Seafood",
    "scallops": "Seafood",
    "anchovies": "Seafood",
    "sardines": "Seafood",
    "mackerel": "Seafood",
    "herring": "Seafood",
    "smoked-fish": "Seafood",
    "canned-fish": "Seafood",

    # Milk / Dairy
    "dairy": "Milk",
    "milk": "Milk",
    "cheese": "Milk",
    "yogurt": "Milk",
    "butter": "Milk",
    "cream": "Milk",
    "ice-cream": "Milk",
    "dairy-desserts": "Milk",
    "plant-based-milk": "Milk",
    "soy-milk": "Milk",
    "almond-milk": "Milk",
    "oat-milk": "Milk",
    "coconut-milk": "Milk",
    "condensed-milk": "Milk",
    "powdered-milk": "Milk",
    "infant-formula": "Milk",

    # Beverages
    "beverages": "Beverages",
    "drinks": "Beverages",
    "water": "Beverages",
    "mineral-water": "Beverages",
    "sparkling-water": "Beverages",
    "soft-drinks": "Beverages",
    "sodas": "Beverages",
    "juices": "Beverages",
    "fruit-juices": "Beverages",
    "vegetable-juices": "Beverages",
    "nectars": "Beverages",
    "smoothies": "Beverages",
    "energy-drinks": "Beverages",
    "sports-drinks": "Beverages",
    "flavored-water": "Beverages",
    "syrups": "Beverages",
    "concentrates": "Beverages",
    "alcoholic-beverages": "Beverages",
    "beer": "Beverages",
    "wine": "Beverages",
    "spirits": "Beverages",
    "cider": "Beverages",

    # Instant Noodles
    "instant-noodles": "Instant Noodles",
    "noodles": "Instant Noodles",
    "ramen": "Instant Noodles",
    "pasta": "Instant Noodles",
    "vermicelli": "Instant Noodles",
    "pho": "Instant Noodles",
    "bun": "Instant Noodles",
    "hu-tieu": "Instant Noodles",
    "mien": "Instant Noodles",

    # Snacks
    "snacks": "Snacks",
    "snack": "Snacks",
    "chips": "Snacks",
    "crisps": "Snacks",
    "popcorn": "Snacks",
    "pretzels": "Snacks",
    "crackers": "Snacks",
    "biscuits": "Snacks",
    "cookies": "Snacks",
    "wafers": "Snacks",
    "nuts-and-seeds": "Snacks",
    "trail-mix": "Snacks",
    "granola-bars": "Snacks",
    "protein-bars": "Snacks",
    "cereal-bars": "Snacks",

    # Frozen Foods
    "frozen-foods": "Frozen Foods",
    "frozen": "Frozen Foods",
    "frozen-vegetables": "Frozen Foods",
    "frozen-fruits": "Frozen Foods",
    "frozen-meat": "Frozen Foods",
    "frozen-seafood": "Frozen Foods",
    "frozen-meals": "Frozen Foods",
    "frozen-pizza": "Frozen Foods",
    "frozen-desserts": "Frozen Foods",
    "ice-cream": "Frozen Foods",

    # Rice
    "rice": "Rice",
    "grains": "Rice",
    "cereals": "Rice",
    "breakfast-cereals": "Rice",
    "muesli": "Rice",
    "granola": "Rice",
    "oats": "Rice",
    "quinoa": "Rice",
    "couscous": "Rice",
    "bulgur": "Rice",
    "polenta": "Rice",

    # Cooking Oil
    "oils": "Cooking Oil",
    "cooking-oils": "Cooking Oil",
    "vegetable-oils": "Cooking Oil",
    "olive-oil": "Cooking Oil",
    "sunflower-oil": "Cooking Oil",
    "canola-oil": "Cooking Oil",
    "coconut-oil": "Cooking Oil",
    "palm-oil": "Cooking Oil",
    "sesame-oil": "Cooking Oil",
    "peanut-oil": "Cooking Oil",
    "soybean-oil": "Cooking Oil",
    "corn-oil": "Cooking Oil",
    "rapeseed-oil": "Cooking Oil",
    "grapeseed-oil": "Cooking Oil",
    "avocado-oil": "Cooking Oil",
    "margarine": "Cooking Oil",
    "shortening": "Cooking Oil",
    "lard": "Cooking Oil",
    "butter": "Cooking Oil",
    "ghee": "Cooking Oil",

    # Sauce
    "sauces": "Sauce",
    "sauce": "Sauce",
    "condiments": "Sauce",
    "ketchup": "Sauce",
    "mayonnaise": "Sauce",
    "mustard": "Sauce",
    "soy-sauce": "Sauce",
    "fish-sauce": "Sauce",
    "oyster-sauce": "Sauce",
    "hoisin-sauce": "Sauce",
    "teriyaki-sauce": "Sauce",
    "bbq-sauce": "Sauce",
    "hot-sauce": "Sauce",
    "chili-sauce": "Sauce",
    "sriracha": "Sauce",
    "pesto": "Sauce",
    "pasta-sauce": "Sauce",
    "tomato-sauce": "Sauce",
    "marinades": "Sauce",
    "dressings": "Sauce",
    "vinaigrette": "Sauce",

    # Seasoning
    "seasonings": "Seasoning",
    "seasoning": "Seasoning",
    "spices": "Seasoning",
    "herbs": "Seasoning",
    "salt": "Seasoning",
    "pepper": "Seasoning",
    "sugar": "Seasoning",
    "vinegar": "Seasoning",
    "baking-powder": "Seasoning",
    "baking-soda": "Seasoning",
    "yeast": "Seasoning",
    "vanilla": "Seasoning",
    "cinnamon": "Seasoning",
    "cumin": "Seasoning",
    "turmeric": "Seasoning",
    "paprika": "Seasoning",
    "curry": "Seasoning",
    "bouillon": "Seasoning",
    "stock": "Seasoning",
    "msg": "Seasoning",

    # Bakery
    "bakery": "Bakery",
    "bread": "Bakery",
    "rolls": "Bakery",
    "buns": "Bakery",
    "bagels": "Bakery",
    "croissants": "Bakery",
    "pastries": "Bakery",
    "cakes": "Bakery",
    "pies": "Bakery",
    "tarts": "Bakery",
    "donuts": "Bakery",
    "muffins": "Bakery",
    "scones": "Bakery",
    "cookies": "Bakery",
    "biscuits": "Bakery",
    "crackers": "Bakery",
    "flatbread": "Bakery",
    "tortillas": "Bakery",
    "naan": "Bakery",
    "pita": "Bakery",

    # Coffee
    "coffee": "Coffee",
    "coffee-beans": "Coffee",
    "ground-coffee": "Coffee",
    "instant-coffee": "Coffee",
    "decaf-coffee": "Coffee",
    "coffee-pods": "Coffee",
    "coffee-capsules": "Coffee",

    # Tea
    "tea": "Tea",
    "black-tea": "Tea",
    "green-tea": "Tea",
    "white-tea": "Tea",
    "herbal-tea": "Tea",
    "fruit-tea": "Tea",
    "matcha": "Tea",
    "chai": "Tea",
    "earl-grey": "Tea",
    "jasmine-tea": "Tea",
    "oolong-tea": "Tea",
    "pu-erh": "Tea",
    "rooibos": "Tea",
    "chamomile": "Tea",
    "peppermint-tea": "Tea",
    "ginger-tea": "Tea",
    "iced-tea": "Tea",
    "bubble-tea": "Tea",

    # Candy
    "candy": "Candy",
    "confectionery": "Candy",
    "sweets": "Candy",
    "chocolate": "Candy",
    "chocolate-bars": "Candy",
    "chocolate-truffles": "Candy",
    "caramels": "Candy",
    "toffees": "Candy",
    "fudge": "Candy",
    "marshmallows": "Candy",
    "gummies": "Candy",
    "jelly-beans": "Candy",
    "licorice": "Candy",
    "hard-candy": "Candy",
    "lollipops": "Candy",
    "chewing-gum": "Candy",
    "mints": "Candy",

    # Personal Care
    "personal-care": "Personal Care",
    "cosmetics": "Personal Care",
    "skincare": "Personal Care",
    "haircare": "Personal Care",
    "oral-care": "Personal Care",
    "deodorants": "Personal Care",
    "perfumes": "Personal Care",
    "soaps": "Personal Care",
    "shower-gels": "Personal Care",
    "shampoos": "Personal Care",
    "conditioners": "Personal Care",
    "toothpaste": "Personal Care",
    "mouthwash": "Personal Care",
    "dental-floss": "Personal Care",
    "razors": "Personal Care",
    "shaving-cream": "Personal Care",
    "sunscreen": "Personal Care",
    "moisturizers": "Personal Care",
    "lotions": "Personal Care",

    # Baby
    "baby": "Baby",
    "baby-food": "Baby",
    "infant-food": "Baby",
    "baby-formula": "Baby",
    "baby-snacks": "Baby",
    "baby-drinks": "Baby",
    "diapers": "Baby",
    "wipes": "Baby",
    "baby-care": "Baby",
    "baby-toiletries": "Baby",

    # Pet
    "pet-food": "Pet",
    "dog-food": "Pet",
    "cat-food": "Pet",
    "pet-treats": "Pet",
    "pet-care": "Pet",
    "cat-litter": "Pet",

    # Cleaning
    "cleaning": "Cleaning",
    "household-cleaning": "Cleaning",
    "detergents": "Cleaning",
    "laundry-detergent": "Cleaning",
    "dishwashing": "Cleaning",
    "cleaning-products": "Cleaning",
    "bleach": "Cleaning",
    "fabric-softener": "Cleaning",
    "surface-cleaner": "Cleaning",
    "disinfectant": "Cleaning",
    "kitchen-cleaning": "Cleaning",
    "bathroom-cleaning": "Cleaning",
    "glass-cleaner": "Cleaning",
    "floor-cleaner": "Cleaning",
    "trash-bags": "Cleaning",
    "aluminium-foil": "Cleaning",
    "cling-film": "Cleaning",
    "paper-towels": "Cleaning",
}