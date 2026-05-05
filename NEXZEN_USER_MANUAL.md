# Nexzen User Manual

This manual explains how to use the Nexzen website from both the customer side and the admin side.

It is written for day-to-day operation of the live site, with special focus on:

- customer-facing features
- hidden admin paths
- admin panel tools
- content editing flows
- coupon and inventory management
- search and compare features
- detailed notes for the Active Orders Pipeline

---

## 1. Website Overview

Nexzen is an electronics ecommerce website built for development boards, embedded hardware, sensors, maker kits, wireless/IoT modules, and related accessories.

The platform includes:

- homepage hero banners
- category architecture cards
- product catalog and clean search flow
- recent search suggestions
- compare products
- cart and checkout
- coupon support
- COD and Razorpay payment support
- order tracking and invoice download
- wishlist, reviews, and support flows
- back-in-stock alerts
- admin dashboard for store operations

---

## 2. Main Public Website Paths

These are the important customer-facing URLs.

### Core pages

- `/`  
  Homepage

- `/p`  
  Main product catalog

- `/search`  
  Search results page

- `/compare`  
  Product compare page

- `/cart`  
  Shopping cart and checkout flow

- `/active-orders`  
  Customer active orders page

- `/ordered-items`  
  Delivered/completed order history page

- `/profile`  
  Customer profile and account information

### Product pages

Depending on the navigation source, products may open under:

- `/products/[slug-or-id]`
- `/p/[slug-or-id]`

Both are used by the storefront.

---

## 3. Search Experience

The website includes a cleaner search flow than traditional query-heavy URLs.

### What users can do

- type in the navbar search
- see matching product suggestions while typing
- click a suggestion to open a product
- go to `/search` without exposing the raw query in the visible URL
- use compact filters without another duplicate search bar

### Search features currently available

- live product-name suggestions
- recent searches per signed-in user
- search history stored against the user record
- search pagination
- mobile-optimized search layout

### Search history behavior

If the user is signed in:

- search terms are stored in the database
- search history is mapped to the authenticated user
- clicking the search bar can show recent searches for that user

---

## 4. Catalog and Product Features

The storefront supports more than basic listing and detail pages.

### Catalog features

- product grid
- search
- compact filters
- availability filter
- price filter
- pagination
- compare actions
- recently viewed products

### Product detail features

- product image/gallery support
- stock display
- technical and descriptive sections
- review section
- frequently paired or related hardware logic
- pincode-based delivery estimate
- back-in-stock alert button for unavailable items

### Compare page

Path:

- `/compare`

Capabilities:

- compare multiple products side by side
- remove one compared item
- remove all compared items at once

---

## 5. Account, Cart, and Checkout Features

### Account features

- sign in / sign up
- saved profile details
- saved addresses
- recent search history
- active orders
- delivered items

### Cart and checkout features

- add to cart
- quantity handling
- checkout with shipping address
- coupon application
- COD orders
- Razorpay online payment orders

### Payment logic

For COD:

- order is created immediately
- payment status starts as `PENDING`

For Razorpay/online payment:

- order is created first
- payment status starts as `AWAITING_PAYMENT`
- Razorpay order is created
- successful verification or webhook capture marks payment as `PAID`

### Invoice support

Each order supports invoice download as PDF from the customer order views.

---

## 6. Orders, Tracking, and Customer Order Views

### Active orders page

Path:

- `/active-orders`

This page is for orders that are still in progress.

Users can see:

- order ID
- order date
- total amount
- tracking number
- courier name
- latest status update
- order timeline
- ordered items
- support ticket ID
- invoice download

Users can also:

- cancel eligible orders

### Delivered items page

Path:

- `/ordered-items`

This page shows delivered/completed orders.

Users can:

- review delivered items
- download invoice PDF
- request return for eligible delivered orders

### Timeline stages shown to customers

The order timeline is presented as:

1. `pending`
2. `processing`
3. `shipped`
4. `delivered`

