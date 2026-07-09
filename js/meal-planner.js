/* ================================================================
   MEAL PLANNER — Main Logic
   Pure ES Modules · No frameworks · Uses shared utils & storage
   ================================================================ */

import { fetchJSON, formatCurrency, escapeHTML, generateId, debounce, convertToProductUnit, getDisplayUnit } from './utils.js';
import { getActiveCart, setActiveCart, getCurrentUser, mergeAdminProducts } from './storage.js';
import { createFooterHTML, showToast } from './main.js';

function ensureMealFooter() {
  const footer = document.getElementById('site-footer');
  if (footer && !footer.innerHTML.trim()) {
    footer.innerHTML = createFooterHTML();
  }
}

/* ── State ── */
const state = {
  products: [],
  catalogProducts: [],
  ingredientProductMap: {},
  mealProductIngredientMap: new Map(),
  recipes: [],
  categories: [],
  selectedIngredients: new Set(),
  currentCategory: 'all',
  searchQuery: '',
  filters: {
    cuisine: 'vietnamese',
    mealType: 'all',
    difficulty: 'all',
    time: 'all',
    servings: '2',
    dietary: []
  },
  filteredRecipes: [],
  currentRecipe: null
};

/* ── DOM Elements ── */
const els = {
  // Step 1
  categoryPills: document.querySelectorAll('.category-pill'),
  searchInput: document.getElementById('ingredient-search-input'),
  searchClear: document.querySelector('.ingredient-search__clear'),
  ingredientGrid: document.getElementById('ingredient-grid'),
  selectedTags: document.getElementById('selected-tags'),
  selectedIngredients: document.getElementById('selected-ingredients'),
  clearAllBtn: document.getElementById('clear-all-ingredients'),
  // Step 2
  filterForm: document.getElementById('recipe-filters'),
  generateBtn: document.getElementById('generate-btn'),
  resetFiltersBtn: document.getElementById('reset-filters-btn'),
  // Step 3
  stepResults: document.getElementById('step-results'),
  resultsCount: document.getElementById('results-count'),
  recipeResults: document.getElementById('recipe-results'),
  resultsEmpty: document.getElementById('results-empty'),
  backToFiltersBtn: document.getElementById('back-to-filters'),
  selectedRecipePanel: document.getElementById('selected-recipe-panel'),
  selectedRecipeBadge: document.getElementById('selected-recipe-badge'),
  selectedRecipeTitle: document.getElementById('selected-recipe-title'),
  selectedRecipeSubtitle: document.getElementById('selected-recipe-subtitle'),
  selectedRecipeMeta: document.getElementById('selected-recipe-meta'),
  selectedRecipeStatus: document.getElementById('selected-recipe-status'),
  selectedRecipeImage: document.getElementById('selected-recipe-image'),
  selectedRecipeSvg: document.getElementById('selected-recipe-svg'),
  selectedRecipeCallouts: document.getElementById('selected-recipe-callouts'),
  recipeViewDetailsBtn: document.getElementById('recipe-view-details-btn'),
  recipePurchasePanel: document.getElementById('recipe-purchase-panel'),
  recipePurchaseLabel: document.getElementById('recipe-purchase-label'),
  recipePurchaseNote: document.getElementById('recipe-purchase-note'),
  recipePurchaseList: document.getElementById('missing-ingredients-list'),
  recipePurchaseAddAll: document.getElementById('recipe-purchase-add-all'),
  recipePurchaseViewAll: document.getElementById('recipe-purchase-view-all'),
  recipeDetailTabs: document.getElementById('recipe-detail-tabs'),
  modalOverlay: document.getElementById('recipe-modal-overlay'),
  modalBody: document.getElementById('recipe-modal-body'),
  modalTitle: document.getElementById('modal-title'),
  modalClose: document.getElementById('recipe-modal-close'),
  // Add to Cart Modal
  addCartModalOverlay: document.getElementById('add-cart-modal-overlay'),
  addCartModalClose: document.getElementById('add-cart-modal-close'),
  addCartModalTitle: document.getElementById('add-cart-modal-title'),
  addCartModalDesc: document.getElementById('add-cart-modal-desc'),
  addCartItemsList: document.getElementById('add-cart-items-list'),
  addCartSummary: document.getElementById('add-cart-summary'),
  addCartSelectAll: document.getElementById('add-cart-select-all'),
  addCartDeselectAll: document.getElementById('add-cart-deselect-all'),
  addCartCancelBtn: document.getElementById('add-cart-cancel-btn'),
  addCartConfirmBtn: document.getElementById('add-cart-confirm-btn')
};

/* ── Category Mapping ── */
const CATEGORY_LABELS = {
  vegetables: 'Rau củ',
  fruits: 'Trái cây',
  meat: 'Thịt',
  seafood: 'Hải sản',
  dairy: 'Sữa & Trứng',
  pantry: 'Khô & Đóng gói',
  condiments: 'Gia vị',
  beverages: 'Đồ uống'
};

const MEAL_TYPE_LABELS = {
  breakfast: 'Sáng',
  lunch: 'Trưa',
  dinner: 'Tối',
  snack: 'Ăn vặt'
};

const DIFFICULTY_LABELS = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó'
};

const CUISINE_LABELS = {
  vietnamese: 'Việt Nam',
  asian: 'Châu Á',
  western: 'Châu Âu',
  korean: 'Hàn Quốc',
  japanese: 'Nhật Bản',
  healthy: 'Healthy',
  eatclean: 'Eat Clean'
};

function getProductImage(product) {
  return product?.imageUrl || product?.image_url || product?.image || '/assets/images/hero-fresh.jpg';
}

function getRecipeImage(recipe) {
  if (recipe?.imageUrl && !recipe.imageUrl.includes('placeholder-banner')) {
    return recipe.imageUrl;
  }
  const heroIngredient = (recipe?.ingredients || [])
    .map(ing => state.products.find(product => product.id === getIngredientId(ing)))
    .find(Boolean);
  return getProductImage(heroIngredient);
}

function getIngredientId(recipeIngredient) {
  return recipeIngredient?.ingredientId
    || state.mealProductIngredientMap.get(recipeIngredient?.productId)
    || recipeIngredient?.productId;
}

function getIngredient(ingredientId) {
  return state.products.find(product => product.id === ingredientId);
}

function getCatalogProduct(productId) {
  return state.catalogProducts.find(product => product.id === productId);
}

function getCatalogPrice(product) {
  const salePrice = Number(product?.salePrice ?? product?.sale_price ?? 0);
  const price = Number(product?.price || 0);
  return salePrice > 0 && salePrice < price ? salePrice : price;
}

