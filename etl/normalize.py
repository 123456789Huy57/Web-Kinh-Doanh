"""
Normalize products: generate SKU, slug, ID, description, tags, badges, dates.
"""

import logging
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from utils import (
    setup_logger,
    clean_string,
    generate_sku,
    generate_slug,
    generate_product_id,
)

logger = setup_logger("normalize")

# Vietnamese description templates per category
DESCRIPTION_TEMPLATES: Dict[str, List[str]] = {
    "Vegetables": [
        "{name} tươi ngon mỗi ngày, giao hàng nhanh.",
        "{name} sạch từ nông trại, đảm bảo chất lượng.",
        "{name} organic, giàu dinh dưỡng cho bữa ăn healthy.",
        "{name} tự nhiên, không hóa chất bảo quản.",
        "{name} chọn lọc kỹ, đóng gói cẩn thận.",
    ],
    "Fruits": [
        "{name} chín mọng, vị ngọt tự nhiên.",
        "{name} tươi ngon, nhập khẩu cao cấp.",
        "{name} theo mùa, giá tốt mỗi ngày.",
        "{name} giàu vitamin, tốt cho sức khỏe.",
        "{name} organic, không thuốc trừ sâu.",
    ],
    "Meat": [
        "{name} tươi sống, kiểm định ATVSTP.",
        "{name} nhập khẩu, đảm bảo chất lượng.",
        "{name} heo sạch, nuôi tự nhiên.",
        "{name} bò Úc cao cấp, thịt mềm thơm.",
        "{name} gà ta, thịt chắc, thơm ngon.",
    ],
    "Seafood": [
        "{name} tươi sống, đánh bắt hàng ngày.",
        "{name} nhập khẩu, bảo quản đông lạnh.",
        "{name} hải sản cao cấp, giao hàng nhanh.",
        "{name} giàu omega-3, tốt cho sức khỏe.",
        "{name} tươi ngon, đóng gói hút chân không.",
    ],
    "Milk": [
        "{name} nguyên kem, dinh dưỡng cao.",
        "{name} Úc cao cấp, phù hợp mọi lứa tuổi.",
        "{name} hữu cơ, tốt cho hệ tiêu hóa.",
        "{name} thơm ngon, bổ sung canxi hàng ngày.",
        "{name} không lactose, phù hợp người nhạy cảm.",
    ],
    "Beverages": [
        "{name} giải khát tuyệt vời cho mùa hè.",
        "{name} tươi mát, không chất tạo màu.",
        "{name} nhập khẩu, hương vị độc đáo.",
        "{name} giàu vitamin C, tăng cường sức đề kháng.",
        "{name} organic, tốt cho sức khỏe.",
    ],
    "Instant Noodles": [
        "{name} tiện lợi, chỉ cần 3 phút.",
        "{name} vị truyền thống, thơm ngon đậm đà.",
        "{name} pack size lớn, tiết kiệm.",
        "{name} phong cách Nhật Bản, hương vị độc đáo.",
        "{name} mì Hàn Quốc, cay nồng hấp dẫn.",
    ],
    "Snacks": [
        "{name} giòn tan, ăn vặt tuyệt vời.",
        "{name} hương vị tự nhiên, không chất bảo quản.",
        "{name} đóng gói nhỏ gọn, mang theo tiện lợi.",
        "{name} healthy snack, ít calo.",
        "{name} snack Hàn Quốc, vị độc đáo.",
    ],
    "Frozen Foods": [
        "{name} đông lạnh, giữ trọn hương vị.",
        "{name} tiện lợi, chỉ cần rã đông và chế biến.",
        "{name} bảo quản đông lạnh, giữ tươi lâu.",
        "{name} portion đóng gói sẵn, tiện lợi cho bữa ăn.",
        "{name} chất lượng cao, không chất bảo quản.",
    ],
    "Rice": [
        "{name} hạt dài, thơm đặc trưng.",
        "{name} organic, trồng theo phương pháp tự nhiên.",
        "{name} Gạo đặc sản miền Tây, hạt trắng trong.",
        "{name} đóng gói kín, giữ nguyên hương vị.",
        "{name} phù hợp nấu cơm và cháo.",
    ],
    "Cooking Oil": [
        "{name} nguyên chất, tốt cho sức khỏe.",
        "{name} không cholesterol, phù hợp mọi món nấu.",
        "{name} ép lạnh, giữ nguyên dưỡng chất.",
        "{name} phù hợp chiên xào và nấu ăn hàng ngày.",
        "{name} đóng chai lớn, tiết kiệm chi phí.",
    ],
    "Sauce": [
        "{name} đậm đà hương vị Việt.",
        "{name} chấm tuyệt vời cho mọi món ăn.",
        "{name} nhập khẩu, hương vị chuẩn quốc tế.",
        "{name} không chất bảo quản, an toàn sức khỏe.",
        "{name} tiện lợi, phù hợp mọi gia đình.",
    ],
    "Seasoning": [
        "{name} thơm nồng, đậm đà.",
        "{name} gia vị truyền thống, tinh túy ẩm thực.",
        "{name} hữu cơ, không hóa chất.",
        "{name} phù hợp mọi món ăn.",
        "{name} đóng gói nhỏ gọn, tiện sử dụng.",
    ],
    "Bakery": [
        "{name} thơm giòn, nướng tươi mỗi ngày.",
        "{name} mềm mịn, vị bơ sữa đậm đà.",
        "{name} handmade, nguyên liệu tự nhiên.",
        "{name} phù hợp bữa sáng và ăn nhẹ.",
        "{name} đóng gói kín giữ tươi.",
    ],
    "Coffee": [
        "{name} rang xay đậm đà, thơm nồng.",
        "{name} Arabica cao cấp, hương vị tinh tế.",
        "{name} robusta Việt Nam, mạnh mẽ vị café.",
        "{name} rang mộc, không hương liệu nhân tạo.",
        "{name} phù hợp pha phin và máy espresso.",
    ],
    "Tea": [
        "{name} lá trà tinh tuyển, hương thơm nhẹ nhàng.",
        "{name} organic, thu hoạch thủ công.",
        "{name} trà xanh Nhật Bản, đậm đà vị trà.",
        "{name} trà thảo mộc, tốt cho sức khỏe.",
        "{name} đóng gói túi lọc tiện lợi.",
    ],
    "Candy": [
        "{name} ngọt ngào, thơm vị socola.",
        "{name} nhập khẩu, hương vị tuyệt hảo.",
        "{name} không đường, phù hợp ăn kiêng.",
        "{name} đóng gói đẹp, làm quà tặng lý tưởng.",
        "{name} vị trái cây tự nhiên, hấp dẫn.",
    ],
    "Personal Care": [
        "{name} nhẹ nhàng cho da và tóc.",
        "{name} công thức mới, hiệu quả cao.",
        "{name} phù hợp mọi loại da.",
        "{name} hương thơm持久, tự tin cả ngày.",
        "{name} organic, an toàn cho家人.",
    ],
    "Baby": [
        "{name} an toàn cho bé yêu.",
        "{name} dinh dưỡng tối ưu cho trẻ sơ sinh.",
        "{name} không gây kích ứng, dịu nhẹ.",
        "{name} nhập khẩu cao cấp, đạt chuẩn quốc tế.",
        "{name} phù hợp độ tuổi từ 6 tháng.",
    ],
    "Pet": [
        "{name} dinh dưỡng cân bằng cho thú cưng.",
        "{name} nguyên liệu tự nhiên, thơm ngon.",
        "{name} bổ sung vitamin và khoáng chất.",
        "{name} phù hợp mọi giống chó/mèo.",
        "{name} đóng gói kín giữ freshness.",
    ],
    "Cleaning": [
        "{name} hiệu quả làm sạch vượt trội.",
        "{name} hương thơm dịu nhẹ, sạch khuẩn.",
        "{name} thành phần tự nhiên, an toàn.",
        "{name} đậm đặc, tiết kiệm khi sử dụng.",
        "{name} phù hợp cho mọi bề mặt.",
    ],
    "Others": [
        "{name} chất lượng cao, giá hợp lý.",
        "{name} sản phẩm đa năng, tiện lợi.",
        "{name} nhập khẩu chính hãng.",
        "{name} đóng gói sang trọng, làm quà tặng.",
        "{name} phù hợp mọi gia đình.",
    ],
}