---

## 7. Wishlist, Reviews, and Support

### Wishlist

Users can save products to wishlist while signed in.

### Reviews

Users can leave product reviews and ratings.

### Support

Orders generate support references, and support ticket handling is built into the order experience.

---

## 8. Back-In-Stock Alerts

When a product is out of stock, signed-in users can subscribe for stock alerts.

### How it works

- user clicks the stock alert button on an out-of-stock product
- alert is stored per user and per product
- when stock is restored, notification emails can be sent
- admin dashboard also shows stock-alert analytics

---

## 9. Hidden Admin Access Paths

The admin area does **not** use the public `/admin` path directly.

### Actual login path

- `/nexzen-control-room/login`

### Actual admin dashboard path

- `/nexzen-control-room`

### Important security behavior

- direct `/admin` access is intentionally blocked
- the hidden path rewrites internally to the admin app
- admin requests can be restricted by allowed IP configuration
- admin routes are protected by session and CSRF checks

### Internal rewrite behavior

Public admin path:

- `/nexzen-control-room`

Internally rewritten to:

- `/admin`

This means staff should always use the hidden path, not `/admin`.

---

## 10. Admin Login and Recovery

### Admin login page

Path:

- `/nexzen-control-room/login`

### Standard login

Admin signs in with:

- username
- password

### Recovery options

If repeated password failures happen, recovery options become available:

- login with OTP
- reset password

### Current login-throttling behavior

- password attempts are rate-limited
- step-up recovery unlocks after repeated failed attempts
- OTP is email-based
- reset links are token-based and one-time-use

---

## 11. Admin Dashboard

### Dashboard path

- `/nexzen-control-room`

### What the dashboard shows

- quick action buttons
- total products
- total categories
- low stock count
- revenue summary
- orders today
- pending orders
- stock alert counts
- top searches
- back-in-stock watchlist
- recent products
- low stock priority list

### Main dashboard action buttons

The current admin dashboard includes:

1. `Upload New Product`
2. `Manage Catalog`
3. `Manage Active Orders`
4. `Launch CRM Engine`
5. `Edit Category Architecture`
6. `Manage Brands`
7. `Manage Coupons & Discounts`
8. `Manage Hero Banners`
9. `Manage Highlights`
10. `Manage Collections`

### Admin route map

- `/nexzen-control-room`
  Dashboard

- `/nexzen-control-room/products/upload`
  Upload new product

- `/nexzen-control-room/products`
  Catalog manager

- `/nexzen-control-room/orders`
  Active orders pipeline

- `/nexzen-control-room/crm`
  CRM engine

- `/nexzen-control-room/categories`
  Edit Category Architecture

- `/nexzen-control-room/brands`
  Manage brands

- `/nexzen-control-room/coupons`
  Manage coupons and discounts

- `/nexzen-control-room/banners`
  Manage hero banners

- `/nexzen-control-room/highlights`
  Manage homepage highlights

- `/nexzen-control-room/collections`
  Manage collections

---

## 12. Upload New Product

### Path

- `/nexzen-control-room/products/upload`

### Purpose

Used to create a new product with pricing, branding, media, and inventory details.

### Fields and capabilities

- product name
- SKU
- category
- brand
- barcode
- status: active / draft / archived
- price
- compare-at price
- cost price
- stock quantity
- low stock threshold
- weight in grams
- badge and badge tone
- requires shipping
- track inventory
- short spec
- dependency products
- short description
- full description
- variants
- configurations
- gallery image URLs
- technical highlights
- usage/setup guide
- primary product image upload
- multiple gallery image uploads

### AI-assisted product creation

The product upload form also supports AI-assisted field generation.

Behavior:

- entering a product name and using the AI trigger can fill major fields
- the AI can help with:
  - descriptions
  - branding guess
  - badge/tone
  - technical highlights
  - guide content
  - some pricing/metadata suggestions

