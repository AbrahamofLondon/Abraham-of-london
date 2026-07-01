# Contributing to Abraham of London
> "Standards are the architecture of excellence."

This document defines the protocols for extending the Abraham of London platform. Every contribution must align with our commitment to **principled analysis**, **institutional integrity**, and **strategic outcomes**.

---

## 1. The Development Philosophy

All contributors must adhere to the pillars of our engineering culture:
1. **The Five-Cut Loop (precedes everything):** Before deciding *how* to do work well, decide *whether it should exist*. Question the requirement, then try to delete it, and only then simplify, accelerate, and automate — **in that order**. The most common mistake of smart engineers is to optimise a thing that should not exist. See [`docs/five-cut-loop-charter.md`](docs/five-cut-loop-charter.md). This is enforced in the PR template.
2. **Outcome Focus:** Every PR must solve a specific business or strategic constraint. No "speculative" features.
3. **Institutional Aesthetic:** We maintain a minimalist, high-gravity interface. Respect the `#050609` (Deep Black) and `#D4AF37` (Institutional Gold) design system.
4. **Data Integrity:** All database interactions must be type-safe via Prisma. Direct SQL is strictly prohibited unless approved for low-level performance tuning.

---

## 2. Technical Standards

### A. TypeScript & Logic
- **Strict Typing:** No `any` types. All domain entities must be modeled as formal TypeScript interfaces.
- **Fail-Open Resilience:** Critical intake and security paths must have a local file-system fallback (JSON logging) in case of database latency or failure.
- **Functional Purity:** Keep business logic (Scoring, Evaluation) separate from UI components.

### B. Database Governance (Prisma/Neon)

- **Migration Protocol:** Use `npx prisma db push` for rapid prototyping, but formal migrations must be used for production schema changes.
- **Privacy First:** Never store raw personally identifiable information (PII). Use SHA-256 hashing for emails and IPs at the ingestion layer.
- **Atomic Operations:** Use `$transaction` for any logic that affects both membership and security keys.

### C. Content & MDX (The Canon)
- **Formatting:** All MDX must follow the predefined structure: Frontmatter → Decision Memo → Graphic Schematic → Long-form Content.
- **Asset Integrity:** All images must have defined aspect ratios and be served via the optimized Next.js `<Image />` component.

---

## 3. Pull Request Protocol

To maintain institutional oversight, every PR must include:
1. **The Five-Cut Loop record:** Complete the cuts in `.github/PULL_REQUEST_TEMPLATE.md` — requirement owner (Cut 1), what you tried to delete and the add-back rate (Cut 2), and confirmation that nothing was optimised/accelerated/automated (Cuts 3–5) that was not first run through deletion. A PR that optimises without a logged delete attempt is incomplete.
2. **The Strategic "Why":** What institutional constraint does this resolve?
3. **Schema Audit:** Does this change affect the Prisma schema? If so, have indexes been verified for performance?
4. **Outcome Proof:** Include a screenshot or log trace proving the successful outcome.

---

## 4. Security Perimeter

Contributors are strictly forbidden from:
- Altering the `middleware.ts` gating logic without Board approval.
- Modifying the `CRON_SECRET` or `innerCircleAccess` cookie security flags.
- Bypassing the `isMalicious` path filter in the security layer.

---

## 5. Contact & Oversight

Technical inquiries should be directed to the **Principal Architect**. Strategic deviations require a formal **Board Review**.

*Soli Deo Gloria.*