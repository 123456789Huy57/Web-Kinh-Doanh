const STORAGE_KEYS = {
  currentUser: "aic_current_user",
  guestCart: "aic_cart_guest",
  users: "aic_users",
  orders: "aic_orders",
  wishlist: "aic_wishlist",
  userVouchers: "aic_vouchers",
  adminProducts: "aic_admin_products",
  adminVouchers: "aic_admin_vouchers",
  mealPlans: "aic_meal_plans",
  catalogFilters: "aic_catalog_filters",
  checkoutDraft: "aic_checkout_draft",
  loyalty: "aic_loyalty"
};

function readJSON(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function removeKey(key) {
  localStorage.removeItem(key);
}

function userScopedKey(baseKey) {
  const user = getCurrentUser();
  return user?.id ? `${baseKey}_${user.id}` : null;
}

export function getCurrentUser() {
  return readJSON(STORAGE_KEYS.currentUser, null);
}

export function setCurrentUser(user) {
  return writeJSON(STORAGE_KEYS.currentUser, user);
}

export function clearCurrentUser() {
  removeKey(STORAGE_KEYS.currentUser);
}

export function getStoredUsers() {
  return readJSON(STORAGE_KEYS.users, []);
}

export function setStoredUsers(users) {
  return writeJSON(STORAGE_KEYS.users, users);
}

export function upsertStoredUser(user) {
  const users = getStoredUsers();
  const index = users.findIndex((item) => item.id === user.id);
  const nextUsers = index >= 0 ? users.map((item) => (item.id === user.id ? user : item)) : [...users, user];
  return setStoredUsers(nextUsers);
}

export function getGuestCart() {
  return readJSON(STORAGE_KEYS.guestCart, { items: [], updatedAt: null });
}

export function setGuestCart(cart) {
  return writeJSON(STORAGE_KEYS.guestCart, cart);
}

export function clearGuestCart() {
  removeKey(STORAGE_KEYS.guestCart);
}

export function getOrders() {
  return readJSON(STORAGE_KEYS.orders, []);
}

export function setOrders(orders) {
  return writeJSON(STORAGE_KEYS.orders, orders);
}

export function getWishlist() {
  const key = userScopedKey(STORAGE_KEYS.wishlist);
  return key ? readJSON(key, []) : [];
}

export function setWishlist(items) {
  const key = userScopedKey(STORAGE_KEYS.wishlist);
  return key ? writeJSON(key, items) : [];
}

export function toggleWishlist(productId) {
  const key = userScopedKey(STORAGE_KEYS.wishlist);
  if (!key) return [];
  const wishlist = getWishlist();
  const exists = wishlist.some((item) => item.productId === productId);
  const nextWishlist = exists
    ? wishlist.filter((item) => item.productId !== productId)
    : [...wishlist, { productId, addedAt: new Date().toISOString() }];
  setWishlist(nextWishlist);
  return nextWishlist;
}

export function isWishlisted(productId) {
  return getWishlist().some((item) => item.productId === productId);
}

export function getMealPlans() {
  const key = userScopedKey(STORAGE_KEYS.mealPlans);
  return key ? readJSON(key, []) : readJSON(STORAGE_KEYS.mealPlans, []);
}

export function setMealPlans(mealPlans) {
  const key = userScopedKey(STORAGE_KEYS.mealPlans);
  return writeJSON(key || STORAGE_KEYS.mealPlans, mealPlans);
}

export function getCatalogFilters() {
  return readJSON(STORAGE_KEYS.catalogFilters, {
    query: "",
    category: "",
    sort: "featured",
    onlySale: false,
    onlyHealthy: false
  });
}

export function setCatalogFilters(filters) {
  return writeJSON(STORAGE_KEYS.catalogFilters, filters);
}

export function getCheckoutDraft() {
  return readJSON(STORAGE_KEYS.checkoutDraft, {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    voucherCode: "",
    paymentMethod: "cod"
  });
}

export function setCheckoutDraft(draft) {
  return writeJSON(STORAGE_KEYS.checkoutDraft, draft);
}

export function clearCheckoutDraft() {
  removeKey(STORAGE_KEYS.checkoutDraft);
}

export function getActiveCartKey() {
  const user = getCurrentUser();
  return user?.id ? `aic_cart_user_${user.id}` : STORAGE_KEYS.guestCart;
}

export function getActiveCart() {
  return readJSON(getActiveCartKey(), { items: [], updatedAt: null });
}

export function setActiveCart(cart) {
  const savedCart = writeJSON(getActiveCartKey(), cart);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aic:cart-updated", { detail: { cart: savedCart } }));
  }
  return savedCart;
}

export function clearActiveCart() {
  removeKey(getActiveCartKey());
}

export function getCompareProducts() {
  const user = getCurrentUser();
  const key = user?.id ? `aic_compare_${user.id}` : "aic_compare_guest";
  return readJSON(key, []);
}

export function setCompareProducts(ids) {
  const user = getCurrentUser();
  const key = user?.id ? `aic_compare_${user.id}` : "aic_compare_guest";
  return writeJSON(key, ids);
}

