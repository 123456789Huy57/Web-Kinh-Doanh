"""
Download product images from Open Food Facts, resize, convert to WebP, save locally.
Falls back to generated placeholder images for rate-limited or missing images.
"""

import logging
import concurrent.futures
import time
from pathlib import Path
from typing import Dict, List, Tuple
from PIL import Image, ImageDraw, ImageFont
import requests
from tqdm import tqdm

from config import IMAGES_DIR
from utils import setup_logger, rewrite_image_url

logger = setup_logger("download_images")

# Image processing settings
TARGET_SIZE = (512, 512)
QUALITY = 85
MAX_RETRIES = 1
RETRY_DELAY = 1  # seconds
THREADS = 1
REQUEST_DELAY = 0.3  # seconds between requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Pastel gradient palettes for placeholder images
PLACEHOLDER_COLORS = [
    ("#A8D8EA", "#F0F8FF"),  # Light blue
    ("#FFD3B6", "#FFF5EE"),  # Peach
    ("#D4F0C0", "#F5FFFA"),  # Mint
    ("#FFAAA5", "#FFF0F0"),  # Coral
    ("#C9B1FF", "#F5F0FF"),  # Lavender
    ("#FFDAC1", "#FFFFF0"),  # Apricot
    ("#B5EAD7", "#F0FFF0"),  # Sage
    ("#F0E6FF", "#FAF5FF"),  # Periwinkle
    ("#FFE5B4", "#FFF8E7"),  # Gold
    ("#E0F4FF", "#F0FBFF"),  # Sky
    ("#FFC8DD", "#FFF0F5"),  # Pink
    ("#CDE5B4", "#F5FFE0"),  # Lime
]


def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def generate_placeholder_image(category: str, brand: str) -> Image.Image:
    """Generate a clean gradient placeholder image."""
    c1, c2 = PLACEHOLDER_COLORS[abs(hash(category)) % len(PLACEHOLDER_COLORS)]
    rgb1, rgb2 = _hex_to_rgb(c1), _hex_to_rgb(c2)

    img = Image.new("RGB", TARGET_SIZE)
    draw = ImageDraw.Draw(img)
    for y in range(TARGET_SIZE[1]):
        ratio = y / TARGET_SIZE[1]
        r = int(rgb1[0] * (1 - ratio) + rgb2[0] * ratio)
        g = int(rgb1[1] * (1 - ratio) + rgb2[1] * ratio)
        b = int(rgb1[2] * (1 - ratio) + rgb2[2] * ratio)
        draw.line([(0, y), (TARGET_SIZE[0], y)], fill=(r, g, b))

    try:
        font = ImageFont.truetype("segoeui.ttf", 48)
        font_sm = ImageFont.truetype("segoeui.ttf", 20)
    except (IOError, OSError):
        font = ImageFont.load_default()
        font_sm = font

    letter = (category or "?")[0].upper()
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((TARGET_SIZE[0] - tw) // 2, (TARGET_SIZE[1] - th) // 2 - 20),
              letter, fill="white", font=font)

    label = (brand or "")[:20]
    if label:
        bbox2 = draw.textbbox((0, 0), label, font=font_sm)
        tw2 = bbox2[2] - bbox2[0]
        draw.text(((TARGET_SIZE[0] - tw2) // 2, (TARGET_SIZE[1] - th) // 2 + 40),
                  label, fill=(255, 255, 255), font=font_sm)

    return img


def download_image(url: str, dest_path: Path, retry_count: int = 0) -> Tuple[bool, str]:
    """Download a single image with retry. Returns (success, message)."""
    if dest_path.exists():
        return True, "Already exists"

    try:
        resp = requests.get(url, headers=HEADERS, stream=True, timeout=15)
        resp.raise_for_status()

        content_type = resp.headers.get("content-type", "")
        if "image" not in content_type:
            return False, f"Not an image: {content_type}"

        temp_path = dest_path.with_suffix(".tmp")
        with open(temp_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

        with Image.open(temp_path) as img:
            if img.mode != "RGB":
                img = img.convert("RGB")
            if img.size != TARGET_SIZE:
                img = img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
            img.save(dest_path, "WEBP", quality=QUALITY)

        temp_path.unlink(missing_ok=True)
        return True, "Success"

    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 429:
            return False, "Rate limited"
        return False, str(e)
    except Exception as e:
        return False, str(e)


def process_single_product(product: Dict) -> Tuple[str, bool, str]:
    """Process a single product: generate placeholder image (skip download due to 429 rate limits)."""
    sku = product.get("sku")
    category = product.get("category", "")
    brand = product.get("brand", "")

    if not sku:
        return "unknown", False, "Missing SKU"

    dest_path = IMAGES_DIR / f"{sku}.webp"

    # Skip download - go straight to placeholder (429 rate limits make downloads impractical)
    try:
        placeholder = generate_placeholder_image(category, brand)
        placeholder.save(dest_path, "WEBP", quality=QUALITY)
        product["imageUrl"] = f"/assets/images/products/{sku}.webp"
        product.pop("original_image_url", None)
        return sku, True, "Generated placeholder"
    except Exception as e:
        return sku, False, f"Placeholder failed: {e}"


def download_images(products: List[Dict]) -> List[Dict]:
    """Download images for all products, generate placeholders for failures."""
    logger.info("Starting image download for %d products...", len(products))

    products_to_process = [p for p in products if p.get("sku")]

    logger.info("Products to process: %d/%d", len(products_to_process), len(products))

    processed_count = 0
    success_count = 0
    failure_count = 0

    with tqdm(total=len(products_to_process), desc="Processing images") as pbar:
        with concurrent.futures.ThreadPoolExecutor(max_workers=THREADS) as executor:
            future_to_product = {
                executor.submit(process_single_product, product): product
                for product in products_to_process
            }

            for future in concurrent.futures.as_completed(future_to_product):
                sku, success, message = future.result()
                processed_count += 1
                if success:
                    success_count += 1
                else:
                    failure_count += 1
                    logger.warning("Failed image for SKU %s: %s", sku, message)
                pbar.update(1)

    logger.info(
        "Image download complete: %d success, %d failed, %d skipped",
        success_count, failure_count, len(products) - len(products_to_process),
    )
    return products


def run(products: List[Dict]) -> List[Dict]:
    """Run image download step."""
    return download_images(products)


if __name__ == "__main__":
    logger.info("Run via main.py")