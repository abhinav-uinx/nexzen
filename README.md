# Nexzen

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20Website-0f172a?style=for-the-badge)](https://nexzen-ashy.vercel.app/)

Nexzen is a production-focused electronics storefront for maker kits, development boards, sensors, components, and rapid prototyping gear. The app combines a customer storefront, authenticated user account flows, order management, payment checkout, and an admin console for catalog and operations work.

## Tech Stack

| Area | Technology |
| --- | --- |
| App framework | Next.js 16.2, React 19, App Router |
| Styling | Tailwind CSS 4, CSS modules |
| Database | PostgreSQL |
| ORM | Prisma 7, generated client in `lib/database/generated/client` |
| Auth | Supabase, custom user/admin session helpers |
| Payments | Razorpay |
| Email | Nodemailer SMTP |
| AI tooling | Google Gemini for admin product generation |
| Deployment | Vercel-ready build scripts |

## Features

- Storefront landing page with hero banners, categories, collections, discounted products, trust signals, and responsive navigation.
- Product catalog with filters, search suggestions, product detail pages, comparison, recently viewed items, reviews, stock alerts, wishlist, and cart flows.
- Checkout APIs for order creation, Razorpay payment creation, verification, and webhook handling.
- User account area for profile details, saved addresses, active orders, ordered items, invoices, search history, and security settings.
- Admin dashboard for products, brands, categories, collections, banners, highlights, coupons, orders, CRM, audit logs, and AI-assisted product copy.
- Support tickets, coupons, inventory fields, product dependencies, review records, stock alerts, and admin audit models in the Prisma schema.

## Project Structure

```text
nexzen/
|-- app/
|   |-- api/                 Route handlers for auth, catalog, cart, checkout, orders, admin, profile, support, and search
|   |-- admin/               Admin dashboard pages
|   |-- auth/callback/       Supabase OAuth callback handling
|   |-- cart/                Customer cart page
|   |-- checkout/pay/[id]/   Payment page
|   |-- products/            Product listing and product detail routes
|   |-- profile/             User profile and order views
|   |-- search/              Search results routes
|   |-- u/                   Compact user account routes
|   |-- layout.js            Root layout
|   `-- page.js              Storefront home page
|-- components/
|   |-- admin/               Admin dashboard components
|   |-- auth/                Login and auth UI
|   |-- profile/             Account and order panels
|   |-- storefront/          Catalog, cart, product, search, and storefront UI
|   `-- ui/                  Shared loading UI
|-- context/                 React context helpers
|-- data/                    Local data fixtures or supporting data
|-- lib/
|   |-- admin/               Admin auth, config, analytics, recovery, security, and audit helpers
|   |-- ai/                  Gemini integration
|   |-- auth/                Supabase and custom user auth helpers
|   |-- catalog/             Product/catalog query helpers
|   |-- commerce/            Checkout, orders, payments, invoices, and stock alerts
|   |-- database/            Prisma client output and database helpers
|   |-- mail/                SMTP mailer
|   |-- profile/             Address and profile persistence helpers
|   |-- search/              Search history helpers
|   `-- security/            Request, upload, and validation utilities
|-- prisma/
|   |-- schema.prisma        PostgreSQL schema
|   `-- seed.cjs             Seed script
|-- providers/               Auth, cart, and admin insight providers
|-- public/                  Static assets
|-- scripts/                 Project scripts
|-- next.config.ts
|-- proxy.js
`-- package.json
```

## Prerequisites

- Node.js compatible with Next.js 16 and React 19.
- npm.
- PostgreSQL database, typically Supabase Postgres.
- Supabase project for browser auth keys.
- SMTP account for transactional email.
- Razorpay account for payment processing.

## Environment Variables

Create a local `.env` file with values for the services you use. Do not commit real secrets.

```ini
# Database
DATABASE_URL="postgresql://..."

# Public site and Supabase client config
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="..."

# User/admin auth secrets
USER_AUTH_SECRET="..."
ADMIN_AUTH_SECRET="..."
ADMIN_BASE_PATH="/admin"
ADMIN_USERNAME="..."
ADMIN_EMAIL="..."
ADMIN_PASSWORD="..."
ADMIN_ALLOWED_IPS=""
ALLOWED_ORIGINS="http://localhost:3000"

# SMTP email
SMTP_HOST="smtp.example.com"
SMTP_PORT="465"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_SECURE="true"
SMTP_FROM="Nexzen <noreply@example.com>"

# Payments
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."

# AI product generation
GOOGLE_GENERATIVE_AI_API_KEY="..."
```

## Local Development

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Apply the schema to your development database when needed:

```bash
npx prisma db push
```

Seed the database when you want sample/admin data:

```bash
npm run seed
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js with webpack and source maps disabled. |
| `npm run build` | Generate Prisma client, then build the Next.js app. |
| `npm run start` | Start the production build. |
| `npm run lint` | Run ESLint. |
| `npm run seed` | Run `prisma/seed.cjs`. |

## Database

The Prisma schema lives at `prisma/schema.prisma`. The generated client is configured to output to `lib/database/generated/client`, so code should import through the existing local database helpers instead of assuming Prisma's default client location.

Common data areas include catalog entities, brands, collections, banners, coupons, users, user identities and sessions, carts, wishlists, stock alerts, orders, order items, reviews, support tickets, admin sessions, password reset tokens, OTP challenges, and audit logs.

## Deployment

This project is set up for Vercel-style deployment. Add the same environment variables in the Vercel dashboard before building. The build command already runs `prisma generate` before `next build`.

For Supabase OAuth providers, add the deployed callback URL to the Supabase redirect allowlist:

```text
https://<your-domain>/auth/callback
https://<vercel-preview-url>.vercel.app/auth/callback
```

## Contributor Notes

This project uses Next.js 16 with breaking changes from older Next.js conventions. Before changing framework APIs, routing behavior, config, or server/client boundaries, read the relevant guide in `node_modules/next/dist/docs/` and follow deprecation notices.

The worktree may include local changes. Check `git status` before broad edits and keep changes scoped to the task at hand.
