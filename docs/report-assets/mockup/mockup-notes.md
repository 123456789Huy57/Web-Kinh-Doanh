# FreshMart High-Fidelity Mockup Notes

## Inspected routes, pages, and components

- `index.html` with `js/main.js`, `css/style.css`, `css/home.css`
- `catalog.html` with `js/catalog.js`, `css/catalog.css`
- `product-detail.html` with `js/product.js`, `css/product.css`
- `meal-planner.html` with `js/meal-planner.js`, `css/meal.css`
- `cart.html` with `js/cart.js`, `css/cart.css`
- `checkout.html` with `js/checkout.js`, `css/checkout.css`
- `account.html` with `js/account.js`, `css/account.css`
- `orders.html` with `js/orders.js`, `css/orders.css`
- `admin.html` with `js/admin.js`, `css/admin.css`
- Shared header, footer, product card, cart/order data, admin products, admin vouchers, and admin orders.

## Mockups created

- `homepage-mockup.png`
- `product-catalog-mockup.png`
- `product-detail-mockup.png`
- `ai-cooking-assistant-input-mockup.png`
- `ai-suggested-dish-result-mockup.png`
- `cart-mockup.png`
- `checkout-payment-mockup.png`
- `account-personal-info-mockup.png`
- `order-history-mockup.png`
- `admin-dashboard-mockup.png`
- `admin-product-management-mockup.png`
- `admin-order-management-mockup.png`

## Based on implemented pages

- Homepage
- Product Catalog
- Product Detail
- AI Cooking Assistant input flow on `meal-planner.html`
- Cart
- Checkout / Payment
- Account / Personal Information
- Order History
- Admin Dashboard tab
- Admin Product Management tab
- Admin Order Management tab

## Prototype or planned screen states

- `ai-suggested-dish-result-mockup.png` is based on the implemented Meal Planner result/detail behavior, but presented as a clean standalone report screen. The current site uses `meal-planner.html` and dynamic UI state rather than a separate `ai-result.html` route.
- Admin Dashboard, Product Management, and Order Management are tabs/states inside `admin.html`, not separate HTML routes.

## Assumptions

- The report uses the English FreshMart brand name and slogan: "Eat Smart. Live Fresh."
- Mockups are high-fidelity reconstructed screens for report presentation, not raw browser screenshots.
- Product imagery is represented with consistent FreshMart-style placeholders so the layout remains clean and report-friendly.
- Screen size is 16:9, optimized for insertion into Word/PDF.

## Missing or limited features found

- Admin CRUD is implemented as a front-end/localStorage demo flow; a production website still needs backend/API persistence.
- Product image upload exists in admin form logic, but production upload/storage would need a real file service.
- AI result is a state within Meal Planner rather than a dedicated route.
- Some source comments and legacy naming still refer to Meal Planner, while the report feature name is better described as ingredient-based AI Cooking Assistant.
