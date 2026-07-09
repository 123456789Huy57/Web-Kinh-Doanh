"""Test which Tiki parent categories return products via listings API"""
import requests
import json
import time

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://tiki.vn/',
}

# Parent food categories under c4384 (Bách Hóa Online)
PARENT_CATEGORIES = {
    4421: "Đồ Ăn Vặt",
    8275: "Bánh",
    15074: "Thực phẩm Đóng hộp và Khô",
    22998: "Đồ uống",
    4422: "Gia Vị và Chế Biến",
    53562: "Sữa và các Sản phẩm từ sữa",
    53582: "Rượu, bia và nước lên men",
    5451: "Chăm sóc thú cưng",
    11347: "Bộ quà tặng",
    68576: "Ngũ cốc và mứt",
    53558: "Thực phẩm khác",
    5479: "Thực phẩm chay",
    11252: "Thực phẩm cho trẻ em",
    11251: "Thực phẩm bảo vệ sức khỏe",
    8240: "Thực phẩm bổ dưỡng",
}

# Also test mid-level categories
MID_CATEGORIES = {
    4393: "Thực phẩm khô",
    4420: "Thực phẩm ăn liền",
    8274: "Trà",
    4423: "Cà phê",
    5478: "Ngũ cốc, bột",
    8282: "Gia vị",
    8283: "Nước chấm và nước sốt",
    53526: "Thức ăn khô",
    53612: "Nước đóng chai",
    53614: "Nước Trái Cây",
    68660: "Nước ngọt & đồ uống không cồn",
    53616: "Trà Uống Liền",
    8294: "Thực phẩm khô khác",
    4419: "Đồ hộp",
    8276: "Kẹo",
    8277: "Chocolate",
    8278: "Snack",
}

def test_category(cat_id, name, limit=3):
    """Test if category returns products."""
    url = 'https://tiki.vn/api/personalish/v1/blocks/listings'
    params = {'category': cat_id, 'limit': limit, 'page': 1}
    
    try:
        r = requests.get(url, headers=HEADERS, params=params, timeout=10)
        if r.status_code != 200:
            return None, f"HTTP {r.status_code}"
        data = r.json()
        products = data.get('data', [])
        paging = data.get('paging', {})
        total = paging.get('total', 0)
        if products:
            return total, products[0].get('name', 'N/A')
        return 0, "empty"
    except json.JSONDecodeError:
        return None, "blocked"
    except Exception as e:
        return None, str(e)

print("=== PARENT CATEGORIES (c4384 children) ===")
for cat_id, name in PARENT_CATEGORIES.items():
    total, sample = test_category(cat_id, name)
    status = f"{total:>6d} products" if total is not None else "BLOCKED"
    print(f"  {cat_id:>6d}: {name:<40s} {status}  sample={sample[:40] if sample else ''}")
    time.sleep(0.3)

print("\n=== MID-LEVEL CATEGORIES ===")
for cat_id, name in MID_CATEGORIES.items():
    total, sample = test_category(cat_id, name)
    status = f"{total:>6d} products" if total is not None else "BLOCKED"
    print(f"  {cat_id:>6d}: {name:<40s} {status}  sample={sample[:40] if sample else ''}")
    time.sleep(0.3)