function getEstimatedRecipePrice(rawQty, recipeUnit, product, unitPrice, convertedQty) {
  const unit = String(recipeUnit || "").toLowerCase();
  const sellUnit = String(product?.sellUnit || product?.unit || "").toLowerCase();
  const unitWeight = Number(product?.unitWeightGram || product?.netWeightGram || product?.unitWeight || 0);
  const unitVolume = Number(product?.netVolumeMl || 0);

  if (unit === "kg") return rawQty * unitPrice;
  if (["g", "gram"].includes(unit)) {
    if (sellUnit === "kg") return (rawQty / 1000) * unitPrice;
    if (unitWeight > 0) return (rawQty / unitWeight) * unitPrice;
  }
  if (unit === "ml" && unitVolume > 0) return (rawQty / unitVolume) * unitPrice;
  if (Number.isFinite(convertedQty) && convertedQty > 0) return convertedQty * unitPrice;
  return unitPrice;
}

function getMappedCatalogProduct(ingredientId) {
  const entry = state.ingredientProductMap?.[ingredientId];
  const productIds = Array.isArray(entry) ? entry : [entry?.preferredProductId, ...(entry?.productIds || [])];
  return productIds
    .filter(Boolean)
    .map(getCatalogProduct)
    .find(product => product && product.active !== false && product.in_stock !== false)
    || null;
}

function getIngredientDisplayProduct(ingredient) {
  return getMappedCatalogProduct(ingredient?.id) || ingredient;
}

function getIngredientDisplayImage(ingredient) {
  const product = getMappedCatalogProduct(ingredient?.id);
  return getProductImage(product || ingredient);
}

function getRecipeScale(recipe) {
  const servings = parseInt(state.filters.servings, 10) || recipe?.servings || 2;
  return Math.max(1, servings / Math.max(1, recipe?.servings || servings));
}

function resolvePurchaseItem(recipeIngredient, recipe) {
  const ingredientId = getIngredientId(recipeIngredient);
  const ingredient = getIngredient(ingredientId);
  const product = getMappedCatalogProduct(ingredientId);
  const scaleFactor = getRecipeScale(recipe);
  const rawQty = (Number(recipeIngredient?.quantity) || 0) * scaleFactor;
  const recipeUnit = recipeIngredient?.unit;

  if (!product) {
    return { ingredientId, ingredient, product: null, rawQty, recipeUnit, cartQty: 0, displayQty: `${rawQty} ${recipeUnit || ''}`.trim() };
  }

  const unitWeight = Number(product.unitWeightGram || product.netWeightGram || product.unitWeight || ingredient?.unitWeightGram || 0);
  const productUnit = product.sellUnit || product.unit || ingredient?.defaultUnit || recipeUnit;
  let convertedQty = convertToProductUnit(rawQty, recipeUnit, productUnit, unitWeight);

  if (['g', 'gram'].includes(String(recipeUnit || '').toLowerCase()) && Number(product.netWeightGram)) {
    convertedQty = rawQty / Number(product.netWeightGram);
  } else if (['kg'].includes(String(recipeUnit || '').toLowerCase()) && Number(product.netWeightGram)) {
    convertedQty = (rawQty * 1000) / Number(product.netWeightGram);
  } else if (['ml'].includes(String(recipeUnit || '').toLowerCase()) && Number(product.netVolumeMl)) {
    convertedQty = rawQty / Number(product.netVolumeMl);
  }

  const cartQty = Math.max(1, Math.ceil(Number(convertedQty) || 1));
  const displayQty = getDisplayUnit(convertedQty, productUnit, unitWeight);
  const unitPrice = getCatalogPrice(product);
  const estimatedPrice = getEstimatedRecipePrice(rawQty, recipeUnit, product, unitPrice, Number(convertedQty) || 0);
  return { ingredientId, ingredient, product, rawQty, recipeUnit, cartQty, displayQty, unitPrice, estimatedPrice, totalPrice: cartQty * unitPrice };
}

function getMissingIngredients(recipe) {
  const selectedIds = Array.from(state.selectedIngredients);
  return (recipe.ingredients || []).filter(ingredient => !selectedIds.includes(getIngredientId(ingredient)));
}

function getPurchasableIngredients(recipe) {
  return recipe?.ingredients || [];
}

/* ── Init ── */
async function init() {
  ensureMealFooter();
  await loadData();
  bindEvents();
  renderIngredientGrid();
  updateSelectedTags();
}

/* ── Data Loading ── */
async function loadData() {
  try {
    const [ingredients, recipes, categories, catalogProducts, ingredientProductMap] = await Promise.all([
      fetchJSON('data/ingredients.json'),
      fetchJSON('data/recipes.json'),
      fetchJSON('data/categories.json'),
      fetchJSON('data/products.json'),
      fetchJSON('data/ingredient-product-map.json')
    ]);
    state.products = ingredients.filter(p => p.isActive !== false);
    state.recipes = recipes.filter(r => r.isActive !== false);
    state.categories = categories.filter(c => c.isActive !== false);
    state.catalogProducts = mergeAdminProducts(catalogProducts || []).filter(p => p.active !== false && p.isActive !== false);
    state.ingredientProductMap = ingredientProductMap || {};
    state.mealProductIngredientMap = new Map(state.products.map(product => [product.mealProductId, product.id]));
  } catch (err) {
    console.error('Failed to load data:', err);
    showToast('❌ Không thể tải dữ liệu. Vui lòng tải lại trang.', 'error');
  }
}

