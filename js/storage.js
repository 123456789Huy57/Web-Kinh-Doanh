const STORAGE_KEYS = {
  currentUser: "aic_current_user",
  guestCart: "aic_cart_guest",
  users: "aic_users",
  orders: "aic_orders",
  wishlist: "aic_wishlist",
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
  return readJSON(STORAGE_KEYS.wishlist, []);
}

export function setWishlist(items) {
  return writeJSON(STORAGE_KEYS.wishlist, items);
}

export function toggleWishlist(productId) {
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
  return readJSON(STORAGE_KEYS.mealPlans, []);
}

export function setMealPlans(mealPlans) {
  return writeJSON(STORAGE_KEYS.mealPlans, mealPlans);
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
  localStorage.removeItem(STORAGE_KEYS.checkoutDraft);
}

export function getActiveCartKey() {
  const user = getCurrentUser();
  return user?.id ? `aic_cart_user_${user.id}` : STORAGE_KEYS.guestCart;
}

export function getActiveCart() {
  return readJSON(getActiveCartKey(), { items: [], updatedAt: null });
}

export function setActiveCart(cart) {
  return writeJSON(getActiveCartKey(), cart);
}

export function clearActiveCart() {
  removeKey(getActiveCartKey());
}

/* ── Compare Products ── */
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
  if (ids.length >= 4) return ids; // max 4
  ids.push(productId);
  return setCompareProducts(ids);
}

export function removeFromCompare(productId) {
  const ids = getCompareProducts().filter(id => id !== productId);
  return setCompareProducts(ids);
}

export function clearCompare() {
  const user = getCurrentUser();
  const key = user?.id ? `aic_compare_${user.id}` : "aic_compare_guest";
  return writeJSON(key, []);
}

/* ── Loyalty Program ── */
const LOYALTY_DEFAULTS = { points: 0, tier: "bronze", history: [] };
const LOYALTY_TIERS = [
  { name: "bronze", minPoints: 0, multiplier: 1, discount: 0 },
  { name: "silver", minPoints: 500, multiplier: 1.5, discount: 3 },
  { name: "gold", minPoints: 2000, multiplier: 2, discount: 5 },
  { name: "diamond", minPoints: 5000, multiplier: 3, discount: 8 }
];

function getLoyaltyKey() {
  const user = getCurrentUser();
  return user?.id ? `aic_loyalty_${user.id}` : null;
}

export function getLoyaltyData() {
  const key = getLoyaltyKey();
  if (!key) return { ...LOYALTY_DEFAULTS };
  return readJSON(key, { ...LOYALTY_DEFAULTS });
}

export function addLoyaltyPoints(amount, description) {
  // amount = points to add (already calculated as floor(total/1000) before calling)
  const key = getLoyaltyKey();
  if (!key) return null;
  const data = getLoyaltyData();
  data.points += amount;
  data.tier = LOYALTY_TIERS.slice().reverse().find(t => data.points >= t.minPoints)?.name || "bronze";
  data.history.unshift({
    type: "earn",
    points: amount,
    description,
    date: new Date().toISOString()
  });
  if (data.history.length > 50) data.history = data.history.slice(0, 50);
  return writeJSON(key, data);
}

export function redeemLoyaltyPoints(pointsToRedeem, description) {
  const key = getLoyaltyKey();
  if (!key) return null;
  const data = getLoyaltyData();
  if (data.points < pointsToRedeem) return null;
  data.points -= pointsToRedeem;
  data.tier = LOYALTY_TIERS.slice().reverse().find(t => data.points >= t.minPoints)?.name || "bronze";
  data.history.unshift({
    type: "redeem",
    points: pointsToRedeem,
    description,
    date: new Date().toISOString()
  });
  return writeJSON(key, data);
}

export function getLoyaltyTierInfo(tierName) {
  return LOYALTY_TIERS.find(t => t.name === tierName) || LOYALTY_TIERS[0];
}

export function getAllLoyaltyTiers() {
  return LOYALTY_TIERS;
}

export { STORAGE_KEYS };
