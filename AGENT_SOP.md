# Standard Operating Procedure (SOP): Custom Headless Shopify Jewelry Store

## 1. Project Overview & Goal
Build a high-end, responsive, visually captivating Headless E-Commerce storefront for **Ziora** (Artificial Luxury & Fashion Jewelry). 

- **Backend**: Shopify Headless (Storefront API GraphQL) for catalog, variants, cart, and native checkout.
- **Frontend**: Next.js / React, Tailwind CSS & Custom CSS, GSAP / Framer Motion for scroll-triggered luxury micro-interactions.
- **Design Aesthetic**: Premium luxury dark & champagne gold theme (`#0B0B0E`, `#D4AF37`, `#F3E5AB`), smooth glassmorphism, typography, and rich visual assets.

---

## 2. Environment & API Credentials Setup
Store environment variables securely in `.env.local`:

```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store-name.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token
NEXT_PUBLIC_SHOPIFY_API_VERSION=2024-01
```

---

## 3. Directory Structure Standards
```
g:/ziora/
├── app/
│   ├── layout.js          # Root layout with fonts, metadata & Cart Provider
│   ├── page.js            # Home Landing Page (Hero, Bestsellers, Craftsmanship, Reviews)
│   ├── products/
│   │   └── [handle]/
│   │       └── page.js    # Single Product Details Page
│   └── globals.css        # Core luxury design system tokens & animations
├── components/
│   ├── Navbar.jsx         # Floating glassmorphism navigation
│   ├── HeroSection.jsx    # Cinematic hero section with interactive CTA
│   ├── ProductCatalog.jsx # Dynamic product grid with filters (Necklaces, Earrings, Rings)
│   ├── ProductCard.jsx    # Hover animations, quick add, price & tag badges
│   ├── Craftsmanship.jsx # Feature highlights (18K Gold Plated, Hypoallergenic, Water-Resistant)
│   ├── CartDrawer.jsx     # Slide-out Shopify Cart drawer with checkout redirect button
│   └── Footer.jsx         # Luxury footer with newsletter & brand trust badges
├── lib/
│   └── shopify.js         # Storefront API client & GraphQL queries/mutations
└── public/
    └── assets/            # High-resolution jewelry lifestyle visuals
```

---

## 4. Step-by-Step Execution Plan

### Step A: API Connection (`lib/shopify.js`)
- Implement a lightweight fetch wrapper for Shopify Storefront API GraphQL requests.
- Implement error handling for invalid tokens or network timeouts.

### Step B: Design System & Styling
- Define luxury colors, glowing borders, custom scrollbars, and glass backdrop filters in `globals.css`.
- Ensure mobile-first responsiveness (320px to 4K screens).

### Step C: Core Components & Layout
- Build floating Navbar with cart counter badge.
- Build Hero Section with smooth GSAP / Framer motion text reveal.
- Build Product Cards with 18K Gold tag, price formatting, and quick "Add to Cart".

### Step D: Shopify Cart & Checkout Workflow
- Maintain cart state locally (or via React Context / LocalStorage).
- On "Add to Cart", issue `cartCreate` or `cartLinesAdd` Storefront API mutation.
- Provide a direct link to `cart.checkoutUrl` for smooth, secure Shopify checkout processing.

---

## 5. Quality Assurance Checklist
- [ ] Responsive design verified on mobile, tablet, and desktop screens.
- [ ] No layout shifts (CLS) on image loading.
- [ ] Shopify Storefront API calls fail gracefully with mock data fallback if API keys are not yet provided.
- [ ] Smooth 60fps animations without jitter or lag.
