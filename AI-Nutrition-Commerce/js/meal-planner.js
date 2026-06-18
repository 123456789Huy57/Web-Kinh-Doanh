import { fetchJSON, formatCurrency, formatNumber, escapeHTML, generateId } from "./utils.js";
import { getMealPlans, setMealPlans, getActiveCart, setActiveCart, getCurrentUser } from "./storage.js";
import { showToast } from "./main.js";

const DATA_PATHS = {
  meals: "./data/meals.json",
  recipes: "./data/recipes.json",
  templates: "./data/meal-templates.json",
  products: "./data/products.json"
};

const GOALS = [
  { key: "healthy", label: "Healthy", icon: "🥗" },
  { key: "high-protein", label: "High Protein", icon: "💪" },
  { key: "vegetarian", label: "Chay", icon: "🌿" },
  { key: "budget", label: "Tiết kiệm", icon: "💰" }
];

const MEAL_TYPE_LABELS = {
  breakfast: "Sáng",
  lunch: "Trưa",
  dinner: "Tối",
  snack: "Phụ"
};

let plannerState = {
  meals: [],
  recipes: [],
  templates: [],
  products: [],
  config: { people: 4, weeklyBudget: 700000, goal: "healthy" }
};

function byId(list, id) {
  return list.find((item) => item.id === id);
}

function chooseTemplate(goal) {
  return plannerState.templates.find((t) => t.goal === goal) || plannerState.templates[0];
}

function chooseMealsForTemplate(template) {
  const preferred = template?.preferredMealIds || [];
  return preferred.map((id) => byId(plannerState.meals, id)).filter(Boolean).slice(0, 21);
}