/* ── Event Binding ── */
function bindEvents() {
  // Category pills
  els.categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const cat = pill.dataset.category;
      setCategory(cat);
    });
  });

  // Search input
  els.searchInput.addEventListener('input', debounce((e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    renderIngredientGrid();
  }, 150));

  // Search clear
  els.searchClear.addEventListener('click', () => {
    els.searchInput.value = '';
    state.searchQuery = '';
    renderIngredientGrid();
    els.searchInput.focus();
  });

  // Clear all selected
  els.clearAllBtn.addEventListener('click', () => {
    state.selectedIngredients.clear();
    updateSelectedTags();
    renderIngredientGrid();
  });

  // Filter form submit
  els.filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    generateRecipes();
  });

  // Reset filters
  els.resetFiltersBtn.addEventListener('click', () => {
    resetFilters();
  });

  // Filter selects (dropdown)
  const filterSelects = document.querySelectorAll('.filter-select');
  filterSelects.forEach(select => {
    select.addEventListener('change', (e) => {
      const name = e.target.name;
      const value = e.target.value;
      state.filters[name] = value;
    });
  });

  // Dietary checkboxes
  document.querySelectorAll('.dietary-checkbox input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', (e) => {
      const value = e.target.value;
      if (e.target.checked) {
        state.filters.dietary.push(value);
      } else {
        state.filters.dietary = state.filters.dietary.filter(d => d !== value);
      }
    });
  });

  // Back to filters
  els.backToFiltersBtn.addEventListener('click', () => {
    showStep(2);
  });

  // Delegated interactions
  els.ingredientGrid.addEventListener('click', handleIngredientGridClick);
  els.ingredientGrid.addEventListener('keydown', handleIngredientGridKeydown);
  els.selectedTags.addEventListener('click', handleSelectedTagsClick);
  els.recipeResults.addEventListener('click', handleRecipeResultsClick);
  els.recipePurchaseList.addEventListener('click', handleRecipePurchaseListClick);

  // Selected recipe actions
  els.recipeViewDetailsBtn.addEventListener('click', () => {
    if (state.currentRecipe) openRecipeModal(state.currentRecipe.id);
  });

  els.recipePurchaseAddAll.addEventListener('click', () => {
    if (state.currentRecipe) openAddToCartModal(state.currentRecipe.id);
  });

  els.recipePurchaseViewAll.addEventListener('click', () => {
    if (state.currentRecipe) openRecipeModal(state.currentRecipe.id);
  });

  // Tabs
  document.querySelectorAll('.recipe-tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      const selectedTab = tab.dataset.tab;
      document.querySelectorAll('.recipe-tab-btn').forEach(node => {
        node.classList.toggle('is-active', node.dataset.tab === selectedTab);
        node.setAttribute('aria-selected', node.dataset.tab === selectedTab);
      });
      document.querySelectorAll('.recipe-tab-panel').forEach(panel => {
        panel.classList.toggle('is-active', panel.dataset.panel === selectedTab);
      });
      renderRecipeTabContent(selectedTab);
    });
  });

  // Recipe detail modal close
  els.modalClose.addEventListener('click', closeModal);
  els.modalOverlay.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });

  // Add to Cart modal
  els.addCartModalClose.addEventListener('click', closeAddCartModal);
  els.addCartCancelBtn.addEventListener('click', closeAddCartModal);
  els.addCartModalOverlay.addEventListener('click', (e) => {
    if (e.target === els.addCartModalOverlay) closeAddCartModal();
  });
  els.addCartConfirmBtn.addEventListener('click', confirmAddToCart);
  els.addCartSelectAll.addEventListener('click', () => {
    els.addCartItemsList.querySelectorAll('.add-cart-item__check:not(:disabled)').forEach(cb => { cb.checked = true; });
    updateAddCartSummary();
  });
  els.addCartDeselectAll.addEventListener('click', () => {
    els.addCartItemsList.querySelectorAll('.add-cart-item__check:not(:disabled)').forEach(cb => { cb.checked = false; });
    updateAddCartSummary();
  });

  // Delegate change events on the items list to update summary
  els.addCartItemsList.addEventListener('change', (e) => {
    if (e.target.classList.contains('add-cart-item__check')) {
      updateAddCartSummary();
    }
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (els.addCartModalOverlay.classList.contains('active')) {
        closeAddCartModal();
      } else if (els.modalOverlay.classList.contains('active')) {
        closeModal();
      }
    }
  });
}

/* ── Category Selection ── */
function setCategory(category) {
  state.currentCategory = category;
  els.categoryPills.forEach(pill => {
    const isActive = pill.dataset.category === category;
    pill.classList.toggle('is-active', isActive);
    pill.setAttribute('aria-pressed', isActive);
  });
  renderIngredientGrid();
}

function handleIngredientGridClick(event) {
  const card = event.target.closest('.ingredient-card');
  if (!card) return;
  toggleIngredient(card.dataset.productId);
}

function handleIngredientGridKeydown(event) {
  const card = event.target.closest('.ingredient-card');
  if (!card) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleIngredient(card.dataset.productId);
  }
}

function handleSelectedTagsClick(event) {
  const removeButton = event.target.closest('.selected-tag__remove');
  if (!removeButton) return;
  event.stopPropagation();
  const tag = removeButton.closest('.selected-tag');
  if (!tag) return;
  const productId = tag.dataset.productId;
  state.selectedIngredients.delete(productId);
  updateSelectedTags();
  renderIngredientGrid();
}

function handleRecipeResultsClick(event) {
  const viewButton = event.target.closest('.view-recipe-btn');
  if (viewButton) {
    event.stopPropagation();
    displaySelectedRecipe(viewButton.dataset.recipeId, { scroll: true });
    return;
  }

  const addButton = event.target.closest('.add-cart-btn');
  if (addButton) {
    event.stopPropagation();
    openAddToCartModal(addButton.dataset.recipeId);
    return;
  }

  const card = event.target.closest('.recipe-result-card');
  if (card) {
    displaySelectedRecipe(card.dataset.recipeId, { scroll: true });
  }
}

function handleRecipePurchaseListClick(event) {
  const qtyButton = event.target.closest('.purchase-qty-btn');
  if (qtyButton) {
    const item = qtyButton.closest('.recipe-purchase-item');
    const countEl = item?.querySelector('.recipe-purchase-counter span');
    if (!item || !countEl) return;
    let count = parseInt(countEl.textContent, 10);
    const action = qtyButton.dataset.action;
    if (action === 'increment') count += 1;
    if (action === 'decrement' && count > 1) count -= 1;
    countEl.textContent = count;
    return;
  }

  const buyButton = event.target.closest('.recipe-purchase-item__buy');
  if (buyButton) {
    const item = buyButton.closest('.recipe-purchase-item');
    const productId = item?.dataset.productId;
    const qty = parseInt(item?.querySelector('.recipe-purchase-counter span')?.textContent || '0', 10);
    if (productId) addProductToCart(productId, qty);
  }
}

/* ── Ingredient Grid Rendering ── */
function renderIngredientGrid() {
  let products = state.products;

  // Filter by category
  if (state.currentCategory !== 'all') {
    products = products.filter(p => p.categoryId === state.currentCategory);
  }

  // Filter by search query
  if (state.searchQuery) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(state.searchQuery) ||
      (p.description && p.description.toLowerCase().includes(state.searchQuery))
    );
  }

  if (products.length === 0) {
    els.ingredientGrid.innerHTML = `
      <div class="ingredient-grid__empty">
        <span class="ingredient-grid__empty-icon" aria-hidden="true"></span>
        ${state.searchQuery ? `Không tìm thấy "${escapeHTML(state.searchQuery)}"` : 'Không có nguyên liệu trong danh mục này'}
      </div>
    `;
    return;
  }

  els.ingredientGrid.innerHTML = products.map(product => {
    const isSelected = state.selectedIngredients.has(product.id);
    const displayProduct = getIngredientDisplayProduct(product);
    const categoryLabel = displayProduct?.subcategoryName || displayProduct?.categoryName || CATEGORY_LABELS[product.categoryId] || product.categoryId;
    const imageUrl = getIngredientDisplayImage(product);

    return `
      <div class="ingredient-card ${isSelected ? 'is-selected' : ''}"
           data-product-id="${escapeHTML(product.id)}"
           role="option"
           aria-selected="${isSelected}"
           tabindex="0">
        <img class="ingredient-card__image"
             src="${escapeHTML(imageUrl)}"
             alt=""
             loading="lazy">
        <div class="ingredient-card__info">
          <div class="ingredient-card__name">${escapeHTML(product.name)}</div>
          <div class="ingredient-card__category">${escapeHTML(categoryLabel)}</div>
        </div>
        <div class="ingredient-card__check" aria-hidden="true"></div>
      </div>
    `;
  }).join('');

}

