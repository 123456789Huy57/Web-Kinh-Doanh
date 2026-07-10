# FreshMart Sitemap Notes

## Codebase Inspected

- Root HTML pages: `index.html`, `catalog.html`, `product-detail.html`, `cart.html`, `checkout.html`, `meal-planner.html`, `account.html`, `orders.html`, `vouchers.html`, `wishlist.html`, `compare.html`, `login.html`, `register.html`, and footer/static pages.
- Shared layout and navigation: `js/main.js`.
- Customer flow modules: `js/catalog.js`, `js/product.js`, `js/cart.js`, `js/checkout.js`, `js/orders.js`, `js/account.js`, `js/vouchers.js`, `js/wishlist.js`, `js/compare.js`.
- AI cooking assistant: `meal-planner.html`, `js/meal-planner.js`, `data/ingredients.json`, `data/recipes.json`, `data/ingredient-product-map.json`, `data/products.json`.
- Admin interface: `admin.html`, `js/admin.js`, `data/products.json`, `data/orders.json`, `data/vouchers.json`, `data/users.json`.
- Project notes: `PROJECT-DOCUMENTATION.md`, `README.md`.

## Customer Structure Found

The customer website is a static multi-page HTML application. Header and footer navigation are mounted by `js/main.js`. The real customer pages include homepage, catalog, product detail, cart, checkout, account, orders, vouchers, wishlist, compare, login/register, stores, blog, guide, and policy/about pages.

The Meal Planner page works as an ingredient-based AI cooking assistant. Users select available ingredients and preferences, generate recipe suggestions, view a suggested dish, view cooking instructions and nutrition, see missing ingredients, and add linked shop products to cart.

## Admin Structure Found

The admin site is a single `admin.html` page with hash/tab navigation:

- `#dashboard`
- `#products`
- `#orders`
- `#inventory`
- `#vouchers`
- `#banners`
- `#users`
- `#support`

Admin product and voucher forms exist in `js/admin.js`. Product changes and voucher changes are saved to localStorage and merged into the customer shop. Orders are read from localStorage and the admin can change order status.

## Assumptions and Missing Routes

- There is no Angular routing or route module; the project uses plain HTML pages plus JavaScript modules.
- Category management is not a separate admin tab. Categories are derived from product data, so it is not shown as a standalone admin page.
- Recipe management is not present in the admin panel, so it is not included as an admin page.
- Analytics/reports are represented only by dashboard summary cards and tables, not by a separate reports page.
- Banner management appears as an admin tab, but only basic view/static table behavior is present.
- Support management appears as an admin tab with an empty state, not a full ticket workflow.
