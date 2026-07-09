# Chapter 4 Screenshot Notes

## Inspected Files, Routes, And Components

- Main customer routes: `index.html`, `catalog.html`, `product-detail.html`, `cart.html`, `checkout.html`, `orders.html`, `login.html`, `register.html`, `account.html`, `blog.html`, `meal-planner.html`.
- Admin route: `admin.html` with hash tabs `#dashboard`, `#products`, `#orders`, `#inventory`, `#vouchers`, `#banners`, `#users`.
- Shared/frontend logic: `js/main.js`, `js/storage.js`, `js/utils.js`, `js/catalog.js`, `js/product.js`, `js/cart.js`, `js/checkout.js`, `js/orders.js`, `js/account.js`, `js/meal-planner.js`, `js/admin.js`.
- Styling/theme files: `css/style.css`, `css/home.css`, `css/catalog.css`, `css/product.css`, `css/cart.css`, `css/checkout.css`, `css/orders.css`, `css/account.css`, `css/meal.css`, `css/admin.css`.
- Data files: `data/products.json`, `data/categories.json`, `data/users.json`, `data/orders.json`, `data/vouchers.json`, `data/ingredients.json`, `data/recipes.json`, `data/ingredient-product-map.json`.
- Documentation/setup: `README.md`, `PROJECT-DOCUMENTATION.md`, `PRODUCT-DATA-GUIDE.md`.

## Captured Screenshots

1. `figure-4-01-login-interface.png` - Login interface.
2. `figure-4-02-signup-interface.png` - Sign-up interface.
3. `figure-4-03-homepage-interface.png` - Homepage.
4. `figure-4-04-product-catalog-interface.png` - Product catalog.
5. `figure-4-05-product-detail-interface.png` - Product detail for a real product from `data/products.json`.
6. `figure-4-06-search-filter-result-interface.png` - Catalog search/filter result.
7. `figure-4-07-ai-cooking-assistant-input-interface.png` - Ingredient-based AI cooking assistant input.
8. `figure-4-08-ai-suggested-dish-result-interface.png` - Suggested dish result.
9. `figure-4-09-missing-ingredient-product-links-interface.png` - Missing ingredient product links.
10. `figure-4-10-cart-interface.png` - Cart with real product IDs.
11. `figure-4-11-checkout-payment-interface.png` - Checkout/payment page.
12. `figure-4-12-personal-information-interface.png` - Personal information/account page.
13. `figure-4-13-order-history-interface.png` - Order history page.
14. `figure-4-14-order-detail-interface.png` - Order detail page using `orders.html?order=ord-ch4-001`.
15. `figure-4-15-blog-support-content-interface.png` - Blog/support content page.
16. `figure-4-17-admin-dashboard-interface.png` - Admin dashboard.
17. `figure-4-18-admin-product-management-interface.png` - Admin product management.
18. `figure-4-19-add-edit-product-interface.png` - Add/edit product modal.
19. `figure-4-20-admin-order-management-interface.png` - Admin order management.
20. `figure-4-21-order-detail-change-status-interface.png` - Admin order detail/change status modal.
21. `figure-4-22-inventory-management-interface.png` - Inventory management.
22. `figure-4-23-voucher-management-interface.png` - Voucher management.
23. `figure-4-24-banner-content-management-interface.png` - Banner/content management.
24. `figure-4-25-customer-management-interface.png` - Customer management.
25. `figure-4-26-project-source-code-structure.png` - Source code structure summary based on inspected project files.
26. `figure-4-28-customer-website-running-successfully.png` - Customer website running successfully.
27. `figure-4-29-admin-website-running-successfully.png` - Admin website running successfully.

## Screenshots Not Captured

- `figure-4-16-admin-login-interface.png`: no separate admin login interface was found. `admin.html` opens directly as an admin dashboard route.
- `figure-4-27-backend-running-terminal-api-health-check.png`: no backend/API server was found. The README describes the project as static HTML/CSS/JavaScript with JSON data.
- `figure-4-30-lighthouse-homepage-result.png` and `figure-4-31-lighthouse-product-or-ai-result.png`: Lighthouse CLI was not available in the local environment, so scores were not measured.

