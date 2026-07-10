/**
 * i18n — Bách Hóa Tươi
 * Hỗ trợ tiếng Việt / English
 */

const VI = {
  navHome: "Trang chủ",
  navCatalog: "Sản phẩm",
  navMealPlanner: "Meal Planner",
  searchPlaceholder: "Tìm kiếm sản phẩm...",
  searchLoading: "Đang tìm kiếm...",
  wishlist: "Yêu thích",
  vouchers: "Voucher",
  cart: "Giỏ hàng",
  account: "Tài khoản",
  languageLabel: "Chuyển đổi ngôn ngữ"
};
const EN = {
  navHome: "Home",
  navCatalog: "Products",
  navMealPlanner: "Meal Planner",
  searchPlaceholder: "Search products...",
  searchLoading: "Searching...",
  wishlist: "Wishlist",
  vouchers: "Vouchers",
  cart: "Cart",
  account: "Account",
  languageLabel: "Switch language"
};

const LANG_KEY = "aic_lang";

function getLanguage() {
  try {
    return localStorage.getItem(LANG_KEY) || "vi";
  } catch {
    return "vi";
  }
}

function setLanguage(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
}

export function initLanguage() {
  const lang = getLanguage();
  document.documentElement.lang = lang === "en" ? "en" : "vi";
}

export function isEnglish() {
  return getLanguage() === "en";
}

export function toggleLanguage() {
  const next = isEnglish() ? "vi" : "en";
  setLanguage(next);
  document.documentElement.lang = next;
}

export function getLanguageButtonLabel() {
  return isEnglish() ? "EN" : "VI";
}

export function t(key) {
  const lang = getLanguage();
  const dict = lang === "en" ? EN : VI;
  return dict[key] || key;
}

export function getPageTitle() {
  return isEnglish() ? "FreshMart" : "Bách Hóa Tươi";
}