/* ── Toggle Ingredient ── */
function toggleIngredient(productId) {
  if (state.selectedIngredients.has(productId)) {
    state.selectedIngredients.delete(productId);
  } else {
    state.selectedIngredients.add(productId);
  }
  updateSelectedTags();
  renderIngredientGrid();
}

/* ── Update Selected Tags ── */
function updateSelectedTags() {
  const tags = Array.from(state.selectedIngredients).map(id => {
    const product = state.products.find(p => p.id === id);
    if (!product) return '';
    return `
      <span class="selected-tag" data-product-id="${escapeHTML(product.id)}">
        ${escapeHTML(product.name)}
        <button type="button" class="selected-tag__remove" aria-label="Xóa ${escapeHTML(product.name)}">✕</button>
      </span>
    `;
  }).join('');

  els.selectedTags.innerHTML = tags;
  els.selectedIngredients.classList.toggle('is-visible', state.selectedIngredients.size > 0);
}

/* ── Filter Updates ── */
function updateDietaryCheckbox(value, checked) {
  const checkbox = document.querySelector(`.dietary-checkbox input[value="${value}"]`);
  if (checkbox) {
    checkbox.closest('.dietary-checkbox').classList.toggle('is-active', checked);
  }
}

/* ── Reset Filters ── */
function resetFilters() {
  state.filters = {
    cuisine: 'vietnamese',
    mealType: 'all',
    difficulty: 'all',
    time: 'all',
    servings: '2',
    dietary: []
  };

  // Reset selects
  document.getElementById('cuisine-select').value = 'vietnamese';
  document.getElementById('meal-type-select').value = 'all';
  document.getElementById('difficulty-select').value = 'all';
  document.getElementById('time-select').value = 'all';
  document.getElementById('servings-select').value = '2';

  // Reset checkboxes
  document.querySelectorAll('.dietary-checkbox input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    cb.closest('.dietary-checkbox').classList.remove('is-active');
  });
}

/* ── Generate Recipes ── */
function generateRecipes() {
  if (state.selectedIngredients.size === 0) {
    showToast('⚠️ Vui lòng chọn ít nhất 1 nguyên liệu', 'warning');
    return;
  }

  // Reset current recipe so new results are displayed
  state.currentRecipe = null;

  // Show loading state
  els.generateBtn.classList.add('is-loading');
  els.generateBtn.disabled = true;

  // Give the UI a short planning pause before showing suggestions.
  setTimeout(() => {
    try {
      const results = filterRecipes();
      state.filteredRecipes = results;
      renderResults(results);
      showStep(3);
    } catch (error) {
      console.error("Meal planner render failed:", error);
      showToast("Không thể tạo món lúc này. Vui lòng tải lại trang và thử lại.", "error");
    } finally {
      els.generateBtn.classList.remove('is-loading');
      els.generateBtn.disabled = false;
    }
  }, 800);
}

/* ── Recipe Filtering Logic ── */
function filterRecipes() {
  const selectedIds = Array.from(state.selectedIngredients);
  const { cuisine, mealType, difficulty, time, servings, dietary } = state.filters;

  return state.recipes
    .map(recipe => {
      // Calculate match score
      let score = 0;
      let matchedIngredients = 0;

      // Check ingredient overlap
      const recipeIngredientIds = recipe.ingredients.map(getIngredientId);
      matchedIngredients = recipeIngredientIds.filter(id => selectedIds.includes(id)).length;

      if (matchedIngredients === 0) return null; // No match at all

      score += matchedIngredients * 10;

      // Cuisine match (via tags)
      if (cuisine !== 'all' && recipe.tags.includes(cuisine)) {
        score += 15;
      }

      // Meal type match
      if (mealType !== 'all' && recipe.mealType === mealType) {
        score += 10;
      }

      // Difficulty match
      if (difficulty !== 'all' && recipe.difficulty === difficulty) {
        score += 5;
      }

      // Time match
      const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
      if (time !== 'all') {
        const timeMatch = checkTimeMatch(totalTime, time);
        if (timeMatch) score += 5;
      }

      // Servings match (prefer exact or close)
      if (recipe.servings === parseInt(servings)) {
        score += 5;
      } else if (Math.abs(recipe.servings - parseInt(servings)) <= 2) {
        score += 2;
      }

      // Dietary requirements
      let dietaryMatch = true;
      if (dietary.includes('vegetarian') && !recipe.tags.includes('vegetarian')) {
        dietaryMatch = false;
      }
      if (dietary.includes('lowFat') && (recipe.nutrition?.fat || 0) > 15) {
        dietaryMatch = false;
      }
      if (dietary.includes('highProtein') && (recipe.nutrition?.protein || 0) < 20) {
        dietaryMatch = false;
      }
      if (dietary.includes('lowCarb') && (recipe.nutrition?.carbs || 0) > 30) {
        dietaryMatch = false;
      }
      if (!dietaryMatch) return null;

      return { ...recipe, matchScore: score, matchedCount: matchedIngredients };
    })
    .filter(Boolean)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12); // Top 12 results
}

function checkTimeMatch(totalMinutes, timeFilter) {
  switch (timeFilter) {
    case 'quick': return totalMinutes < 15;
    case 'normal': return totalMinutes >= 15 && totalMinutes <= 30;
    case 'long': return totalMinutes > 30 && totalMinutes <= 60;
    case 'slow': return totalMinutes > 60;
    default: return true;
  }
}

