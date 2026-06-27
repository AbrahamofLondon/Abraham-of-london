# Book MDX Access Rendering Fix Report

Date: 2026-06-27

## Verdict

PASS - local rendering/parser/access-layer repair completed and validated. No push or manual deploy was performed.

## Root Cause

The live Architecture page returned server HTML, but the HTML payload still contained raw MDX source inside `__NEXT_DATA__`, including MDX import lines such as `import Verse from ...`. That meant the public book reader depended on client-side raw-MDX string conversion during hydration. When that client path stalled or failed, the page could look like it was hanging even though the server response contained the title and some content.

The same pattern affected component-rich canon/framework books generally: `content/books/architecture-of-ascension.mdx` and `content/books/the-builders-catechism.mdx` use MDX imports and custom components, but the book route was not using the existing static MDX render path already used by other content routes.

For gated books, the API returned raw body code only. The UI had already mapped raw auth codes such as `SESSION_INVALID`, but entitled readers could still receive raw MDX and go through the same fragile client-side conversion path.

## Access Tier Mapping

The taxonomy is canonical in code:

- `inner-circle` normalizes to `inner_circle`
- `inner_circle` is a legacy DB value at the same rank as `professional`
- the public label for `inner_circle` is currently `Professional`

This is intentional in `lib/access/tier-policy.ts` and `lib/access/public.ts`. I did not change the global access hierarchy. The Builder source currently uses Professional-facing lock copy, so the source and UI are consistent under the current taxonomy.

## Affected Routes

- `/books/architecture-of-ascension`
- `/books/the-builders-catechism`
- all other `/books/[slug]` pages were audited through the same static renderer

## Files Changed

- `components/content/DirectorateOversight.tsx`
- `lib/content/client-codec.ts`
- `lib/mdx/static-mdx-runtime.tsx`
- `lib/mdx/static-mdx-runtime.test.ts`
- `pages/api/books/[slug].ts`
- `pages/books/[slug].tsx`

## MDX Parser / Rendering Fix

- Public book pages now receive pre-rendered static HTML from `renderDocBodyToStaticHtml` in `getStaticProps`.
- Public book pages no longer need to ship raw MDX body source in page props when static HTML is available.
- The shared reader shell now supports `activeHtml` and renders it via `StaticMDXRenderer`.
- The existing client MDX path remains as a compatibility fallback only.
- The books API now returns optional compressed `bodyHtml` for entitled gated readers, while preserving `bodyCode` for backwards compatibility.
- The book page prefers decoded `bodyHtml` over raw decoded MDX code after unlock.

## Custom Components Supported

The static raw-MDX transformer now safely maps or preserves content for:

- `Callout`
- `Divider`
- `Quote`
- `PullQuote`
- `Verse`
- `Note`
- `Rule`
- `DocumentFooter`
- MDX `Link`

Unknown JSX component tags are stripped while preserving their inner text.

## Locked-State Behaviour

Gated books now render a server/static-safe locked-state block inside the Reading Chamber by default. The book route no longer renders a durable full-page `Verifying clearance...` state while `useSession()` is loading.

Raw auth/session codes are not presented in the book UI. Entitled users can receive static HTML through the books API instead of depending on raw-MDX client parsing.

For unauthenticated or unknown sessions, `/books/the-builders-catechism` renders:

- Professional access required
- the book title
- the book lock message
- sign-in/access-option actions

The footer/global directory no longer acts as a substitute for an empty reader body.

## Public-Book Behaviour

`/books/architecture-of-ascension` is public and now has a static HTML body path. The intended result is:

- no permanent `Loading...`
- no session gate
- no raw MDX import lines in the page payload
- no raw JSX tags visible to readers
- framework sections and pillars rendered as reader content

## TOC Result

The previous TOC scoping fix remains in place. The TOC reads headings from `[data-reader-content="true"]`, not from global layout or footer content.

## Book Source Audit

| Slug | Access level | Uses custom MDX components | Static render result |
| --- | --- | --- | --- |
| `architecture-of-ascension` | public | yes | PASS |
| `/books/the-builders-catechism` | inner-circle / professional label | yes | PASS |
| `/books/fathering-without-fear` | public | no | PASS |
| `/books/the-architecture-of-human-purpose` | public | no | PASS |
| `/books/the-fiction-adaptation` | public | no | PASS |

One generated Book JSON has no slug/body and is not a routed book page.

Direct static-render checks confirmed:

- Architecture HTML length: 40942
- Builder HTML length: 6258
- no `import` lines in static output
- no raw JSX tags in static output
- target body text present

## Mobile / Desktop Check

Full browser viewport inspection remains unreliable in this Windows shell because local Next dev route compilation can hang during `/books/[slug]` compilation. The low-collateral fix removes the reader's client-side raw-MDX dependency and was validated through static render checks plus the production build.

## Tests Added / Updated

- Updated `lib/mdx/static-mdx-runtime.test.ts` so raw MDX component blocks preserve inner text instead of deleting it.
- Focused test run passed: 12 tests.

## Validation Results

| Check | Result | Notes |
| --- | --- | --- |
| Live HTML inspection | CONFIRMED ROOT | live Architecture response contained raw MDX import text in payload before this fix |
| Production authority headers | PASS | `www.abrahamoflondon.org` is served by Netlify, not Vercel |
| Static render audit | PASS | all routed book pages produce clean static HTML |
| `pnpm contentlayer2 build` | PASS | 838 valid documents, 0 invalid |
| `pnpm typecheck` | PASS | `tsc --noEmit` |
| `pnpm exec vitest run lib/mdx/static-mdx-runtime.test.ts` | PASS | 12 tests passed |
| `pnpm mdx:integrity` | PASS | no corruption detected |
| `pnpm mdx:gate` | PASS | all assets verified |
| `pnpm build` | PASS | completed with existing unrelated warnings |
| `next build --webpack` | PASS | completed after Builder SSR fallback fix |
| `git diff --check` | PASS | no whitespace errors |

Existing unrelated build warnings:

- PDF duplicate filename governance warning
- local DB schema drift warning during vault sync
- existing `fs` module resolution warnings in product modules
- large page-data warnings for `/content` and `/registry`

## Push / Deploy Status

Not pushed. Not deployed manually.

Commit hash: pending local commit.