## Implemented Features Found

- Customer authentication UI and seed users stored in `data/users.json`.
- Homepage, catalog, product detail, search/filter UI, cart, checkout, account, order history and order detail.
- Ingredient-based AI Cooking Assistant in `meal-planner.html` and `js/meal-planner.js`.
- Missing-ingredient product linking through `data/ingredient-product-map.json`.
- Admin dashboard, product table, add/edit product modal, order management, inventory, vouchers, banner table and customer table.
- State persistence through `localStorage` helpers in `js/storage.js`.

## Planned Or Prototype-Only Areas

- No production backend/API layer is present.
- Admin authentication is not separated from the admin dashboard route.
- Banner management is represented as a static admin table rather than a complete CRUD workflow.
- Support tickets are represented but show an empty state.
- Lighthouse/performance reporting was not generated in this environment.

## Test Accounts Used

- Customer seed account: `a@example.com / 123456`.
- Admin seed account found: `admin@example.com / admin123`.
- Admin route did not require login during screenshot capture.
- A temporary local seed helper, `seed-chapter4-state.html`, was used only to preload localStorage with a real seed user, cart items using actual product IDs, and an order for report screenshots.

## Suggested Captions And Implementation Notes

- Figure 4.1: Login interface. The login form is rendered by `js/account.js` and styled by `css/account.css`.
- Figure 4.2: Sign-up interface. The registration form creates a local account record in browser storage.
- Figure 4.3: Homepage interface. The homepage uses shared header/footer logic from `js/main.js`.
- Figure 4.4: Product catalog interface. Product cards are populated from `data/products.json`.
- Figure 4.5: Product detail interface. The detail page reads the product slug from the URL and displays product information.
- Figure 4.6: Search/filter result interface. Catalog filtering is handled client-side by `js/catalog.js`.
- Figure 4.7: AI Cooking Assistant input interface. Users select available ingredients and cooking preferences.
- Figure 4.8: AI suggested dish result. The system suggests a suitable recipe from the recipe data.
- Figure 4.9: Missing ingredient product links. Missing recipe ingredients are mapped to purchasable shop products.
- Figure 4.10: Cart interface. Cart state is stored with user-scoped localStorage keys.
- Figure 4.11: Checkout/payment interface. Checkout displays address, payment method and order summary.
- Figure 4.12: Personal information interface. Account information is rendered from the current user state.
- Figure 4.13: Order history interface. Orders are loaded from localStorage and seed JSON data.
- Figure 4.14: Order detail interface. The route `orders.html?order=...` displays timeline, address and item details.
- Figure 4.15: Blog/support interface. Informational content is available through `blog.html`.
- Figure 4.17: Admin dashboard. Dashboard metrics combine products, orders and users.
- Figure 4.18: Admin product management. Product rows use real product data and admin storage overrides.
- Figure 4.19: Add/edit product interface. The modal supports product fields, stock and image URL/upload.
- Figure 4.20: Admin order management. Orders can be viewed and status values can be changed.
- Figure 4.21: Admin order detail/change status. The modal shows order summary information.
- Figure 4.22: Inventory management. The inventory tab highlights stock levels.
- Figure 4.23: Voucher management. Voucher data is loaded from `data/vouchers.json`.
- Figure 4.24: Banner/content management. The banner table is present as a management placeholder.
- Figure 4.25: Customer management. The user table is loaded from `data/users.json`.
- Figure 4.26: Source code structure. The project is organized as static pages, CSS modules, JavaScript modules and JSON data.
- Figure 4.28: Customer website running successfully. The site runs locally at `http://127.0.0.1:8088/index.html`.
- Figure 4.29: Admin website running successfully. The admin interface runs locally at `http://127.0.0.1:8088/admin.html`.

## Errors Or Issues Found

- README text has some encoding artifacts, but the implemented pages render Vietnamese text correctly in the browser.
- No backend health endpoint is available.
- No separate admin login route is implemented.
- Lighthouse was not measured because the local Lighthouse command was unavailable.
