"""BHX Full Scraper - scrape all 188 slugs"""
import requests
import json
import time
import sys
from pathlib import Path

API = "https://api.bachhoaxanh.com/gw"
BASE = "https://www.bachhoaxanh.com"
H = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
    "xapikey": "bhx-api-core-2022",
    "authorization": "Bearer 5EE81C65659A0C3DC3CB73B6DB9F298B",
    "deviceid": "3c811951-725b-4165-bd51-33fe4270a23b",
    "platform": "webnew",
}

# Get menu
r = requests.get(
    f"{API}/Menu/GetMenuV2",
    params={"ProvinceId": "1027", "WardId": "0", "StoreId": "2546"},
    headers={"User-Agent": "Mozilla/5.0"},
    timeout=15,
)
menus = r.json().get("data", {}).get("menus", [])

all_slugs = {}
def extract(items, parent=""):
    for item in items:
        name = item.get("name", "")
        app_params = item.get("appScreen", {}).get("parameters", {})
        slug = app_params.get("categoryUrl", "") or item.get("url", "")
        if slug and slug != "he-thong-sieu-thi" and not slug.startswith("thuong-hieu"):
            all_slugs[slug] = {"name": name, "parent": parent}
        for child in item.get("childrens", []):
            c_name = child.get("name", "")
            c_params = child.get("appScreen", {}).get("parameters", {})
            c_url = c_params.get("categoryUrl", "") or child.get("url", "")
            if c_url:
                all_slugs[c_url] = {"name": c_name, "parent": name}
            for sub in child.get("childrens", []):
                s_params = sub.get("appScreen", {}).get("parameters", {})
                s_url = s_params.get("categoryUrl", "") or sub.get("url", "")
                if s_url:
                    all_slugs[s_url] = {"name": sub.get("name", ""), "parent": c_name}

extract(menus)
print(f"Total slugs: {len(all_slugs)}", flush=True)

# Scrape each slug
all_products = {}
slug_stats = []

for i, (slug, info) in enumerate(sorted(all_slugs.items())):
    try:
        h = H.copy()
        h["referer-url"] = f"{BASE}/{slug}"
        h["referer"] = f"{BASE}/{slug}"
        params = {
            "provinceId": "1027", "wardId": "0", "districtId": "0",
            "storeId": "2546", "categoryUrl": slug,
            "isMobile": "true", "isV2": "true",
            "pageSize": "12", "page": "1",
        }
        r = requests.get(f"{API}/Category/V2/GetCate", headers=h, params=params, timeout=15)
        d = r.json()
        data = d.get("data", {})
        prods = data.get("products", [])
        total = data.get("total", 0)
        returned = len(prods)

        for p in prods:
            pid = p["id"]
            if pid not in all_products:
                all_products[pid] = p

        if returned > 0:
            slug_stats.append({"slug": slug, "name": info["name"], "total": total, "returned": returned})
            print(f"[{i+1}/{len(all_slugs)}] {slug:35s} total={total:4d} returned={returned:2d} unique={len(all_products)}", flush=True)
        else:
            print(f"[{i+1}/{len(all_slugs)}] {slug:35s} total={total:4d} returned=0", flush=True)

        time.sleep(0.15)
    except Exception as e:
        print(f"[{i+1}/{len(all_slugs)}] {slug:35s} ERROR={e}", flush=True)

print(f"\n=== RESULTS ===")
print(f"Total unique products: {len(all_products)}")
print(f"Slugs with products: {len(slug_stats)}")

# Save
out = Path("data/bhx_full_scrape.json")
out.parent.mkdir(exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump(list(all_products.values()), f, ensure_ascii=False, indent=2)
print(f"Saved {len(all_products)} products to {out}")

# Also save stats
with open("data/bhx_slug_stats.json", "w", encoding="utf-8") as f:
    json.dump(slug_stats, f, ensure_ascii=False, indent=2)
print("Saved slug stats to data/bhx_slug_stats.json")