# Nexzen — Modern Electronics Storefront

Nexzen is a fully-featured, production-ready e-commerce platform built for maker kits, development boards, sensors, and rapid prototyping gear.

### Built with Next.js 16 + Tailwind CSS

---

## 🚀 Current Features

| Feature Stack | Technologies |
|---|---|
| **Frontend architecture** | Next.js (App Router), React 19, Tailwind CSS v4 |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Authentication** | Supabase Auth (Email OTP, Custom SMTP, Google, GitHub, Meta, LinkedIn OIDC) |
| **Global State** | React Context (AuthContext & CartContext) |
| **Responsive Design** | Custom UI verified flawless on Mobile and Desktop viewports |
| **Deployment** | Hosted on Vercel (`nexzenindia.com`) |

---

## 📁 Project Structure

```text
nexzen/
├── app/
│   ├── auth/callback/  ← OAuth PKCE & Implicit hash handler
│   ├── api/            ← Backend route handlers (sync, db, orders)
│   ├── products/       ← Full catalog browsing & filtering
│   ├── cart/           ← Shopping cart UI
│   ├── login/          ← Auth gateway
│   ├── profile/        ← Secure user dashboard
│   ├── layout.js       ← Site-wide Navbar + Footer Wrapper
│   └── page.js         ← Hero & Landing Page
├── components/
│   ├── storefront/     ← Top-level UI (Navbar, Hero, Grid, Footers)
│   ├── auth/           ← Authentication forms and social logins
│   └── profile/        ← Dashboard shells & components
├── lib/
│   └── auth/           ← Supabase SSR and browser clients
├── prisma/
│   └── schema.prisma   ← PostgreSQL DB architecture
└── providers/
    ├── AuthProvider.js ← Global user and session sync
    └── CartProvider.js ← Cart session memory
```

---

## 🛠️ Environment Configuration (.env)

To run this application locally, you must provide your own `.env` values connecting to your Supabase and Email accounts:

```ini
# Postgres Database (Supabase pooler)
DATABASE_URL="postgresql://..."

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_BRAND_LOGO_URL="..."

# Custom SMTP (For Auth OTPs and Welcome emails)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_SECURE="true"
SMTP_FROM="Nexzen <noreply@nexzenindia.com>"
```

---

## 💻 Setup Instructions (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Database Client
Ensure your `.env` contains the `DATABASE_URL`, then run:
```bash
npx prisma generate
## (Optional) to push migrations: npx prisma db push
```

### 3. Run the Development Server
```bash
npm run dev
```

Open `http://localhost:3000` to preview the storefront.

---

## 🌐 Production Deployment

The project is configured for one-click deployment on **Vercel**. When deploying to Vercel:
1. Ensure all environment variables listed above are safely added in the Vercel Dashboard under the **Settings > Environment Variables**.
2. Vercel automatically runs the `npm run build` command, which is aliased to `prisma generate && next build` to safely inject DB types.
3. OAuth providers in Supabase must have the `https://<vercel-preview-url>.vercel.app/auth/callback` added to their Redirect URL Allowlist.