"""Extract ALL subcategory slugs from BHX menu"""
import requests
import json

r = requests.get(
    "https://api.bachhoaxanh.com/gw/Menu/GetMenuV2",
    params={"ProvinceId": "1027", "WardId": "0", "StoreId": "2546"},
    headers={"User-Agent": "Mozilla/5.0"},
    timeout=15,
)
menus = r.json().get("data", {}).get("menus", [])

all_slugs = {}


def extract(items, parent=""):
    for item in items:
        name = item.get("name", "")
        url = item.get("url", "")
        total = item.get("totalProductInCate", 0)
        app_params = item.get("appScreen", {}).get("parameters", {})
        cat_url = app_params.get("categoryUrl", "")

        # The actual slug for V2 API
        slug = cat_url or url
        if slug and slug != "he-thong-sieu-thi" and not slug.startswith("thuong-hieu"):
            all_slugs[slug] = {"name": name, "parent": parent, "total": total}

        for child in item.get("childrens", []):
            c_name = child.get("name", "")
            c_params = child.get("appScreen", {}).get("parameters", {})
            c_url = c_params.get("categoryUrl", "") or child.get("url", "")
            if c_url:
                all_slugs[c_url] = {
                    "name": c_name,
                    "parent": name,
                    "total": child.get("totalProductInCate", 0),
                }
            for sub in child.get("childrens", []):
                s_params = sub.get("appScreen", {}).get("parameters", {})
                s_url = s_params.get("categoryUrl", "") or sub.get("url", "")
                if s_url:
                    all_slugs[s_url] = {
                        "name": sub.get("name", ""),
                        "parent": c_name,
                        "total": sub.get("totalProductInCate", 0),
                    }


extract(menus)
print("Total slugs: {}".format(len(all_slugs)))

# Print them sorted
for slug, info in sorted(all_slugs.items()):
    t = info["total"]
    n = info["name"]
    p = info["parent"]
    print("{:35s} total={:5d}  {:30s} [{}]".format(slug, t, n, p))