This is a productivity tool, not a substitute for final admin review.

---

## 13. Manage Catalog

### Path

- `/nexzen-control-room/products`

### Purpose

Used to search, filter, edit, export, and delete products already stored in the catalog.

### Features

- search products
- filter by price
- filter by brand
- IoT filter
- low stock filter
- edit a product inline through the product form
- delete product
- paginate through the catalog
- export current product data to Excel

### Best use

Use this page for maintenance after products already exist.

---

## 14. Edit Category Architecture

### Path

- `/nexzen-control-room/categories`

### Purpose

Controls the homepage category-card section labeled Category Architecture.

### What can be edited

- category name
- slug
- description
- icon identifier
- image URL
- uploaded category image

### Image handling

Category images can be:

- pasted via URL
- uploaded from the admin page

Uploaded category images are stored using the category identifier logic and connected back to the category record.

### Storefront effect

These category entries directly affect the cards visible on the homepage category section.

---

## 15. Manage Brands

### Path

- `/nexzen-control-room/brands`

### Purpose

Manage product manufacturers and brand metadata.

### Features

- add brand
- edit brand
- search brands
- delete brand
- add logo URL
- store optional description

Brands can then be attached to products in the upload/edit product flow.

---

## 16. Manage Hero Banners

### Path

- `/nexzen-control-room/banners`

### Purpose

Controls the homepage hero banner slider.

### Editable fields

- slide title
- subtitle
- eyebrow text
- primary link
- primary CTA text
- secondary link
- secondary CTA text
- side metric text
- display order
- accent gradient classes
- banner image upload

### Storefront result

These entries control the main hero section of the homepage.

---

## 17. Manage Highlights

### Path

- `/nexzen-control-room/highlights`

### Purpose

Controls the homepage trust/value highlight section.

### Fields

- label
- value
- detail
- display order

### Example use cases

- fast dispatch
- secure payment
- support response time
- warranty

---

## 18. Manage Collections

### Path

- `/nexzen-control-room/collections`

### Purpose

Manages featured merchandising collections used by the storefront.

### Fields

- collection name
- slug
- description
- image URL
- display order

### Typical examples

- Creator Boards
- IoT Starters
- Sensor Bundles

---

## 19. Manage Coupons and Discounts

### Path

- `/nexzen-control-room/coupons`

### Purpose

Create and control coupon-based promotions.

### Coupon features

- create coupon code
- set discount percentage
- set minimum order value
- set maximum uses
- set expiry datetime
- restrict coupon to a category slug
- enable/disable coupon
- adjust discount percentage inline

### Important business rules

The website validates:

- coupon exists and is active
- coupon is not expired
- coupon has not reached max usage
- order meets minimum order value
- category restriction matches eligible products
- customer does not reuse the same coupon if already used before

---

## 20. CRM Engine

### Path

- `/nexzen-control-room/crm`

### Purpose

Provides a searchable customer directory for operations and support use.

### Searchable fields

- customer name
- email
- phone
- internal user ID
- ordered product names
- ordered product IDs
- order IDs
- cart product names
- cart product IDs

### What admins can see

- customer identity block
- order count
- active cart item count
- recent order traces
- cart retention snapshot

This helps operations staff quickly understand both purchase history and current cart intent.

---

## 21. Admin Analytics and Audit Trail

### Dashboard analytics

The admin dashboard includes:

- paid revenue total
- paid order count
- today order count
- pending order count
- stock-alert totals
- top searched terms
- most-watched out-of-stock products
- low stock products

### Audit trail

Recent admin actions are recorded and displayed in the admin area.

Examples include:

- order item status changes
- bulk order acceptance
- order status changes
- user-level bulk acceptance

This helps with accountability and traceability.

---

## 22. Detailed Note: Active Orders Pipeline

This is the most important operational flow in the admin panel.

### Main path

- `/nexzen-control-room/orders`

### Purpose