def normalize_products(products: List[Dict]) -> List[Dict]:
    """
    Normalize all products: assign IDs, SKUs, slugs, descriptions,
    tags, badges, dates, etc.
    """
    logger.info("Normalizing %d products...", len(products))

    # Track category distribution for balanced output
    cat_counts: Dict[str, int] = {}
    now = datetime.utcnow()

    for i, product in enumerate(products):
        idx = i + 1
        sku = generate_sku(idx, product["category"][:3].upper())
        product["id"] = generate_product_id(idx)
        product["sku"] = sku
        product["slug"] = generate_slug(product["name"], sku)
        product["unit"] = _get_unit(product["category"])

        # Description
        if not product.get("description") or len(product["description"]) < 20:
            category = product["category"]
            templates = DESCRIPTION_TEMPLATES.get(category, DESCRIPTION_TEMPLATES["Others"])
            product["description"] = random.choice(templates).format(name=product["name"])

        # Tags
        product["tags"] = _generate_tags(product)

        # Badges
        product["badges"] = _generate_badges(product)

        # Dates: random date within last 6 months
        days_ago = random.randint(0, 180)
        product["createdAt"] = (now - timedelta(days=days_ago)).isoformat() + "Z"
        product["updatedAt"] = now.isoformat() + "Z"

        # Track
        cat = product["category"]
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

    # Log category distribution
    logger.info("Category distribution:")
    for cat in sorted(cat_counts.keys()):
        logger.info("  %-20s: %d", cat, cat_counts[cat])

    logger.info("Normalization complete.")
    return products


