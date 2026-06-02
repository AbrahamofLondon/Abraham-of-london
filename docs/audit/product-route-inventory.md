# Product Route And Page Inventory

Date: 2026-06-02

Scope audited:

- `pages/`
- `app/`
- `components/homepage/`
- `components/commercial/`
- `components/decision-centre/`
- `components/diagnostics/`
- `components/foundry/`
- `components/reporting/`
- `components/instruments/`

`routeReturns200Known?` is code-known from route presence and control flow, not live HTTP probed.

## Inventory

| route | title | RouteProductStatus | productName? | productFamily? | commercialRole | hasCTA | checkoutLinked | routeReturns200Known? | notes |
|---|---|---:|---|---|---|---:|---:|---:|---|
| `/products` | Decision Infrastructure Products | LIVE_PUBLIC | Product router | Commercial ladder | content | yes | no | yes | Public catalog/router. Links to activation, enterprise, pricing, Boardroom Brief, Strategy Room, instruments, and planned/gated surfaces. Several linked routes are not present or are outside this audit scope. |
| `/pricing` | Pricing | LIVE_PUBLIC | Governed decision access | Commercial ladder | paid_product | yes | yes | yes | Main payment/access page. Uses `CheckoutButton` and catalog products. Also lists contracted/manual products that are not checkout-enabled. |
| `/decision-pathway` | Decision Pathway | LIVE_PUBLIC | Governed Decision Pathway | Commercial ladder | content | yes | no | yes | Public progression map. Most higher-value products are shown as locked/evidence-gated; CTA only appears for open nodes. |
| `/decision-centre` | Decision Centre | LIVE_AUTH_REQUIRED | Decision Centre | Case memory / continuity | service | yes | no | yes | Page renders publicly but fetches `/api/decision-centre/cases`; authenticated data required for real case state. Has empty/auth states and CTAs to diagnostics, Strategy Room, and engagements. |
| `/decision-centre/case/[caseId]` | Case Detail | LIVE_AUTH_REQUIRED | Decision Centre Case | Case memory / continuity | service | yes | no | yes | Client-side fetch of Decision Centre cases; redirects to sign-in on auth-required API response. noindex. |
| `/strategy-room` | Strategy Room | LIVE_GATED | Strategy Room | Execution / intervention | paid_product | yes | yes | yes | Public page with SSR entitlement/checkout confirmation. Catalog marks `strategy_room` and `strategy_room_extended` as active paid checkout products. Evidence gate language is strong; page still offers entry form/payment flow. |
| `/strategy-room/success` | Strategy Room Success | LIVE_GATED | Strategy Room | Execution / intervention | paid_product | yes | no | yes | App route success page. Client fetches `/api/strategy-room/results?id=...`; useful only after payment/session. |
| `/strategy-room/session/[id]` | Strategy Room Session | LIVE_AUTH_REQUIRED | Strategy Room execution session | Execution / intervention | service | yes | no | yes | noindex dynamic persisted session route. Server fetches execution session by ID and authorization/cookies; shows access denied/not found fallback. |
| `/consulting/strategy-room` | Legacy consulting Strategy Room redirect | REDIRECT_ONLY | Strategy Room | Execution / intervention | service | no | no | no | `getServerSideProps` redirects to `/diagnostics`. Comment says legacy route and `/strategy-room` is earned entry path. |
| `/boardroom` | Boardroom Archive | LIVE_AUTH_REQUIRED | Boardroom Archive / Boardroom Mode | Boardroom / retained memory | service | yes | no | yes | Requires `OVERSIGHT_VIEW` role via SSR. Not public buying page; retained board-level archive and qualification state. |
| `/boardroom/[sessionId]` | Boardroom | LIVE_GATED | Boardroom session | Boardroom / dossier | report | yes | no | yes | noindex dynamic route. Server fetches Strategy Room execution session and computes boardroom readiness; can render unqualified state. |
| `/boardroom/dossier/[dossierId]` | Boardroom Dossier | THIN_PAGE | Boardroom Dossier | Boardroom / dossier | report | no | no | yes | App route exists but server page is a minimal wrapper around `BoardroomDossierClient`; product value appears in client/API path, not in a public route. |
| `/boardroom-brief` | Boardroom Brief | LIVE_PUBLIC | Boardroom Brief | Market activation / boardroom | paid_product | yes | yes | yes | Public intake and result page. Uses `CheckoutButton` for `boardroom_brief`; also links to `test-your-decision`, Enterprise Decision Scan, Executive Reporting, Boardroom, and Strategy Room. |
| `/enterprise` | Enterprise Decision Infrastructure | LIVE_PUBLIC | Enterprise pathway | Enterprise | service | yes | no | yes | Public enterprise front door. CTAs to organisational scan, Boardroom Brief, and Products. Enterprise catalog product is contracted, not checkout. |
| `/enterprise/preview` | Enterprise Preview | THIN_PAGE | Enterprise preview | Enterprise | content | yes | no | yes | noindex preview page. Shows capabilities and routes to scan/operator pilot/pathway; not a public product acquisition page. |
| `/enterprise-decision-scan` | Organisational Decision Scan | LIVE_PUBLIC | Enterprise Decision Scan | Enterprise diagnostic | diagnostic | yes | no | yes | Public interactive B2B scan. Produces recommended path and can navigate to Operator Pilot. No checkout. |
| `/enterprise/alignment/campaigns/[campaignId]` | Enterprise Campaign Dashboard | LIVE_AUTH_REQUIRED | Enterprise alignment campaign | Enterprise assessment | report | yes | no | unknown | App dynamic dashboard tied to campaign data. Relevant enterprise reporting surface but not public product route. |
| `/engagements` | Selective Engagements | LIVE_PUBLIC | Selective engagements | Engagements | service | yes | no | yes | Public engagement index. Routes to Operator Pilot, Retained Oversight, Counsel, and diagnostics. |
| `/engagements/operator-pilot` | Selective Operator Pilot | LIVE_PUBLIC | Operator Pilot | Engagements | service | yes | no | yes | Public qualification/positioning page. CTAs point to diagnostics and selective-pilot terms; no checkout. |
| `/engagements/selective-pilot` | Selective Pilot Terms | LIVE_PUBLIC | Selective Pilot | Engagements | service | yes | no | yes | Public terms/eligibility page. Routes to Fast Diagnostic and Operator Pilot. |
| `/engagements/retained-oversight` | Retained Oversight | LIVE_PUBLIC | Retained Oversight | Retainer / oversight | retainer | yes | no | yes | Buyer-facing selective engagement page. Honest gating language; routes to `/oversight` and diagnostics. |
| `/retainer` | Decision Authority Retainer | LIVE_AUTH_REQUIRED | Decision Authority Retainer | Retainer / retained decisions | retainer | no | no | yes | SSR redirects unauthenticated users to sign-in. Requires `organisationId` or `contractId`; contracted catalog products are inactive/non-checkout. |
| `/retainer/intake` | Oversight Intake | LIVE_AUTH_REQUIRED | Retainer Intake / Oversight Readiness | Retainer / intake | retainer | yes | no | yes | SSR auth-required intake. Submits to `/api/internal/retainer/intake`; does not activate oversight or pricing. |
| `/consulting` | Advisory & Strategy | LIVE_PUBLIC | Advisory / Strategy consulting | Consulting | service | yes | no | yes | Large public advisory route with contact/diagnostic CTAs. Not checkout-linked. |
| `/consulting/interventions` | Intervention Console | LIVE_AUTH_REQUIRED | Intervention Console | Consulting / intervention | service | yes | no | yes | noindex console. Uses API fetches to intervention endpoints; operational surface rather than public product. |
| `/subscribe` | Founding Readers Circle | LIVE_PUBLIC | Founding Readers Circle | Canon / membership | lead_magnet | yes | no | yes | Newsletter/reader circle capture via `NewsletterForm`; not checkout-linked. |
| `/test-your-decision` | Test Your Decision | LIVE_PUBLIC | Test Your Decision router | Market activation | lead_magnet | yes | no | yes | Public routing layer to pressure signal, decision signal, fast diagnostic, and enterprise scan. |
| `/foundry` | The Decision Foundry | LIVE_PUBLIC | Decision Foundry | Foundry | lead_magnet | yes | no | yes | Public Foundry front door. Routes to Foundry tests and supporting proof pages. |
| `/foundry/start` | Start - Choose Your Foundry Pathway | LIVE_PUBLIC | Foundry Pathway | Foundry | lead_magnet | yes | no | yes | Public pathway selector with contact/demo links. |
| `/foundry/demo` | Foundry Demo | LIVE_PUBLIC | Foundry Demo | Foundry | diagnostic | yes | no | yes | Public interactive/demo page. Routes to start/value. |
| `/foundry/decision-test` | Test a Decision | LIVE_PUBLIC | Foundry Decision Test | Foundry | diagnostic | yes | no | yes | Public route exists but has duplicate `noindex,nofollow` metadata. Treat as live but intentionally hidden from search. |
| `/foundry/market-signal-test` | Market Signal Test | LIVE_PUBLIC | Foundry Market Signal Test | Foundry | diagnostic | yes | no | yes | Public route exists but has duplicate `noindex,nofollow` metadata. |
| `/foundry/release-risk-test` | Release Risk Test | LIVE_PUBLIC | Foundry Release Risk Test | Foundry | diagnostic | yes | no | yes | Public route exists but has duplicate `noindex,nofollow` metadata. |
| `/foundry/value` | Value Case - What the Foundry Delivers | LIVE_PUBLIC | Foundry Value Case | Foundry | content | yes | no | yes | Public value/proof page. Routes to demo and start/contact anchor. |
| `/foundry/brief/sample` | Sample Decision Failure Brief | LIVE_PUBLIC | Decision Failure Brief sample | Foundry / brief | report | yes | no | yes | Public sample report page. Routes to decision test and start. |
| `/foundry/brief/success` | Redirecting | REDIRECT_ONLY | Decision Failure Brief success | Foundry / brief | report | no | no | yes | Client-side redirect to `/foundry/case/success`; comment says retired, but implementation returns a redirecting page rather than server 410. |
| `/foundry/case/success` | Foundry Case Success | LIVE_GATED | Foundry Living Case success | Foundry / living case | report | yes | no | yes | App route success page for `caseId`, `tier`, and `session_id` search params. Post-checkout/fulfilment style surface. |

