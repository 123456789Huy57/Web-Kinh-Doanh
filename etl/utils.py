"""
Utility module for ETL pipeline.
Shared helper functions for logging, file I/O, ID generation.
"""

import logging
import sys
import hashlib
import re
import json
from pathlib import Path
from typing import Any, Dict, Optional, Set, List
from datetime import datetime

from slugify import slugify


# ============================================================
# LOGGING
# ============================================================
def setup_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """Configure and return a logger with console handler."""
    logger = logging.getLogger(name)
    logger.setLevel(level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        fmt = logging.Formatter(
            "[%(asctime)s] %(levelname)-8s %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(fmt)
        logger.addHandler(handler)

    return logger


# ============================================================
# ID / SKU GENERATION
# ============================================================
def generate_sku(index: int, prefix: str = "BHX") -> str:
    """Generate a unique SKU: BHX-{category-short}-{6-digit-padded-id}."""
    return f"{prefix}-{index:06d}"


def generate_slug(name: str, sku: str) -> str:
    """Generate URL-safe slug from product name and SKU."""
    base = slugify(name[:80])
    if not base:
        base = f"product-{sku.lower()}"
    return f"{base}-{sku.lower()}"


def generate_product_id(index: int) -> str:
    """Generate product ID like p-000001."""
    return f"p-{index:06d}"


# ============================================================
# STRING CLEANING
# ============================================================
def clean_string(value: Optional[str]) -> Optional[str]:
    """Strip whitespace, collapse multiple spaces, handle None."""
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None
    value = re.sub(r"\s+", " ", value)
    return value


def safe_int(value: Any, default: int = 0) -> int:
    """Safely convert value to int."""
    if value is None:
        return default
    try:
        return int(float(str(value)))
    except (ValueError, TypeError):
        return default


def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely convert value to float."""
    if value is None:
        return default
    try:
        return float(str(value))
    except (ValueError, TypeError):
        return default


# ============================================================
# VALIDATION
# ============================================================
def rewrite_image_url(url: str) -> str:
    """Rewrite image URL to use accessible CDN."""
    # images.openfoodfacts.org → static.openfoodfacts.org
    url = url.replace("images.openfoodfacts.org", "static.openfoodfacts.org")
    # images.openfoodfacts.net → static.openfoodfacts.org
    url = url.replace("images.openfoodfacts.net", "static.openfoodfacts.org")
    return url

def is_valid_image_url(url: Optional[str]) -> bool:
    """Check if URL looks like a valid image URL."""
    if not url:
        return False
    url = str(url).strip()
    # Must start with http
    if not url.startswith("http"):
        return False
    # Reject Open Food Facts "invalid" placeholder images
    if "/invalid/" in url:
        return False
    # Open Food Facts image URLs
    if "openfoodfacts.org" in url or "openfoodfacts.net" in url:
        return True
    # Accept URLs with image-like patterns
    if any(ext in url.lower() for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]):
        return True
    # Accept any http URL that looks like a product image
    if "product" in url.lower() or "image" in url.lower() or "photo" in url.lower():
        return True
    return False


# ============================================================
# JSON ENCODER
# ============================================================
class CustomEncoder(json.JSONEncoder):
    """JSON encoder that handles non-serializable types."""
    def default(self, obj: Any) -> Any:
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Path):
            return str(obj)
        if isinstance(obj, set):
            return list(obj)
        return super().default(obj)


# ============================================================
# DEDUP
# ============================================================
def build_fingerprint(name: str, brand: Optional[str]) -> str:
    """Build a fingerprint for dedup (name + brand, lowercased)."""
    n = clean_string(name) or ""
    b = clean_string(brand) or ""
    return f"{n.lower().strip()}|{b.lower().strip()}"