export function addToCompare(productId) {
  const ids = getCompareProducts();
  if (ids.includes(productId)) return ids;
  if (ids.length >= 4) return ids;
  return setCompareProducts([...ids, productId]);
}

export function removeFromCompare(productId) {
  return setCompareProducts(getCompareProducts().filter((id) => id !== productId));
}

export function clearCompare() {
  return setCompareProducts([]);
}

const LOYALTY_DEFAULTS = { points: 0, tier: "bronze", history: [] };
const LOYALTY_TIERS = [
  { name: "bronze", minPoints: 0, multiplier: 1, discount: 0 },
  { name: "silver", minPoints: 500, multiplier: 1.5, discount: 3 },
  { name: "gold", minPoints: 2000, multiplier: 2, discount: 5 },
  { name: "diamond", minPoints: 5000, multiplier: 3, discount: 8 }
];

function getLoyaltyKey() {
  return userScopedKey(STORAGE_KEYS.loyalty);
}

export function getLoyaltyData() {
  const key = getLoyaltyKey();
  return key ? readJSON(key, { ...LOYALTY_DEFAULTS }) : { ...LOYALTY_DEFAULTS };
}

export function addLoyaltyPoints(amount, description) {
  const key = getLoyaltyKey();
  if (!key) return null;
  const data = getLoyaltyData();
  data.points += amount;
  data.tier = LOYALTY_TIERS.slice().reverse().find((tier) => data.points >= tier.minPoints)?.name || "bronze";
  data.history.unshift({ type: "earn", points: amount, description, date: new Date().toISOString() });
  data.history = data.history.slice(0, 50);
  return writeJSON(key, data);
}

export function redeemLoyaltyPoints(pointsToRedeem, description) {
  const key = getLoyaltyKey();
  if (!key) return null;
  const data = getLoyaltyData();
  if (data.points < pointsToRedeem) return null;
  data.points -= pointsToRedeem;
  data.tier = LOYALTY_TIERS.slice().reverse().find((tier) => data.points >= tier.minPoints)?.name || "bronze";
  data.history.unshift({ type: "redeem", points: pointsToRedeem, description, date: new Date().toISOString() });
  return writeJSON(key, data);
}

export function getLoyaltyTierInfo(tierName) {
  return LOYALTY_TIERS.find((tier) => tier.name === tierName) || LOYALTY_TIERS[0];
}

export function getAllLoyaltyTiers() {
  return LOYALTY_TIERS;
}

export function getSavedVouchers() {
  const key = userScopedKey(STORAGE_KEYS.userVouchers);
  return key ? readJSON(key, []) : [];
}

export function setSavedVouchers(items) {
  const key = userScopedKey(STORAGE_KEYS.userVouchers);
  return key ? writeJSON(key, items) : [];
}

export function saveVoucher(voucherId) {
  const key = userScopedKey(STORAGE_KEYS.userVouchers);
  if (!key) return [];
  const list = getSavedVouchers();
  if (!list.some((voucher) => voucher.voucherId === voucherId)) {
    list.push({ voucherId, savedAt: new Date().toISOString() });
    setSavedVouchers(list);
  }
  return list;
}

export function isVoucherSaved(voucherId) {
  return getSavedVouchers().some((voucher) => voucher.voucherId === voucherId);
}

export function removeSavedVoucher(voucherId) {
  const list = getSavedVouchers().filter((voucher) => voucher.voucherId !== voucherId);
  setSavedVouchers(list);
  return list;
}

export function getAdminProducts() {
  return readJSON(STORAGE_KEYS.adminProducts, []);
}

export function setAdminProducts(products) {
  return writeJSON(STORAGE_KEYS.adminProducts, products);
}

export function upsertAdminProduct(product) {
  const products = getAdminProducts();
  const index = products.findIndex((item) => item.id === product.id);
  const next = index >= 0
    ? products.map((item) => (item.id === product.id ? { ...item, ...product } : item))
    : [product, ...products];
  return setAdminProducts(next);
}

export function mergeAdminProducts(seedProducts = []) {
  const map = new Map((seedProducts || []).map((product) => [product.id, product]));
  getAdminProducts().forEach((product) => {
    if (product?.id) map.set(product.id, { ...(map.get(product.id) || {}), ...product });
  });
  return [...map.values()];
}

export function getAdminVouchers() {
  return readJSON(STORAGE_KEYS.adminVouchers, []);
}

export function setAdminVouchers(vouchers) {
  return writeJSON(STORAGE_KEYS.adminVouchers, vouchers);
}

export function upsertAdminVoucher(voucher) {
  const vouchers = getAdminVouchers();
  const index = vouchers.findIndex((item) => item.id === voucher.id);
  const next = index >= 0
    ? vouchers.map((item) => (item.id === voucher.id ? { ...item, ...voucher } : item))
    : [voucher, ...vouchers];
  return setAdminVouchers(next);
}

export function mergeAdminVouchers(seedVouchers = []) {
  const map = new Map((seedVouchers || []).map((voucher) => [voucher.id, voucher]));
  getAdminVouchers().forEach((voucher) => {
    if (voucher?.id) map.set(voucher.id, { ...(map.get(voucher.id) || {}), ...voucher });
  });
  return [...map.values()];
}

export { STORAGE_KEYS };
