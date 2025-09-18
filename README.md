---

````md
# Abraham of London

[![CI](https://github.com/AbrahamofLondon/Abraham-of-london/actions/workflows/ci.yml/badge.svg)](https://github.com/AbrahamofLondon/Abraham-of-london/actions/workflows/ci.yml)
[![Lighthouse CI](https://github.com/AbrahamofLondon/Abraham-of-london/actions/workflows/lhci.yml/badge.svg)](https://github.com/AbrahamofLondon/Abraham-of-london/actions/workflows/lhci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-NETLIFY-ID/deploy-status)](https://app.netlify.com/sites/abraham-of-london/deploys)

The official website of **Abraham of London** — built with **Next.js, TypeScript, and Tailwind CSS**, designed to balance speed, scalability, and *silent premium signals*.  

This repository powers a **personal brand ecosystem** of books, blogs, events, and ventures — all unified under a high-culture, legacy-first digital identity.  

---

## 🚀 Project Status

- **Current State**:  
  Locally stable, type-safe, and production-ready.  

- **Focus**:  
  Final polish of assets (images, banners, CTAs) and validation of forms + environment variables before public release.  

- **Last Updated**:  
  **September 2025**  

---

## ✨ Features

- **Static Site Generation (SSG)** — SEO-optimized, ultra-fast pages via Next.js `getStaticProps` + MDX.  
- **Incremental Static Regeneration (ISR)** — `/blog`, `/books`, `/events` auto-update without full redeploys.  
- **Content via Markdown/MDX** — simple file-based publishing workflow.  
- **Responsive, Tailwind-driven UI** — mobile-first, grid-based design system.  
- **Optimized Images** — lazy loading + blur-up placeholders with Next.js `<Image />`.  
- **Books & Events Architecture** — structured MDX, scalable to Ventures (Alomarada, EndureLuxe, InfraNova Africa).  
- **Forms & Newsletter** — Netlify Forms + API routes (Formspree, Buttondown, Mailchimp).  
- **Redirect Management** — canonical enforcement: [https://www.abrahamoflondon.org](https://www.abrahamoflondon.org).  
- **Analytics** — Google Analytics 4 (GA4) via `NEXT_PUBLIC_GA_MEASUREMENT_ID`.  
- **CI/CD Guardrails** — GitHub Actions for lint/build + Lighthouse CI budgets.  
- **Edge Security & Caching** — Netlify edge functions + strict headers (HSTS, Permissions-Policy).  

---

## 🛠 Local Development

```bash
# 1. Clone repo
git clone https://github.com/AbrahamofLondon/Abraham-of-london.git
cd Abraham-of-london

# 2. Install dependencies
npm install

# 3. Run dev server
npm run dev

# Visit http://localhost:3000
````

---

## 📦 Scripts

```bash
npm run dev       # Start local dev server
npm run build     # Build for production
npm run start     # Serve production build
npm run lint      # Run ESLint
npm run analyze   # Analyze bundle size
```

---

## 🔐 Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SITE_URL=https://www.abrahamoflondon.org
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-R2Y3YMY8F8
RESEND_API_KEY=xxxxxx
MAIL_FROM=info@abrahamoflondon.org
MAIL_TO=xxxxxx
```

*(See `.env.example` for placeholders)*

---

## 🌍 Deployment

* **Host**: Netlify (Next.js plugin)
* **CI/CD**: GitHub → Netlify deploys on push to `main`
* **Edge Functions**: security headers + caching
* **Redirects**: brand domains → `/ventures` deep links

---

## 📊 CI Workflows

* **Core CI** (`.github/workflows/ci.yml`)

  * Lint + Build on every push/PR

* **Lighthouse CI** (`.github/workflows/lhci.yml`)

  * Automated performance & accessibility scoring
  * **Budgets enforced**:

    * Performance ≥ 90 (error)
    * Accessibility ≥ 95 (error)
    * Best Practices ≥ 90 (warn)
    * SEO ≥ 90 (warn)

---

## 📚 Roadmap

* [x] Core site engine (Next.js, Tailwind, MDX)
* [x] Theme pipeline hardened (hydration-safe, no flicker)
* [x] GitHub Actions (lint/build + Lighthouse CI)
* [ ] Design System upgrade (locked palette + typography scale)
* [ ] Books & Events showcase launch
* [ ] Newsletter integration (Formspree → ConvertKit/Mailchimp)
* [ ] Members-only/private area (events + premium content)
* [ ] E-commerce hooks (EndureLuxe, book pre-orders)

---

## 🖋 License

© 2025 Abraham of London.
All rights reserved.

```

---

👉 Replace `YOUR-NETLIFY-ID` in the Netlify badge with your site UUID from **Netlify → Site settings → General → Site details**.  