/* ── Render Results ── */
function renderResults(recipes) {
  els.resultsCount.innerHTML = `Tìm thấy <strong>${recipes.length}</strong> món phù hợp`;

  if (recipes.length === 0) {
    els.selectedRecipePanel.style.display = 'none';
    els.recipePurchasePanel.style.display = 'none';
    els.recipeDetailTabs.style.display = 'none';
    els.recipeResults.style.display = 'none';
    els.resultsEmpty.style.display = 'block';
    return;
  }

  els.recipeResults.style.display = 'grid';
  els.resultsEmpty.style.display = 'none';

  if (!state.currentRecipe) {
    displaySelectedRecipe(recipes[0].id);
  }

  els.recipeResults.innerHTML = recipes.map(recipe => {
    const matchPercent = Math.min(100, Math.round((recipe.matchedCount / Math.max(1, recipe.ingredients.length)) * 100));
    const imageUrl = getRecipeImage(recipe);
    const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

    return `
      <article class="recipe-result-card" data-recipe-id="${escapeHTML(recipe.id)}">
        <div class="recipe-result-card__image">
          <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(recipe.name)}" loading="lazy">
          <span class="recipe-result-card__meal-type recipe-result-card__meal-type--${recipe.mealType}">
            ${MEAL_TYPE_LABELS[recipe.mealType] || recipe.mealType}
          </span>
          <span class="recipe-result-card__match">${matchPercent}% khớp</span>
        </div>
        <div class="recipe-result-card__body">
          <h3 class="recipe-result-card__title">${escapeHTML(recipe.name)}</h3>
          <div class="recipe-result-card__meta">
            <span class="recipe-result-card__meta-item">Thời gian ${totalTime} phút</span>
            <span class="recipe-result-card__meta-item">Năng lượng ${recipe.nutrition?.calories || 0} kcal</span>
            <span class="recipe-result-card__meta-item">Độ khó ${DIFFICULTY_LABELS[recipe.difficulty] || recipe.difficulty}</span>
            <span class="recipe-result-card__meta-item">Khẩu phần ${recipe.servings || 2} người</span>
          </div>
          <div class="recipe-result-card__tags">
            ${(recipe.tags || []).slice(0, 3).map(tag => `<span class="recipe-result-card__tag">${escapeHTML(tag)}</span>`).join('')}
          </div>
          <div class="recipe-result-card__actions">
            <button type="button" class="recipe-result-card__btn recipe-result-card__btn--primary view-recipe-btn" data-recipe-id="${escapeHTML(recipe.id)}">Xem công thức</button>
            <button type="button" class="recipe-result-card__btn recipe-result-card__btn--outline add-cart-btn" data-recipe-id="${escapeHTML(recipe.id)}">Thêm vào giỏ</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

}

/* ── Show Step ── */
function showStep(stepNum) {
  document.getElementById('step-ingredients').style.display = stepNum >= 1 ? '' : 'none';
  document.getElementById('step-filters').style.display = stepNum >= 2 ? '' : 'none';
  document.getElementById('step-results').style.display = stepNum >= 3 ? '' : 'none';

  if (stepNum >= 3) {
    els.stepResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function calculateIngredientPositions(count, radius = 280) {
  const positions = [];
  const startAngle = -90;
  const gap = 360 / Math.max(1, count);
  for (let index = 0; index < count; index += 1) {
    const angle = startAngle + index * gap;
    const radians = angle * (Math.PI / 180);
    const x = Math.cos(radians) * radius;
    const y = Math.sin(radians) * radius * 0.88;
    positions.push({ angle, x, y });
  }
  return positions;
}

function renderConnectionSVG(positions) {
  const width = 900;
  const height = 760;
  const cx = width / 2;
  const cy = height / 2;

  const paths = positions.map(pos => {
    const sx = cx + pos.x;
    const sy = cy + pos.y;
    const dx = cx - sx;
    const dy = cy - sy;
    const cp1x = sx + dx * 0.28;
    const cp1y = sy + dy * 0.22 + (pos.x > 0 ? -48 : 48);
    const cp2x = sx + dx * 0.60;
    const cp2y = sy + dy * 0.60 + (pos.x > 0 ? 48 : -48);
    return `<path d="M ${sx} ${sy} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${cx} ${cy}" marker-end="url(#arrow-tip)" />`;
  }).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" class="recipe-selected__svg">
      <defs>
        <marker id="arrow-tip" markerWidth="12" markerHeight="12" refX="12" refY="6" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L12,6 L0,12" fill="#4f8c5f" />
        </marker>
      </defs>
      ${paths}
    </svg>
  `;
}

function getRecipeMetaItems(recipe, servings) {
  return [
    { icon: "🍽", label: "Bữa", value: MEAL_TYPE_LABELS[recipe.mealType] || recipe.mealType },
    { icon: "⏱", label: "Chuẩn bị", value: `${recipe.prepTimeMinutes || 0} phút` },
    { icon: "🔥", label: "Nấu", value: `${recipe.cookTimeMinutes || 0} phút` },
    { icon: "◇", label: "Độ khó", value: DIFFICULTY_LABELS[recipe.difficulty] || recipe.difficulty },
    { icon: "👥", label: "Khẩu phần", value: `${servings || recipe.servings || 2} người` }
  ];
}

function renderMetaPills(recipe, servings) {
  return getRecipeMetaItems(recipe, servings).map(item => `
    <span class="recipe-meta-pill">
      <span class="recipe-meta-pill__icon" aria-hidden="true">${item.icon}</span>
      <span class="recipe-meta-pill__copy">
        <small>${escapeHTML(item.label)}</small>
        <strong>${escapeHTML(item.value)}</strong>
      </span>
    </span>
  `).join("");
}

function renderNutritionCallouts(recipe) {
  const items = [
    { label: "Calories", value: `${recipe.nutrition?.calories || 0} kcal` },
    { label: "Protein", value: `${recipe.nutrition?.protein || 0}g` },
    { label: "Thời gian", value: `${(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} phút` }
  ];
  return items.map((item, index) => `
    <div class="recipe-selected__nutrition-callout recipe-selected__nutrition-callout--${index + 1}">
      <small>${escapeHTML(item.label)}</small>
      <strong>${escapeHTML(item.value)}</strong>
    </div>
  `).join("");
}

function getRecipeStepGroups(steps = []) {
  const labels = [
    { key: "prep", title: "Bước 1", subtitle: "Chuẩn bị" },
    { key: "cook", title: "Bước 2", subtitle: "Nấu" },
    { key: "finish", title: "Bước 3", subtitle: "Hoàn thiện" }
  ];
  const size = Math.max(1, Math.ceil(steps.length / 3));
  return labels.map((label, index) => {
    const start = index * size;
    const end = index === labels.length - 1 ? steps.length : start + size;
    return { ...label, steps: steps.slice(start, end).filter(Boolean) };
  }).filter(group => group.steps.length);
}

function renderRecipeStepTabs(recipe) {
  const groups = getRecipeStepGroups(recipe.steps || []);
  if (!groups.length) return "";
  return `
    <div class="recipe-step-tabs" data-step-tabs>
      <div class="recipe-step-tabs__nav" role="tablist" aria-label="Các bước nấu">
        ${groups.map((group, index) => `
          <button type="button" class="recipe-step-tab ${index === 0 ? "is-active" : ""}" data-step-tab="${escapeHTML(group.key)}" role="tab" aria-selected="${index === 0 ? "true" : "false"}">
            <span>${escapeHTML(group.title)}</span>
            <strong>${escapeHTML(group.subtitle)}</strong>
          </button>
        `).join("")}
      </div>
      <div class="recipe-step-tabs__panels">
        ${groups.map((group, index) => `
          <div class="recipe-step-panel ${index === 0 ? "is-active" : ""}" data-step-panel="${escapeHTML(group.key)}" role="tabpanel">
            <ol class="recipe-steps">
              ${group.steps.map((step, stepIndex) => `
                <li class="recipe-step-item">
                  <span class="recipe-step-item__badge">${stepIndex + 1}</span>
                  <span class="recipe-step__text">${escapeHTML(step)}</span>
                </li>
              `).join("")}
            </ol>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function bindRecipeStepTabs(root) {
  root?.querySelectorAll("[data-step-tab]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.stepTab;
      const wrap = button.closest("[data-step-tabs]");
      wrap?.querySelectorAll("[data-step-tab]").forEach(tab => {
        const active = tab.dataset.stepTab === key;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });
      wrap?.querySelectorAll("[data-step-panel]").forEach(panel => {
        panel.classList.toggle("is-active", panel.dataset.stepPanel === key);
      });
    });
  });
}