This page is the operational queue for incoming and unresolved orders.

It is designed to help admins:

- review recent orders
- see payment context
- inspect order items
- accept or reject item-level requests
- perform bulk acceptance actions
- work user-by-user instead of only order-by-order

---

### 22.1 What counts as an active order

On the admin dashboard, active/pending operational work is counted from orders whose status is in:

- `pending`
- `accepted`
- `processing`

These orders contribute to the dashboard pending-order badge.

---

### 22.2 How orders enter the pipeline

#### COD order flow

When a customer places a COD order:

- order is created immediately
- `order.status` starts as `pending`
- `paymentStatus` starts as `PENDING`
- tracking number is generated
- support ticket ID is generated
- estimated delivery is generated
- order email can be sent

#### Online payment order flow

When a customer places an online order:

- order is created first
- `order.status` starts as `pending`
- `paymentStatus` starts as `AWAITING_PAYMENT`
- a Razorpay order is created
- internal `razorpayOrderId` is stored on the order

After payment success:

- signature verification or webhook confirmation runs
- `paymentStatus` becomes `PAID`
- order is finalized
- if status was not already advanced, order becomes `accepted`
- payment ID is stored
- customer/admin notification emails can be sent

So, online orders usually enter the active pipeline after successful payment verification.

---

### 22.3 How the admin orders page is organized

The admin orders page does not simply dump raw orders in a flat list.

It groups orders by user/email so staff can resolve workload from a customer-centric view.

For each grouped customer block, admins can see:

- customer name
- email
- action-item count
- all of that customer’s fetched orders

The groups are sorted by highest pending work first.

This makes the page useful for daily triage.

---

### 22.4 Search behavior in the orders pipeline

The orders admin search supports locating orders by:

- tracking number
- phone number
- user email
- user name
- user phone

Only the newest set of orders is fetched for performance, so it behaves like a focused operations board rather than a full historical warehouse.

---

### 22.5 What an admin sees per order

Inside each expanded user block, each order row shows:

- short order ID
- created date
- shipping location snippet
- payment status
- payment method
- Razorpay payment ID if available
- item list
- item-level approval controls
- total revenue
- discount amount if applied
- current order status

---

### 22.6 Item-level status logic

Each order item can be set to:

- `pending`
- `accepted`
- `rejected`

This is important because item-level resolution can differ from full-order resolution.

For example:

- one item may be accepted
- another may be rejected
- the parent order then becomes partially resolved

---

### 22.7 Parent order status logic

When item statuses change, the system recalculates the parent order status.

Rules currently used:

- if all items are `accepted`, order becomes `accepted`
- if all items are `rejected`, order becomes `rejected`
- if there is a mix of resolved states, order becomes `partially_resolved`
- otherwise it can remain in its prior working state

The admin can also explicitly set order status through the order update route using values such as:

- `pending`
- `processing`
- `accepted`
- `waiting`
- `rejected`

---

### 22.8 Bulk actions

There are three major admin bulk-resolution behaviors.

#### A. Quick Accept for a single order

From a single order row:

- all order items are accepted
- parent order becomes `accepted`

#### B. Accept All Products for one user

From the user group header:

- all pending items for that customer email are accepted
- matching orders in working states are updated to `accepted`

#### C. Item-level accept/reject

The admin can resolve one item at a time for more precise control.

This is useful when:

- one SKU is available and another is not
- one item is valid and another requires hold/review

---

### 22.9 Payment context inside the pipeline

The order dashboard also tells the operations team whether an order is:

- COD / cash flow
- online flow
- awaiting payment
- paid

This matters because fulfillment behavior can depend on payment confirmation.

In general:

- COD orders may remain operationally pending until accepted/processed
- Razorpay orders should be treated as financially confirmed after successful verification marks them `PAID`

---

### 22.10 Recommended operational meaning of statuses

These are the practical meanings admins should use.

#### `pending`

- new order
- not yet accepted into fulfillment
- needs review

