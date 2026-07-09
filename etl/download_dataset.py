"""
Download and extract Open Food Facts dataset.
Streams the gzipped CSV directly without loading into memory.
"""

import gzip
import shutil
import logging
from pathlib import Path

import requests
from tqdm import tqdm

from config import OPENFOODFACTS_URL, DATASET_PATH, EXTRACTED_PATH
from utils import setup_logger

logger = setup_logger("download_dataset")


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def download_file(url: str, dest: Path, resume: bool = True) -> Path:
    """
    Download a file with resume support and progress bar.

    Args:
        url: Source URL.
        dest: Destination path.
        resume: If True, attempt to resume partial download.

    Returns:
        Path to downloaded file.
    """
    headers = dict(HEADERS)
    mode = "wb"
    already_have = 0

    if resume and dest.exists():
        already_have = dest.stat().st_size
        if already_have > 0:
            headers["Range"] = f"bytes={already_have}-"
            mode = "ab"
            logger.info("Resuming download from byte %d", already_have)

    logger.info("Downloading %s → %s", url, dest)
    resp = requests.get(url, headers=headers, stream=True, timeout=300)
    resp.raise_for_status()

    # If server doesn't support Range, start over
    if mode == "ab" and resp.status_code != 206:
        logger.warning("Server does not support resume. Restarting download.")
        mode = "wb"
        already_have = 0

    total = int(resp.headers.get("content-length", 0)) + already_have

    with open(dest, mode) as f, tqdm(
        desc="Downloading",
        total=total,
        unit="B",
        unit_scale=True,
        initial=already_have,
    ) as pbar:
        for chunk in resp.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)
                pbar.update(len(chunk))

    logger.info("Download complete: %s (%.1f MB)", dest, dest.stat().st_size / 1e6)
    return dest


def extract_gz(gz_path: Path, out_path: Path) -> Path:
    """
    Extract a .gz file to CSV.

    Args:
        gz_path: Path to .gz file.
        out_path: Output CSV path.

    Returns:
        Path to extracted CSV.
    """
    if out_path.exists():
        logger.info("Extracted file already exists: %s", out_path)
        return out_path

    logger.info("Extracting %s → %s", gz_path, out_path)
    with gzip.open(gz_path, "rb") as f_in:
        with open(out_path, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

    logger.info("Extraction complete: %s (%.1f MB)", out_path, out_path.stat().st_size / 1e6)
    return out_path


def run() -> Path:
    """Download and extract the Open Food Facts dataset. Returns path to CSV."""
    if not DATASET_PATH.exists():
        download_file(OPENFOODFACTS_URL, DATASET_PATH)
    else:
        logger.info("Compressed dataset already exists: %s", DATASET_PATH)

    extract_gz(DATASET_PATH, EXTRACTED_PATH)
    return EXTRACTED_PATH


if __name__ == "__main__":
    run()