## Component-Only Or Buried Product Surfaces

These are relevant product/commercial surfaces discovered under the scoped component directories or catalog, but they are not direct route pages in the audited route set.

| route | title | RouteProductStatus | productName? | productFamily? | commercialRole | hasCTA | checkoutLinked | routeReturns200Known? | notes |
|---|---|---:|---|---|---|---:|---:|---:|---|
| `components/commercial/CheckoutButton.tsx` | CheckoutButton | LIVE_GATED | Shared checkout action | Commercial checkout | paid_product | yes | yes | n/a | Posts to `/api/billing/checkout` with `productCode`/`priceCode`; used by pricing, Boardroom Brief, Executive Reporting paywall/upgrade components. |
| `components/commercial/ProductRecommendationCard.tsx` | ProductRecommendationCard | LIVE_GATED | Earned progression recommendation | Commercial ladder | paid_product | yes | yes | n/a | Links active products to `successPath` or `/checkout?product=...`; fallback retainer CTA links `/retainer`. `/checkout` page was not found in scoped pages/app routes, but `pages/checkout/personal-decision-audit.tsx` exists separately. |
| `components/diagnostics/ExecutiveReportingPaywall.tsx` | ExecutiveReportingPaywall | LIVE_GATED | Executive Reporting | Reporting | report | yes | yes | n/a | Posts to `/api/billing/checkout` for `executive_reporting`. The route `/diagnostics/executive-reporting/run` is catalog success path but outside the explicitly audited named route list. |
| `components/diagnostics/ERUpgradePanel.tsx` | ERUpgradePanel | LIVE_GATED | Executive Reporting upgrade | Reporting | report | yes | yes | n/a | Direct checkout trigger for `executive_reporting` and background upgrade tracking. |
| `components/decision-centre/LadderPathwayPanel.tsx` | LadderPathwayPanel | LIVE_PUBLIC | Decision pathway ladder | Commercial ladder | content | yes | no | n/a | Buries links to `/decision-pathway` and product nodes inside Decision Centre UI. |
| `components/decision-centre/RetainerOversightPreview.tsx` | RetainerOversightPreview | LIVE_GATED | Retainer Oversight preview | Retainer / oversight | retainer | yes | no | n/a | Links to `/engagements/retained-oversight`; preview only, not activation. |
| `components/decision-centre/RetainerMemoryPreview.tsx` | RetainerMemoryPreview | LIVE_GATED | Retainer memory preview | Retainer / memory | retainer | no | no | n/a | Shows retained-memory state within Decision Centre; no direct commercial CTA. |
| `components/foundry/InterestForm.tsx` | Foundry InterestForm | LIVE_PUBLIC | Foundry interest capture | Foundry | lead_magnet | yes | no | n/a | Posts to `/api/foundry/interest`. This is a capture component, not a route. |
| `components/instruments/InstrumentShell.tsx` | InstrumentShell | LIVE_GATED | Decision instruments shell | Instruments | instrument | yes | no | n/a | Shared result shell with next-step and PDF links. Many instrument catalog products are active/checkout-enabled, but direct route coverage is outside named routes. |
| `components/reporting/boardroom/BoardroomModeSurface.tsx` | BoardroomModeSurface | LIVE_GATED | Boardroom Mode surface | Boardroom / reporting | report | no | no | n/a | User-facing boardroom reporting surface, rehomed from admin, consumed by boardroom/reporting routes. |
| `components/reporting/sections/*` | Reporting sections | LIVE_GATED | Value Recovery / Intervention reporting sections | Reporting | report | no | no | n/a | Report content modules; no direct route or checkout. |