/* ── Recipe Modal ── */

function scrollToSelectedRecipe() {
  const target = els.selectedRecipePanel || els.stepResults;
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.classList.remove("is-attention");
  void target.offsetWidth;
  target.classList.add("is-attention");
}

function markSelectedRecipeCard(recipeId) {
  document.querySelectorAll(".recipe-result-card.is-selected").forEach(card => {
    card.classList.remove("is-selected");
  });
  document.querySelectorAll(".recipe-result-card").forEach(card => {
    if (card.dataset.recipeId === recipeId) card.classList.add("is-selected");
  });
}

function displaySelectedRecipe(recipeId, options = {}) {
  const recipe = state.recipes.find(r => r.id === recipeId);
  if (!recipe) return;
  state.currentRecipe = recipe;
  markSelectedRecipeCard(recipeId);

  const selectedIds = Array.from(state.selectedIngredients);
  const matchedIngredients = recipe.ingredients.filter(ingredient => selectedIds.includes(getIngredientId(ingredient)));
  const missingIngredients = getMissingIngredients(recipe);
  const matchPercent = Math.min(100, Math.round((matchedIngredients.length / Math.max(1, recipe.ingredients.length)) * 100));
  const imageUrl = getRecipeImage(recipe);
  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
  const matchText = matchPercent >= 80 ? "Phù hợp rất cao với nguyên liệu bạn có" : `Bạn đã có ${matchedIngredients.length}/${recipe.ingredients.length} nguyên liệu`;

  els.selectedRecipeBadge.textContent = matchPercent >= 80 ? "Gợi ý phù hợp nhất" : "Gợi ý dựa trên nguyên liệu đã chọn";
  els.selectedRecipeTitle.textContent = recipe.name;
  els.selectedRecipeSubtitle.textContent = "Món ăn được đề xuất theo nguyên liệu sẵn có. Thiếu nguyên liệu nào, hệ thống sẽ gợi ý đúng sản phẩm trong kho để thêm vào giỏ.";
  els.selectedRecipeMeta.innerHTML = `
    <span>${totalTime} phút</span>
    <span>${MEAL_TYPE_LABELS[recipe.mealType] || recipe.mealType}</span>
    <span>${recipe.servings || 2} người</span>
    <span>${recipe.nutrition?.calories || 0} kcal</span>
  `;
  els.selectedRecipeStatus.innerHTML = `<strong>${matchText}</strong> · cần mua thêm ${missingIngredients.length} nguyên liệu.`;
  els.selectedRecipeImage.innerHTML = `<img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(recipe.name)}">`;

  const positions = calculateIngredientPositions(recipe.ingredients.length, 300);
  els.selectedRecipeCallouts.innerHTML = recipe.ingredients.map((ingredientLine, index) => {
    const ingredientId = getIngredientId(ingredientLine);
    const ingredient = getIngredient(ingredientId);
    const hasIngredient = selectedIds.includes(ingredientId);
    const ingredientName = ingredient ? ingredient.name : "Nguyên liệu";
    const pos = positions[index];
    return `
      <div class="recipe-selected__callout ${hasIngredient ? "is-owned" : "is-needed"}" style="left:calc(50% + ${pos.x}px); top:calc(50% + ${pos.y}px); animation-delay:${index * 70}ms;">
        <div class="recipe-selected__callout-image">
          <img src="${escapeHTML(getProductImage(ingredient))}" alt="${escapeHTML(ingredientName)}">
        </div>
        <div class="recipe-selected__callout-info">
          <strong>${escapeHTML(ingredientName)}</strong>
          <span>${hasIngredient ? "Bạn có sẵn" : "Cần mua thêm"}</span>
        </div>
      </div>
    `;
  }).join("") + renderNutritionCallouts(recipe);

  els.selectedRecipeSvg.innerHTML = renderConnectionSVG(positions);
  els.selectedRecipePanel.style.display = "";
  els.recipePurchasePanel.style.display = "";
  els.recipeDetailTabs.style.display = "";

  els.recipePurchaseLabel.textContent = missingIngredients.length > 0 ? "Nguyên liệu cần mua thêm" : "Bạn đã có đủ nguyên liệu";
  els.recipePurchaseNote.textContent = missingIngredients.length > 0 ? "Chọn từng món hoặc thêm sản phẩm còn thiếu vào giỏ." : "Bạn đã sẵn sàng nấu món này ngay.";

  els.recipePurchaseList.innerHTML = getPurchasableIngredients(recipe).map(ingredientLine => {
    const ingredientId = getIngredientId(ingredientLine);
    const hasIngredient = selectedIds.includes(ingredientId);
    const resolved = resolvePurchaseItem(ingredientLine, recipe);
    const ingredientName = resolved.ingredient?.name || "Nguyên liệu";
    if (!resolved.product) {
      return `
        <div class="recipe-purchase-item recipe-purchase-item--unavailable" data-ingredient-id="${escapeHTML(resolved.ingredientId)}">
          <img class="recipe-purchase-item__image" src="${escapeHTML(getProductImage(resolved.ingredient))}" alt="">
          <div class="recipe-purchase-item__info">
            <div class="recipe-purchase-item__name">${escapeHTML(ingredientName)}</div>
            <div class="recipe-purchase-item__qty">Chưa có sản phẩm phù hợp trong kho</div>
          </div>
        </div>
      `;
    }
    return `
      <div class="recipe-purchase-item ${hasIngredient ? "is-owned" : "is-needed"}" data-product-id="${escapeHTML(resolved.product.id)}" data-ingredient-id="${escapeHTML(resolved.ingredientId)}">
        <img class="recipe-purchase-item__image" src="${escapeHTML(getProductImage(resolved.product))}" alt="">
        <div class="recipe-purchase-item__info">
          <div class="recipe-purchase-item__name">${escapeHTML(resolved.product.name)}</div>
          <div class="recipe-purchase-item__qty">${escapeHTML(ingredientName)} · ${resolved.displayQty} · ${formatCurrency(resolved.unitPrice || 0)}</div>
        </div>
        <div class="recipe-purchase-item__controls">
          <div class="recipe-purchase-counter" data-product-id="${escapeHTML(resolved.product.id)}">
            <button type="button" class="purchase-qty-btn" data-action="decrement">-</button>
            <span>${resolved.cartQty}</span>
            <button type="button" class="purchase-qty-btn" data-action="increment">+</button>
          </div>
          <button type="button" class="recipe-purchase-item__buy" aria-label="Thêm ${escapeHTML(resolved.product.name)} vào giỏ">Thêm</button>
        </div>
      </div>
    `;
  }).join("");

  els.recipePurchaseAddAll.dataset.recipeId = recipeId;
  els.recipePurchaseAddAll.disabled = !getPurchasableIngredients(recipe).some(ingredientLine => resolvePurchaseItem(ingredientLine, recipe).product);
  els.recipeViewDetailsBtn.dataset.recipeId = recipeId;
  els.recipePurchaseViewAll.dataset.recipeId = recipeId;

  bindPurchaseControls();
  renderRecipeTabContent("steps");
  if (options.scroll) window.setTimeout(scrollToSelectedRecipe, 40);
}