function buildPlan({ people, weeklyBudget, goal }) {
  const template = chooseTemplate(goal);
  const meals = chooseMealsForTemplate(template);
  const days = [];
  const selectedMeals = [];
  const mealPattern = template?.mealPattern || ["breakfast", "lunch", "dinner"];
  const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const dayMeals = mealPattern.map((mealType, slotIndex) => {
      const pool = meals.filter((m) => m.mealType === mealType);
      const meal = pool[(dayIndex + slotIndex) % Math.max(1, pool.length)] || meals[(dayIndex + slotIndex) % meals.length];
      if (!meal) return null;
      selectedMeals.push(meal);
      const recipe = byId(plannerState.recipes, meal.recipeId);
      return {
        mealType,
        name: meal.name,
        recipeName: recipe?.name || meal.name,
        calories: recipe?.nutrition?.calories || 0
      };
    }).filter(Boolean);

    const dayCalories = dayMeals.reduce((s, m) => s + m.calories, 0);
    days.push({ day: dayNames[dayIndex], meals: dayMeals, calories: dayCalories });
  }

  const nutrition = selectedMeals.reduce(
    (total, meal) => {
      const recipe = byId(plannerState.recipes, meal.recipeId);
      if (!recipe) return total;
      total.calories += recipe.nutrition?.calories || 0;
      total.protein += recipe.nutrition?.protein || 0;
      total.carbs += recipe.nutrition?.carbs || 0;
      total.fat += recipe.nutrition?.fat || 0;
      return total;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const shoppingMap = new Map();
  selectedMeals.forEach((meal) => {
    const recipe = byId(plannerState.recipes, meal.recipeId);
    if (!recipe) return;
    (recipe.ingredients || []).forEach((ingredient) => {
      const product = byId(plannerState.products, ingredient.productId);
      if (!product) return;
      const factor = Math.max(1, people) / Math.max(1, recipe.servings);
      const quantity = Math.ceil(ingredient.quantity * factor);
      const current = shoppingMap.get(product.id) || { productId: product.id, name: product.name, quantity: 0, estimatedPrice: 0 };
      current.quantity += quantity;
      current.estimatedPrice = current.quantity * (product.salePrice || product.price);
      shoppingMap.set(product.id, current);
    });
  });

  const shoppingList = [...shoppingMap.values()];
  const totalCost = shoppingList.reduce((s, i) => s + i.estimatedPrice, 0);

  return {
    id: generateId("mp"),
    userId: getCurrentUser()?.id || null,
    templateId: template?.id || null,
    templateName: template?.name || "Meal Plan",
    people,
    weeklyBudget,
    goal,
    days,
    nutrition,
    shoppingList,
    totalCost,
    createdAt: new Date().toISOString()
  };
}

function renderConfigSection() {
  const cfg = plannerState.config;
  return `
    <div class="meal-header">
      <h1 class="meal-header__title">🍽️ Meal Planner</h1>
      <p class="meal-header__desc">Lập thực đơn hàng tuần dựa trên mục tiêu dinh dưỡng. Hoàn toàn chạy local trên trình duyệt.</p>
    </div>

    <div class="meal-config">
      <div class="meal-config-card">
        <div class="meal-config-card__title">💰 Ngân sách tuần</div>
        <input type="range" class="budget-slider" id="budget-slider" min="200000" max="2000000" step="50000" value="${cfg.weeklyBudget}" />
        <div class="budget-value" id="budget-display">${formatCurrency(cfg.weeklyBudget)}</div>
      </div>
      <div class="meal-config-card">
        <div class="meal-config-card__title">👥 Số người</div>
        <div class="people-selector" id="people-selector">
          ${[1, 2, 3, 4, 5, 6].map((n) => `
            <button class="people-btn ${cfg.people === n ? "is-active" : ""}" data-people="${n}" type="button">${n}</button>
          `).join("")}
        </div>
      </div>
      <div class="meal-config-card">
        <div class="meal-config-card__title">🎯 Mục tiêu</div>
        <div class="goal-options" id="goal-options">
          ${GOALS.map((g) => `
            <button class="goal-option ${cfg.goal === g.key ? "is-active" : ""}" data-goal="${g.key}" type="button">
              <span class="goal-option__icon">${g.icon}</span>
              ${g.label}
            </button>
          `).join("")}
        </div>
      </div>
    </div>

    <div class="meal-generate">
      <button class="btn btn--primary btn--lg" id="generate-btn" type="button">✨ Tạo thực đơn</button>
    </div>
  `;
}

function renderMealPlan(plan) {
  return `
    <div class="meal-plan">
      <h2 class="meal-plan__title">📋 Thực đơn: ${escapeHTML(plan.templateName)}</h2>
      ${plan.days.map((day) => `
        <div class="meal-day">
          <div class="meal-day__header">
            <span>${day.day}</span>
            <span class="meal-day__calories">${formatNumber(day.calories)} kcal</span>
          </div>
          <div class="meal-day__meals">
            ${day.meals.map((meal) => `
              <div class="meal-item">
                <span class="meal-item__type meal-item__type--${meal.mealType}">${MEAL_TYPE_LABELS[meal.mealType] || meal.mealType}</span>
                <span class="meal-item__name">${escapeHTML(meal.name)}</span>
                <span class="meal-item__cal">${formatNumber(meal.calories)} kcal</span>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}

      <div style="margin-top:16px;padding:16px 20px;background:var(--color-primary-light);border-radius:var(--radius-lg);display:flex;gap:24px;flex-wrap:wrap;justify-content:center;">
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:900;color:var(--color-primary);">${formatNumber(plan.nutrition.calories)}</div>
          <div style="font-size:12px;color:var(--color-muted);">Tổng Calories</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:900;color:var(--color-primary);">${formatNumber(plan.nutrition.protein)}g</div>
          <div style="font-size:12px;color:var(--color-muted);">Protein</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:900;color:var(--color-primary);">${formatNumber(plan.nutrition.carbs)}g</div>
          <div style="font-size:12px;color:var(--color-muted);">Carbs</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:20px;font-weight:900;color:var(--color-primary);">${formatNumber(plan.nutrition.fat)}g</div>
          <div style="font-size:12px;color:var(--color-muted);">Fat</div>
        </div>
      </div>
    </div>
  `;
}

function renderShoppingList(plan) {
  const totalCost = plan.shoppingList.reduce((s, i) => s + i.estimatedPrice, 0);

  return `
    <div class="shopping-list">
      <div class="shopping-list__title">
        <span>🛒 Danh sách mua sắm</span>
        <span>${plan.shoppingList.length} sản phẩm</span>
      </div>
      <div class="shopping-list__items">
        ${plan.shoppingList.map((item) => `
          <div class="shopping-list-item">
            <span class="shopping-list-item__name">${escapeHTML(item.name)}</span>
            <span class="shopping-list-item__qty">×${formatNumber(item.quantity)}</span>
            <span class="shopping-list-item__price">${formatCurrency(item.estimatedPrice)}</span>
          </div>
        `).join("")}
      </div>
      <div class="shopping-list__total">
        <span>Tổng ước tính</span>
        <span class="shopping-list__total-value">${formatCurrency(totalCost)}</span>
      </div>
      <button class="btn btn--primary btn--block btn--lg" id="meal-to-cart-btn" type="button" style="margin-top:16px;">🛒 Thêm toàn bộ vào giỏ hàng</button>
    </div>
  `;
}

function addShoppingListToCart(plan) {
  const cart = getActiveCart();
  cart.items = cart.items || [];
  plan.shoppingList.forEach((item) => {
    const existing = cart.items.find((e) => e.productId === item.productId);
    if (existing) existing.quantity += item.quantity;
    else cart.items.push({ productId: item.productId, quantity: item.quantity });
  });
  cart.updatedAt = new Date().toISOString();
  setActiveCart(cart);
}

function bindConfigEvents() {
  const slider = document.getElementById("budget-slider");
  const display = document.getElementById("budget-display");
  slider?.addEventListener("input", () => {
    plannerState.config.weeklyBudget = Number(slider.value);
    if (display) display.textContent = formatCurrency(plannerState.config.weeklyBudget);
  });

  document.getElementById("people-selector")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-people]");
    if (!btn) return;
    plannerState.config.people = Number(btn.dataset.people);
    document.querySelectorAll(".people-btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
  });

  document.getElementById("goal-options")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-goal]");
    if (!btn) return;
    plannerState.config.goal = btn.dataset.goal;
    document.querySelectorAll(".goal-option").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
  });
}