## Product Catalog Findings

- Active checkout products with direct or indirect route exposure include Boardroom Brief (`/boardroom-brief`), Executive Reporting (`/diagnostics/executive-reporting/run`), Strategy Room (`/strategy-room`), Professional (`/decision-centre`), and multiple decision instruments (`/decision-instruments/...`).
- Retainer products are catalogued as contracted and inactive for self-serve checkout: `retainer_core`, `retainer_operational`, `retainer_institutional`.
- Enterprise is active but contracted/manual-contact style: catalog `successPath` is `/contact`, while public product education is at `/enterprise` and `/enterprise-decision-scan`.
- Several catalog products are active but their success paths were not in the named route list: decision instruments, governed playbooks, Global Market Intelligence, and evidence dossiers.

## Key Missing Or Buried Products

- `/checkout?product=...` is linked from `ProductRecommendationCard`, but no top-level `/checkout` page route was found in the scoped route inventory. There is only `pages/checkout/personal-decision-audit.tsx` plus API checkout routes.
- `/decision-pressure`, `/decision-instruments`, `/diagnostics/fast`, `/diagnostics/executive-reporting`, `/diagnostics/team-assessment`, and `/diagnostics/enterprise-assessment` are repeatedly linked from the audited product pages/components, but are outside the explicit named route list and should be audited in the next pass because they are core conversion routes.
- Retainer Oversight is visible in several places but remains fragmented: public education at `/engagements/retained-oversight`, auth-required operational state at `/retainer`, intake at `/retainer/intake`, and previews inside Decision Centre components. There is no self-serve retainer product route.
- Boardroom is similarly split: public activation via `/boardroom-brief`, retained/archive console at `/boardroom`, session route at `/boardroom/[sessionId]`, and thin dossier wrapper at `/boardroom/dossier/[dossierId]`.
- Foundry has public test/value routes, but individual tests are `noindex,nofollow`; `/foundry/brief/success` is a client redirect to `/foundry/case/success`, making the old success route effectively legacy.
- Executive Reporting is commercially central and checkout-linked in components/catalog, but the direct route was not one of the required named checks; it is buried behind `/pricing`, diagnostics components, and product ladder links.