function bindPurchaseControls() {
  if (!els.recipePurchaseList || els.recipePurchaseList.dataset.purchaseBound === "true") return;
  els.recipePurchaseList.dataset.purchaseBound = "true";
}

function addProductToCart(productId, quantity) {
  const product = getCatalogProduct(productId);
  if (!product) return;
  const cart = getActiveCart();
  cart.items = cart.items || [];
  const existing = cart.items.find(item => item.productId === productId);
  if (existing) existing.quantity += quantity;
  else cart.items.push({ productId, quantity });
  cart.updatedAt = new Date().toISOString();
  setActiveCart(cart);
  showToast(`Đã thêm ${quantity} ${product.unit || ""} ${product.name} vào giỏ hàng!`);
}

function renderRecipeTabContent(tab) {
  if (!state.currentRecipe) return;
  const recipe = state.currentRecipe;
  const stepsContent = `
    <ul>
      ${(recipe.steps || []).map((step, index) => `
        <li class="recipe-step-panel-item">
          <span class="recipe-step-panel-item__step">${index + 1}</span>
          <span class="recipe-step-panel-item__text">${escapeHTML(step)}</span>
        </li>
      `).join("")}
    </ul>
  `;
  const nutritionContent = `
    <div class="recipe-nutrition-grid">
      <div class="recipe-nutrition-item"><strong>${recipe.nutrition?.calories || 0}</strong><span>kcal</span></div>
      <div class="recipe-nutrition-item"><strong>${recipe.nutrition?.protein || 0}g</strong><span>Protein</span></div>
      <div class="recipe-nutrition-item"><strong>${recipe.nutrition?.carbs || 0}g</strong><span>Carbs</span></div>
      <div class="recipe-nutrition-item"><strong>${recipe.nutrition?.fat || 0}g</strong><span>Chất béo</span></div>
      <div class="recipe-nutrition-item"><strong>${recipe.servings || 2}</strong><span>Khẩu phần</span></div>
      <div class="recipe-nutrition-item"><strong>${(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)}</strong><span>Thời gian</span></div>
    </div>
  `;
  const tipsContent = `
    <ul>
      <li>Ướp nguyên liệu trước 15 phút để thấm gia vị.</li>
      <li>Chuẩn bị sẵn chảo nóng để tiết kiệm thời gian.</li>
      <li>Thêm rau thơm cuối cùng để giữ độ tươi.</li>
    </ul>
  `;
  const panel = document.querySelector(`.recipe-tab-panel[data-panel="${tab}"]`);
  if (panel) panel.innerHTML = tab === "steps" ? stepsContent : tab === "nutrition" ? nutritionContent : tipsContent;
}

