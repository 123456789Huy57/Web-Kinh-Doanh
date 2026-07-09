"""Test BHX API pagination to find max products per category"""
import requests

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

def v2_getcate(slug, page=1, ps=12):
    h = H.copy()
    h["referer-url"] = f"{BASE}/{slug}"
    h["referer"] = f"{BASE}/{slug}"
    params = {
        "provinceId": "1027", "wardId": "0", "districtId": "0",
        "storeId": "2546", "categoryUrl": slug,
        "isMobile": "true", "isV2": "true",
        "pageSize": str(ps), "page": str(page),
    }
    r = requests.get(f"{API}/Category/V2/GetCate", headers=h, params=params, timeout=15)
    return r.json()

# Test 1: V2 pages across 10 pages — see if ids change
print("=== V2 GetCate pagination (rau-sach) ===")
all_ids = set()
for pg in range(1, 15):
    d = v2_getcate("rau-sach", pg)
    prods = d.get("data", {}).get("products", [])
    ids = [p["id"] for p in prods]
    new = set(ids) - all_ids
    all_ids.update(ids)
    print(f"  page={pg}: got={len(prods)}, new={len(new)}, ids={[i for i in ids][:3]}")
print(f"  UNIQUE total: {len(all_ids)}")

# Test 2: Search endpoint
print("\n=== Search endpoint ===")
for kw in ["thit", "rau", "sua"]:
    h = H.copy()
    h["referer-url"] = f"{BASE}/tim-kiem"
    h["referer"] = f"{BASE}/tim-kiem"
    params = {"provinceId": "1027", "wardId": "0", "storeId": "2546", "keyword": kw, "pageSize": "50", "page": "1"}
    try:
        r = requests.get(f"{API}/Product/Search", headers=h, params=params, timeout=15)
        d = r.json()
        if "data" in d:
            dd = d["data"]
            if isinstance(dd, list):
                print(f"  '{kw}': returned={len(dd)}")
            elif isinstance(dd, dict):
                prods = dd.get("products", [])
                print(f"  '{kw}': returned={len(prods)}, total={dd.get('total', 0)}")
        else:
            print(f"  '{kw}': keys={list(d.keys())}")
    except Exception as e:
        print(f"  '{kw}': ERROR={e}")

# Test 3: Different subcategory slugs — find ALL subcategories
print("\n=== Explore all child slugs under rau-sach category ===")
# Try with cateId from V1 API
h = H.copy()
h["referer-url"] = f"{BASE}/rau-sach"
h["referer"] = f"{BASE}/rau-sach"
for cateId in [8820, 8785, 8781, 8788]:
    params = {"provinceId": "1027", "storeId": "2546", "cateId": str(cateId), "pageSize": "50", "page": "1"}
    try:
        r = requests.get(f"{API}/Category/GetCate", headers=h, params=params, timeout=15)
        d = r.json()
        dd = d.get("data", {})
        if isinstance(dd, dict):
            prods = dd.get("products", [])
            print(f"  cateId={cateId}: returned={len(prods)}, total={dd.get('total', 0)}")
        else:
            print(f"  cateId={cateId}: data type={type(dd)}")
    except Exception as e:
        print(f"  cateId={cateId}: ERROR={e}")

# Test 4: Try GetCateV2 with subcategoryUrl params
print("\n=== V2 with childCategoryUrl ===")
for child in ["ca-ngong", "cai-ngong", "rau-muong", "rau-muon", "rau-mam"]:
    h = H.copy()
    h["referer-url"] = f"{BASE}/rau-sach"
    h["referer"] = f"{BASE}/rau-sach"
    params = {"provinceId": "1027", "wardId": "0", "districtId": "0", "storeId": "2546",
              "categoryUrl": "rau-sach", "childCategoryUrl": child,
              "isMobile": "true", "isV2": "true", "pageSize": "50", "page": "1"}
    r = requests.get(f"{API}/Category/V2/GetCate", headers=h, params=params, timeout=15)
    d = r.json()
    prods = d.get("data", {}).get("products", [])
    total = d.get("data", {}).get("total", 0)
    print(f"  child={child}: total={total}, returned={len(prods)}")