def _get_unit(category: str) -> str:
    """Return appropriate unit per category."""
    units = {
        "Vegetables": "kg",
        "Fruits": "kg",
        "Meat": "kg",
        "Seafood": "kg",
        "Milk": "hộp",
        "Beverages": "chai",
        "Instant Noodles": "gói",
        "Snacks": "gói",
        "Frozen Foods": "hộp",
        "Rice": "kg",
        "Cooking Oil": "chai",
        "Sauce": "chai",
        "Seasoning": "gói",
        "Bakery": "cái",
        "Coffee": "gói",
        "Tea": "hộp",
        "Candy": "gói",
        "Personal Care": "chai",
        "Baby": "hộp",
        "Pet": "gói",
        "Cleaning": "chai",
        "Others": "cái",
    }
    return units.get(category, "cái")


def _generate_tags(product: Dict) -> List[str]:
    """Generate relevant tags from category + brand + nutrition."""
    tags = [product["category"].lower()]

    # Brand tag
    brand = clean_string(product.get("brand", ""))
    if brand:
        tags.append(brand.lower().replace(" ", "-"))

    # Nutrition tags
    nutrition = product.get("nutrition", {})
    if nutrition.get("protein", 0) > 10:
        tags.append("high-protein")
    if nutrition.get("fiber", 0) > 5:
        tags.append("high-fiber")
    if nutrition.get("sugars", 0) < 5:
        tags.append("low-sugar")
    if nutrition.get("fat", 0) < 3:
        tags.append("low-fat")

    return list(set(tags))[:6]


def _generate_badges(product: Dict) -> List[str]:
    """Generate badges like 'organic', 'imported', 'popular', etc."""
    badges = []
    name_lower = product["name"].lower()
    brand_lower = product.get("brand", "").lower()

    if any(w in name_lower for w in ["organic", "bio", "hữu cơ"]):
        badges.append("organic")

    if any(w in name_lower for w in ["nhập khẩu", "imported", "nhat", "japan", "korea"]):
        badges.append("imported")

    if product.get("nutriscore", "") in ("a", "b"):
        badges.append("healthy")

    if not badges:
        badges.append("popular")

    return badges[:3]


def run(products: List[Dict]) -> List[Dict]:
    """Run normalization step."""
    return normalize_products(products)


if __name__ == "__main__":
    logger.info("Run via main.py")