#### `accepted`

- approved for handling
- valid inventory/business approval
- can proceed to packing/dispatch logic

#### `processing`

- actively being prepared or packed
- fulfillment is underway

#### `waiting`

- on hold
- waiting for stock, confirmation, or special review

#### `partially_resolved`

- some items accepted, some rejected
- admin should review final customer communication if needed

#### `rejected`

- order or all items rejected

#### `shipped`

- moving with courier

#### `delivered`

- delivered to customer

#### `cancelled`

- cancelled by customer or operations process

#### `return_requested`

- customer requested return after delivery

---

### 22.11 Customer-side relationship to the pipeline

The admin pipeline is not isolated. It affects what the customer sees.

Customers later see:

- timeline progress
- latest tracking update
- active-order visibility
- delivered-order visibility
- cancel eligibility
- return eligibility

Important customer actions tied to status:

- customers can cancel when order is in `pending`, `processing`, or `accepted`
- customers can request return when order is `delivered` or `completed`

---

### 22.12 Emails and audit logging

The active orders flow is connected to system communication and audit history.

Examples:

- payment success can trigger customer/admin emails
- accepted transitions can trigger order-confirmation style email behavior
- admin item changes are logged
- bulk accept actions are logged
- order status updates are logged

This creates a stronger operational record.

---

### 22.13 Practical daily workflow for admins

Recommended team workflow:

1. Open `/nexzen-control-room`
2. Check the `Manage Active Orders` badge count
3. Open `/nexzen-control-room/orders`
4. Search for a customer if required, otherwise review highest pending groups first
5. Inspect payment status before fulfillment decisions
6. Accept or reject item-level requests
7. Use Quick Accept only when the full order is clearly valid
8. Use customer-level Accept All only when all pending items across their open orders are approved
9. Move accepted orders forward to `processing`
10. Keep tracking and customer updates aligned with actual fulfillment progress

---

## 23. Search, Compare, and Analytics Features Added

Some of the strongest newer features added to the platform are:

- clean search route
- live search suggestions
- user-specific recent search history
- compare page with remove-one and remove-all
- compact filters
- saved addresses
- coupon rules engine
- invoice PDF download
- back-in-stock alerts
- admin analytics
- admin audit trail
- Razorpay payment verification and webhook support
- category-image editing from admin

---

## 24. Recommended Admin Best Practices

- always access admin through `/nexzen-control-room`
- never share the hidden path publicly
- verify banner, category, and collection content before saving
- review AI-generated product text before publishing
- use consistent SKU and barcode formats
- use low-stock filters daily
- review top searches and watchlist products weekly
- keep coupon expiry and usage caps realistic
- rely on audit log when investigating unexpected changes

---

## 25. Quick Reference

### Customer quick links

- Home: `/`
- Catalog: `/p`
- Search: `/search`
- Compare: `/compare`
- Cart: `/cart`
- Active Orders: `/active-orders`
- Delivered Orders: `/ordered-items`
- Profile: `/profile`

### Admin quick links

- Admin Login: `/nexzen-control-room/login`
- Dashboard: `/nexzen-control-room`
- Upload Product: `/nexzen-control-room/products/upload`
- Manage Catalog: `/nexzen-control-room/products`
- Active Orders: `/nexzen-control-room/orders`
- CRM: `/nexzen-control-room/crm`
- Categories: `/nexzen-control-room/categories`
- Brands: `/nexzen-control-room/brands`
- Coupons: `/nexzen-control-room/coupons`
- Hero Banners: `/nexzen-control-room/banners`
- Highlights: `/nexzen-control-room/highlights`
- Collections: `/nexzen-control-room/collections`

---

## 26. Final Note

This manual reflects the current Nexzen implementation in the project codebase, including hidden admin routing, current storefront features, and the admin order-operations model.

If the team adds new routes, new order statuses, or more fulfillment controls later, this manual should be updated together with the product.
