"""Fix config.py paths to use D: drive."""
with open('config.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = "# PATHS"
new_section = """# ============================================================
# PATHS - check o D truoc (527GB free), fallback project root
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
"""

content = content.replace(old, new_section, 1)

with open('config.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("REPLACED OK")
