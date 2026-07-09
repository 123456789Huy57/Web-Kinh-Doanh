# CHAPTER 4: RESULTS AND PRODUCT

## 4.1 Technical Implementation

### 4.1.1 Frontend and Backend Development

FreshMart was implemented as a static web application using HTML, CSS and JavaScript modules. The customer website runs locally at `http://127.0.0.1:8088/index.html`. The main customer pages include homepage, product catalog, product detail, cart, checkout, account, order history, blog/support content and the AI Cooking Assistant page.

The frontend source is separated by page responsibility. Shared layout, header, footer, product image handling and common UI behavior are implemented in `js/main.js`. Page-specific logic is implemented in files such as `js/catalog.js`, `js/product.js`, `js/cart.js`, `js/checkout.js`, `js/orders.js`, `js/account.js` and `js/meal-planner.js`. Styling is organized in page-level CSS files, including `css/home.css`, `css/catalog.css`, `css/product.css`, `css/cart.css`, `css/checkout.css`, `css/orders.css`, `css/account.css`, `css/meal.css` and `css/admin.css`.

The project does not currently include a production backend API. Instead, product, account, order, voucher, ingredient and recipe data are stored in JSON files under the `data/` directory. User state, cart data, order data and admin overrides are stored in browser localStorage through helper functions in `js/storage.js`. This approach is suitable for a course prototype because it allows the main e-commerce workflows to be demonstrated locally without requiring database deployment.

The admin interface is implemented in `admin.html` with hash-based sections for dashboard, products, orders, inventory, vouchers, banners and users. Product and order data are loaded from JSON files and merged with localStorage changes. The admin product form supports fields such as name, brand, category, price, sale price, stock, unit, image URL and nutrition information. Order management includes status selection and an order detail modal.

### 4.1.2 AI Integration and Prompt Engineering

The AI feature in FreshMart is an ingredient-based AI Cooking Assistant, not a seven-day meal planner. Users select ingredients they already have, then choose cooking preferences such as cuisine style, meal type, difficulty, cooking time, serving size and dietary preferences. Based on these inputs, the system filters available recipe data and recommends a suitable dish.

The implementation is located mainly in `meal-planner.html` and `js/meal-planner.js`. Ingredient data are loaded from `data/ingredients.json`, recipe data from `data/recipes.json`, and product linking data from `data/ingredient-product-map.json`. After a recipe is suggested, the system compares the selected ingredients with the recipe requirements. Ingredients that the user does not already have are displayed as missing items. When a missing ingredient can be matched to a FreshMart product, the interface shows a product link and allows the user to add the required product to the cart.

This implementation demonstrates the intended AI workflow at prototype level: collect user context, select a suitable recipe, explain ingredient coverage and connect missing ingredients back to the e-commerce catalog. Because the project is static, the current AI logic is implemented through local recipe and ingredient matching rather than a deployed external AI API.

## 4.2 Product Showcase

### 4.2.1 Customer Interfaces

The customer side of FreshMart includes all core e-commerce screens needed for a functional shopping flow. The login and sign-up pages provide account access screens. The homepage introduces the grocery shopping experience and links users into product browsing. The catalog page displays real product data from `data/products.json`, and the product detail page shows information for an individual product using the URL slug.

The search/filter result screen shows that users can narrow products in the catalog. The cart screen displays selected products, quantities and price summary. The checkout screen includes customer information, delivery details, payment method and order summary. The account page displays personal information for the logged-in user. Order history and order detail pages show past orders, order status, delivery information and product items.

The AI Cooking Assistant is presented as a customer-facing value-added feature. Users choose ingredients they already have, generate a dish suggestion and review missing ingredients. The missing ingredient section connects recipe needs to products in the FreshMart shop, helping turn a recipe recommendation into a shopping action.

### 4.2.2 Admin Interfaces

The admin interface provides a management view for the prototype. The dashboard summarizes products, orders, revenue and users. Product management lists real products and provides a modal for adding or editing product information. Order management displays customer orders, payment status and processing status. The inventory tab supports stock monitoring and highlights product availability.

Voucher management lists configured discount codes. Banner/content management is present as a table for homepage communication content. Customer management displays seeded user accounts from `data/users.json`. These screens demonstrate the planned back-office workflow for managing product and order information, although some modules such as banner CRUD and support ticket handling are still limited.

No separate admin login screen was found during inspection. The admin dashboard is accessed directly through `admin.html`, while the seed user data contains an admin account. For a production version, the admin route should require authentication and role checking before allowing access to management functions.

## 4.3 Evaluation and Testing Results

### 4.3.1 Functional Testing

Functional testing was performed by opening the running local website and capturing screenshots from the actual implemented pages. The tested customer functions included login UI, sign-up UI, homepage, catalog, product detail, search/filter result, AI Cooking Assistant input, suggested dish result, missing ingredient links, cart, checkout, personal information, order history and order detail.

The tested admin functions included dashboard, product management, add/edit product modal, order management, order detail/status modal, inventory, voucher, banner/content and customer management. The screens loaded successfully from the local static server. A seed customer account, `a@example.com / 123456`, was used for user-related screens. The seed admin account found in the data file is `admin@example.com / admin123`, but the current admin page does not require login.

The AI Cooking Assistant successfully demonstrated the main expected behavior: selecting ingredients, generating a dish recommendation and showing missing ingredient product links. This confirms that the feature is implemented as ingredient-based recipe suggestion and product linking.

### 4.3.2 Performance Metrics

The website ran successfully on the local static server. The inspected README describes the project as a static HTML/CSS/JavaScript application without a backend server. Because no backend API exists, no backend health-check screenshot was captured.

Lighthouse performance screenshots were not produced because the Lighthouse CLI was not available in the local environment during this capture session. Therefore, no numerical Lighthouse scores are reported in this draft. Future evaluation should run Lighthouse for at least the homepage and either the product catalog or AI Cooking Assistant page to measure performance, accessibility, best practices and SEO.

### 4.3.3 User Acceptance Testing

From a user acceptance perspective, the main shopping journey is understandable and testable: a user can browse products, view details, add products to cart, proceed to checkout and review account/order information. The AI Cooking Assistant adds a useful food-commerce scenario by connecting ingredients at home with a recommended dish and missing products in the shop.

The current prototype is appropriate for demonstrating the final product concept in a course report. However, several improvements are recommended before production deployment. First, a real backend and database should replace local JSON and localStorage for authentication, orders and admin management. Second, admin authentication and role-based access control should be added. Third, performance testing with Lighthouse should be completed and recorded. Finally, modules such as banner management and support tickets should be expanded from prototype tables into full CRUD workflows.