function openRecipeModal(recipeId) {
  const recipe = state.recipes.find(r => r.id === recipeId);
  if (!recipe) return;
  state.currentRecipe = recipe;

  const imageUrl = getRecipeImage(recipe);
  const servings = parseInt(state.filters.servings) || 2;

  els.modalTitle.textContent = recipe.name;

  els.modalBody.innerHTML = `
    <div class="recipe-detail__image recipe-detail__image--premium">
      <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(recipe.name)}">
      <div class="recipe-detail__image-overlay">
        <span>${recipe.nutrition?.calories || 0} kcal</span>
        <strong>${recipe.nutrition?.protein || 0}g protein</strong>
      </div>
    </div>

    <div class="recipe-detail__meta recipe-detail__meta--premium">
      ${renderMetaPills(recipe, servings)}
    </div>

    <div class="recipe-detail__section">
      <h3>Nguyên liệu (${servings} người)</h3>
      <table class="recipe-ingredients-table">
        <thead>
          <tr>
            <th>Nguyên liệu</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${(recipe.ingredients || []).map(ing => {
            const resolved = resolvePurchaseItem(ing, recipe);
            const ingredient = resolved.ingredient;
            const product = resolved.product;
            const unitPrice = resolved.unitPrice || 0;
            const total = resolved.estimatedPrice || resolved.totalPrice || 0;
            return `
              <tr>
                <td>${escapeHTML(ingredient?.name || product?.name || "Nguyên liệu")}</td>
                <td>${escapeHTML(resolved.displayQty || "")}</td>
                <td>${product ? `${formatCurrency(unitPrice)}/ ${escapeHTML(product.unit || "")}` : "Chưa có trong kho"}</td>
                <td>${formatCurrency(total)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>

    <div class="recipe-detail__section">
      <h3>Các bước nấu</h3>
      ${renderRecipeStepTabs(recipe)}
    </div>

    <div class="recipe-detail__section">
      <h3>Giá trị dinh dưỡng (mỗi phần)</h3>
      <div class="recipe-nutrition-grid">
        <div class="recipe-nutrition-item"><strong>${recipe.nutrition?.calories || 0}</strong><span>kcal</span></div>
        <div class="recipe-nutrition-item"><strong>${recipe.nutrition?.protein || 0}g</strong><span>Protein</span></div>
        <div class="recipe-nutrition-item"><strong>${recipe.nutrition?.carbs || 0}g</strong><span>Carbs</span></div>
        <div class="recipe-nutrition-item"><strong>${recipe.nutrition?.fat || 0}g</strong><span>Chất béo</span></div>
      </div>
    </div>

    ${(recipe.tags || recipe.goalTags || []).length > 0 ? `
      <div class="recipe-detail__section">
        <h3>Tags</h3>
        <div class="recipe-tags">
          ${(recipe.tags || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("")}
          ${(recipe.goalTags || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join("")}
        </div>
      </div>
    ` : ""}

    <div class="recipe-modal-actions">
      <button type="button" class="btn btn--outline" id="modal-close-btn">Đóng</button>
      <button type="button" class="btn btn--primary" id="modal-add-cart-btn">Thêm vào giỏ hàng</button>
    </div>
  `;

  setModalOpen(true);

  document.getElementById("modal-close-btn")?.addEventListener("click", closeModal);
  document.getElementById("modal-add-cart-btn")?.addEventListener("click", () => {
    closeModal();
    openAddToCartModal(recipeId);
  });
  bindRecipeStepTabs(els.modalBody);
}

function setModalOpen(isOpen) {
  if (!els.modalOverlay) return;

  if (isOpen) {
    els.modalOverlay.style.display = 'flex';
    els.modalOverlay.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        els.modalOverlay.classList.add('active');
      });
    });
    return;
  }

  els.modalOverlay.classList.remove('active');
  els.modalOverlay.style.pointerEvents = 'none';
  document.body.style.overflow = '';
  window.setTimeout(() => {
    if (!els.modalOverlay.classList.contains('active')) {
      els.modalOverlay.style.display = 'none';
    }
  }, 220);
}

function closeModal() {
  setModalOpen(false);
}

/* ── Add to Cart Modal ── */
function openAddToCartModal(recipeId) {
  const recipe = state.recipes.find(r => r.id === recipeId);
  if (!recipe) return;
  state.currentRecipe = recipe;

  const selectedIds = Array.from(state.selectedIngredients);
  const items = (recipe.ingredients || []).map(ingredientLine => {
    const ingredientId = getIngredientId(ingredientLine);
    const hasIngredient = selectedIds.includes(ingredientId);
    return { hasIngredient, resolved: resolvePurchaseItem(ingredientLine, recipe) };
  });

  els.addCartItemsList.innerHTML = items.map(({ hasIngredient, resolved }) => {
    const product = resolved.product;
    const ingredientName = resolved.ingredient?.name || "Nguyên liệu";
    if (!product) return "";
    return `
      <div class="add-cart-item" data-product-id="${escapeHTML(product.id)}" data-cart-qty="${resolved.cartQty}">
        <label class="add-cart-item__label">
          <input type="checkbox" class="add-cart-item__check" ${hasIngredient ? "" : "checked"} data-has-ingredient="${hasIngredient}">
          <div class="add-cart-item__info">
            <div class="add-cart-item__name">${escapeHTML(product.name)}</div>
            <div class="add-cart-item__details">
              <span class="add-cart-item__qty">${resolved.cartQty} ${escapeHTML(product.unit || "")}</span>
              <span class="add-cart-item__price">${escapeHTML(ingredientName)}</span>
              <span class="add-cart-item__total">${formatCurrency(resolved.totalPrice || 0)}</span>
            </div>
            ${hasIngredient ? '<div class="add-cart-item__owned-badge">Đã có</div>' : ""}
          </div>
        </label>
      </div>
    `;
  }).join("");

  els.addCartModalDesc.textContent = `Món "${recipe.name}" cần ${recipe.ingredients?.length || 0} nguyên liệu. Nguyên liệu còn thiếu được chọn sẵn; món bạn đã có vẫn có thể chọn thêm nếu muốn mua dự phòng.`;
  updateAddCartSummary();
  setAddCartModalOpen(true);
}

function setAddCartModalOpen(isOpen) {
  if (!els.addCartModalOverlay) return;

  if (isOpen) {
    els.addCartModalOverlay.style.display = 'flex';
    els.addCartModalOverlay.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        els.addCartModalOverlay.classList.add('active');
      });
    });
    return;
  }

  els.addCartModalOverlay.classList.remove('active');
  els.addCartModalOverlay.style.pointerEvents = 'none';
  document.body.style.overflow = '';
  window.setTimeout(() => {
    if (!els.addCartModalOverlay.classList.contains('active')) {
      els.addCartModalOverlay.style.display = 'none';
    }
  }, 220);
}

function closeAddCartModal() {
  setAddCartModalOpen(false);
}

function updateAddCartSummary() {
  const checked = els.addCartItemsList.querySelectorAll('.add-cart-item__check:checked').length;
  els.addCartSummary.innerHTML = `Đã chọn <strong>${checked}</strong> sản phẩm`;
}

function confirmAddToCart() {
  const recipe = state.currentRecipe;
  if (!recipe) return;

  const cart = getActiveCart();
  cart.items = cart.items || [];
  let addedCount = 0;

  els.addCartItemsList.querySelectorAll(".add-cart-item__check:checked").forEach(cb => {
    const item = cb.closest(".add-cart-item");
    const productId = item?.dataset.productId;
    const cartQty = Math.max(1, parseInt(item?.dataset.cartQty || "1", 10));
    if (!getCatalogProduct(productId)) return;
    const existing = cart.items.find(entry => entry.productId === productId);
    if (existing) {
      existing.quantity += cartQty;
    } else {
      cart.items.push({ productId, quantity: cartQty });
    }
    addedCount++;
  });

  cart.updatedAt = new Date().toISOString();
  setActiveCart(cart);

  if (addedCount > 0) {
    showToast(`Đã thêm ${addedCount} sản phẩm còn thiếu của "${recipe.name}" vào giỏ hàng!`);
  } else {
    showToast("Bạn đã có đủ nguyên liệu hoặc chưa chọn sản phẩm nào.", "info");
  }

  closeAddCartModal();
}

/* ── Cart Integration ── */


function addRecipeToCart(recipeId) {
  const recipe = state.recipes.find(r => r.id === recipeId);
  if (!recipe) {
    showToast("Không tìm thấy công thức", "error");
    return;
  }

  const cart = getActiveCart();
  cart.items = cart.items || [];
  const purchaseIngredients = getMissingIngredients(recipe);
  let addedCount = 0;

  purchaseIngredients.forEach(ingredientLine => {
    const resolved = resolvePurchaseItem(ingredientLine, recipe);
    const product = resolved.product;
    if (!product) return;
    const existing = cart.items.find(entry => entry.productId === product.id);
    if (existing) {
      existing.quantity += resolved.cartQty;
    } else {
      cart.items.push({ productId: product.id, quantity: resolved.cartQty });
    }
    addedCount++;
  });

  cart.updatedAt = new Date().toISOString();
  setActiveCart(cart);
  if (addedCount > 0) {
    showToast(`Đã thêm ${addedCount} sản phẩm còn thiếu của "${recipe.name}" vào giỏ hàng!`);
  } else {
    showToast("Bạn đã có đủ nguyên liệu cho món này.", "info");
  }
}



/* ── Boot ── */
document.addEventListener('DOMContentLoaded', init);
