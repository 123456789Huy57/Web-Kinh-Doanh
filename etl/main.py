"""
Main entry point for ETL pipeline.
Orchestrates all steps: download → filter → normalize → prices → images → export.
"""

import sys
import time
from pathlib import Path

from config import DATA_DIR, IMAGES_DIR
from utils import setup_logger

logger = setup_logger("main")


def print_header():
    """Print pipeline header."""
    print("""
╔═══════════════════════════════════════════════════════════╗
║        BÁCH HÓA TƯƠI — ETL Pipeline v1.0                ║
║        ~10,000 grocery products from Open Food Facts     ║
╚═══════════════════════════════════════════════════════════╝
    """)


def run_pipeline():
    """Execute the complete ETL pipeline."""
    print_header()
    pipeline_start = time.time()

    # ── Step 1: Download dataset ──
    logger.info("STEP 1/7: Downloading Open Food Facts dataset...")
    from download_dataset import run as download
    csv_path = download()
    logger.info("Dataset ready: %s", csv_path)

    # ── Step 2: Filter products ──
    logger.info("STEP 2/7: Filtering and collecting products...")
    from filter_products import run as filter_products
    filtered = filter_products()
    logger.info("Collected %d filtered products", len(filtered))

    # ── Step 3: Normalize ──
    logger.info("STEP 3/7: Normalizing products (IDs, slugs, descriptions)...")
    from normalize import run as normalize
    normalized = normalize(filtered)
    logger.info("Normalized %d products", len(normalized))

    # ── Step 4: Generate prices ──
    logger.info("STEP 4/7: Generating prices in VND...")
    from generate_prices import run as generate_prices
    priced = generate_prices(normalized)
    logger.info("Prices generated for %d products", len(priced))

    # ── Step 5: Download images ──
    logger.info("STEP 5/7: Downloading product images...")
    from download_images import run as download_images
    with_images = download_images(priced)
    logger.info("Images processed for %d products", len(with_images))

    # ── Step 6: Export to JSON ──
    logger.info("STEP 6/7: Exporting to JSON...")
    from export_json import run as export_json
    json_paths = export_json(with_images)
    for name, path in json_paths.items():
        logger.info("  ✓ %s → %s", name, path)

    # ── Step 7: Export to SQL ──
    logger.info("STEP 7/7: Exporting to SQL...")
    from export_mysql import run as export_mysql
    sql_path = export_mysql(with_images)
    logger.info("  ✓ SQL → %s", sql_path)

    # ── Summary ──
    elapsed = time.time() - pipeline_start
    print()
    print("=" * 60)
    print(f"✅ PIPELINE COMPLETE")
    print(f"   Products exported: {len(with_images)}")
    print(f"   Total time: {elapsed:.1f}s ({elapsed/60:.1f} min)")
    print(f"   Files:")
    print(f"     • {json_paths['products']}")
    print(f"     • {json_paths['categories']}")
    print(f"     • {json_paths['brands']}")
    print(f"     • {sql_path}")
    print(f"     • {DATA_DIR / 'openfoodfacts.csv.gz'}")
    print(f"   Images: {IMAGES_DIR}")
    print("=" * 60)


def run_quick():
    """Run pipeline for testing (only first 100 products)."""
    import config
    config.TARGET_PRODUCT_COUNT = 100
    run_pipeline()


if __name__ == "__main__":
    if "--quick" in sys.argv:
        run_quick()
    else:
        run_pipeline()