function bindMealCartButton(plan) {
  document.getElementById("meal-to-cart-btn")?.addEventListener("click", () => {
    addShoppingListToCart(plan);
    const btn = document.getElementById("meal-to-cart-btn");
    if (btn) btn.textContent = "✅ Đã thêm vào giỏ";
    showToast("Đã thêm toàn bộ nguyên liệu vào giỏ hàng");
  });
}

async function initMealPlannerPage() {
  const [mealsRaw, recipesRaw, templatesRaw, productsRaw] = await Promise.all([
    fetchJSON(DATA_PATHS.meals),
    fetchJSON(DATA_PATHS.recipes),
    fetchJSON(DATA_PATHS.templates),
    fetchJSON(DATA_PATHS.products)
  ]);

  plannerState.meals = mealsRaw.filter((m) => m.isActive !== false);
  plannerState.recipes = recipesRaw.filter((r) => r.isActive !== false);
  plannerState.templates = templatesRaw.filter((t) => t.isActive !== false);
  plannerState.products = productsRaw.filter((p) => p.isActive !== false);

  const root = document.getElementById("meal-root");
  if (!root) return;

  root.innerHTML = renderConfigSection() + '<div id="planner-output"></div>';
  bindConfigEvents();

  const output = document.getElementById("planner-output");
  const latest = getMealPlans()[0];
  if (latest && output) {
    output.innerHTML = renderMealPlan(latest) + renderShoppingList(latest);
    bindMealCartButton(latest);
  }

  document.getElementById("generate-btn")?.addEventListener("click", () => {
    const plan = buildPlan(plannerState.config);
    const plans = getMealPlans();
    plans.unshift(plan);
    setMealPlans(plans);

    if (output) {
      output.innerHTML = renderMealPlan(plan) + renderShoppingList(plan);
      bindMealCartButton(plan);
      output.scrollIntoView({ behavior: "smooth" });
    }
    showToast("Đã tạo thực đơn mới!");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "meal-planner") {
    initMealPlannerPage();
  }
});

export { initMealPlannerPage };
