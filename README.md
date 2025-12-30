\# Abraham of London · Institutional Advisory Platform

> "Legacy doesn't happen by accident. You architect it."



This platform is a high-gravity advisory ecosystem fusing \*\*Christian conviction\*\*, \*\*strategic discipline\*\*, and \*\*historical realism\*\*. It is architected for principals, boards, and founders who carry real-world responsibility.



---



\## 1. Institutional Architecture



The platform operates on a \*\*Single Source of Truth\*\* model, integrating content delivery with strategic oversight and membership governance.







\### Core Tech Stack

\* \*\*Framework:\*\* Next.js (TypeScript)

\* \*\*Data Layer:\*\* Prisma ORM (Enterprise-grade, SQLite/PostgreSQL compatible)

\* \*\*Database:\*\* Neon (Serverless PostgreSQL)

\* \*\*Content Engine:\*\* Contentlayer (Markdown/MDX as Data)

\* \*\*Security:\*\* Next.js Middleware with Institutional Gating

\* \*\*Styling:\*\* Tailwind CSS (Institutional Minimalist Theme)



---



\## 2. Strategic Components



\### A. The Canon (Core Backbone)

The "Blueprint" of the firm. Long-form, slow-cooked frameworks for civilization and leadership.

\* \*\*Path:\*\* `/canon`

\* \*\*Data Source:\*\* MDX files in `content/canon`

\* \*\*Gating:\*\* Public index with "Inner Circle Only" access for high-gravity volumes (e.g., \*The Builder's Catechism\*).



\### B. Board Intelligence Dashboard

A high-fidelity oversight tool for institutional monitoring.

\* \*\*Path:\*\* `/board/dashboard`

\* \*\*Function:\*\* Real-time visualization of Inner Circle membership, behavioral interactions, and Strategic Room intakes.

\* \*\*Security:\*\* Restricted via `middleware.ts` to verified principals only.



\### C. The Strategic Engine (Intake System)

A data-driven diagnostic tool that evaluates the gravity of leadership decisions.

\* \*\*Path:\*\* `lib/consulting/strategy-room.ts`

\* \*\*Logic:\*\* Multi-factor scoring (Decision density, Trade-off clarity, Urgency).

\* \*\*Resilience:\*\* Atomic Prisma persistence with a "Fail-Open" local file system fallback (`tmp/intakes.log`).



---



\## 3. Data Schema \& Relational Integrity



The system utilizes an integrated Prisma schema to ensure behavioral tracking and security auditability.







\### Key Models

\* \*\*`InnerCircleMember`\*\*: The primary identity record (Privacy-first via `emailHash`).

\* \*\*`InnerCircleKey`\*\*: Temporal access tokens with built-in revocation and usage counters.

\* \*\*`ShortInteraction`\*\*: Behavioral audit of how principals engage with field signals.

\* \*\*`StrategyRoomIntake`\*\*: Persistence for high-gravity decision statements.



---



\## 4. Security \& Governance



\### Access Control (The Perimeter)

Identity is governed by a deterministic "Vault" system:

1\.  \*\*Registration:\*\* Principals are onboarded via the Register API with reCAPTCHA verification.

2\.  \*\*Verification:\*\* Keys are validated against the Neon database (Status: `active`, Expiry: `< Date.now()`).

3\.  \*\*Gating:\*\* The `middleware.ts` enforces institutional headers and path-based restrictions.



\### Automation \& Hygiene

\* \*\*Perimeter Cleanup:\*\* A GitHub Action triggers a weekly cron job (`api/cron/clean-keys`) to revoke stale or expired keys automatically.

\* \*\*Audit Logging:\*\* Every administrative and high-access event is recorded in the `SystemAuditLog`.



---



\## 5. Development Standards



\* \*\*Outcome Focus:\*\* Every function must have a clear business or strategic outcome.

\* \*\*Principled Analysis:\*\* No speculative code. All data fetching is type-safe via Prisma.

\* \*\*Aesthetic Integrity:\*\* Background: `#050609`. Primary Accent: `Amber/Gold (#D4AF37)`.

\* \*\*Performance:\*\* Static generation for the Canon; Server-side rendering for the Board Dashboard.



---



\## 6. Deployment Command Summary



| Task | Command |

| :--- | :--- |

| Initialize Database | `npx prisma db push` |

| Generate Client | `npx prisma generate` |

| Content Re-index | `npx contentlayer build` |

| Run Local Dev | `npm run dev` |

| Manual Maintenance | `npx ts-node scripts/maintenance/clean-keys.ts` |



---



\*\*Status:\*\* Operational.  

\*\*Integrity Level:\*\* Sovereign.  

© 2025 Abraham of London. All Rights Reserved.

