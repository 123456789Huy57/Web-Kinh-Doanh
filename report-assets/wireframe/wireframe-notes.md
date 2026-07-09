# FreshMart Wireframe Notes

## Codebase Inspected

- Root HTML pages: `index.html`, `catalog.html`, `product-detail.html`, `cart.html`, `checkout.html`, `account.html`, `orders.html`, `meal-planner.html`, `admin.html`, plus static footer pages.
- Shared layout/navigation: `js/main.js`.
- Customer page modules: `js/catalog.js`, `js/product.js`, `js/cart.js`, `js/checkout.js`, `js/account.js`, `js/orders.js`, `js/wishlist.js`, `js/vouchers.js`, `js/compare.js`.
- AI cooking assistant implementation: `meal-planner.html`, `js/meal-planner.js`, `data/ingredients.json`, `data/recipes.json`, `data/ingredient-product-map.json`, `data/products.json`.
- Admin implementation: `admin.html`, `js/admin.js`, `data/products.json`, `data/orders.json`, `data/vouchers.json`, `data/users.json`.
- Project documentation: `PROJECT-DOCUMENTATION.md`, `README.md`.

## Wireframes Created

These PNG files were regenerated as low-fidelity grayscale skeletons that follow the real FreshMart page frames: shared FreshMart header/footer, catalog sidebar, checkout two-column layout, account sidebar, Meal Planner/AI assistant panels, and admin sidebar/table layout.

- `homepage-wireframe.png`
- `product-catalog-wireframe.png`
- `product-detail-wireframe.png`
- `ai-cooking-assistant-input-wireframe.png`
- `ai-suggested-dish-result-wireframe.png`
- `cart-wireframe.png`
- `checkout-payment-wireframe.png`
- `account-personal-info-wireframe.png`
- `order-history-wireframe.png`
- `admin-dashboard-wireframe.png`
- `admin-product-management-wireframe.png`
- `admin-order-management-wireframe.png`

## Implemented Pages Represented

All customer wireframes are based on implemented pages:

- Homepage: `index.html` with shared layout from `js/main.js`.
- Product catalog: `catalog.html`, `js/catalog.js`.
- Product detail: `product-detail.html`, `js/product.js`.
- Cart: `cart.html`, `js/cart.js`.
- Checkout/payment: `checkout.html`, `js/checkout.js`.
- Account/personal information: `account.html`, `js/account.js`.
- Order history: `orders.html`, `js/orders.js`.
- AI cooking assistant: `meal-planner.html`, `js/meal-planner.js`.

Admin wireframes are based on implemented tabs inside `admin.html`:

- Dashboard: `#dashboard`
- Product management: `#products`
- Order management: `#orders`

## AI Feature Assumption

The AI feature is represented as an ingredient-based cooking assistant, not a 7-day meal planner. This matches the current `meal-planner.js` behavior: users select available ingredients, choose cooking preferences, generate a dish suggestion, view cooking steps/nutrition, see missing ingredients, and add linked shop products to cart.

## Missing or Prototype Areas

- There is no Angular routing or route module; this is a static HTML/CSS/JS application.
- There is no separate admin route for recipe management.
- There is no separate admin route for category management; categories are derived from product data.
- Full analytics/report pages are not implemented as separate routes; the admin dashboard provides summary cards and tables.
- Banner and support tabs exist in admin, but they are basic/static compared with product/order/voucher management.
