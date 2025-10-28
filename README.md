---
title: "Abraham of London — Orchestra Grand Master (Apex Edition)"
---

Abraham of London

The official website of Abraham of London €" built with Next.js, TypeScript, and Tailwind CSS, designed to balance speed, scalability, and silent premium signals.

This repository powers a personal brand ecosystem of books, blogs, events, and ventures.

ðŸš€ Project Status

Current State: Locally stable, type-safe, and production-ready.

Focus: Final polish of assets (images, banners, CTAs) and validation of forms and environment variables before public release.

Last Updated: August 28, 2025

œ¨ Features

Static Site Generation (SSG): Next.js getStaticProps + MDX for SEO-optimized, fast pages.

Incremental Static Regeneration (ISR): Pages like /blog and /books auto-update without full redeploys.

Content via Markdown/MDX: Simple file-based workflow for writing and publishing.

Responsive, Tailwind-driven UI: Mobile-first and consistent design system.

Optimized Images: Next.js <Image /> for lazy loading and no layout shift.

Event & Book Architecture: Structured MDX for books and events, extendable for ventures.

Forms & Newsletter: Netlify Forms + API routes for Buttondown/Mailchimp newsletter handling.

Redirect Management: Canonical domain handling (https://www.abrahamoflondon.org).

Analytics: Google Analytics 4 (GA4) integrated via env variable NEXT_PUBLIC_GA_MEASUREMENT_ID.

ðŸ› Local Development

Clone, install, and run:

# Abraham of London — Orchestra Grand Master (Apex Edition)

**One button. Whole pipeline.**
Fix mojibake & front-matter, restore critical files, audit dependencies, build Next.js, run Playwright smoke tests, generate PDFs from MDX, export static, and deploy to Netlify — safely and atomically with restorable backups.

---

## Quickstart

```bash
npm install
npm run grand-master
Artifacts:

JSON report → scripts/_reports/grand-master-report.json

HTML report → scripts/_reports/grand-master-report.html

Logs → scripts/_logs/grand-master.log

Backups (mirrors repo paths) → scripts/_backups/<ISO-timestamp>/...

If anything trips, the report/logs still write so you can diagnose.
```
