# Technical Debt Report

## TypeScript / build debt update

### Root Cause

`lib/rendering/mdx/markdown.ts` contained JSX:

```tsx
<div
  className={className ?? "smdx-content"}
  dangerouslySetInnerHTML={{ __html: html }}
/>
```

Because the file extension was `.ts`, TypeScript parsed it as plain TypeScript instead of TSX, producing parser errors around line 80.

### Fix Applied

Renamed the file to:

```text
lib/rendering/mdx/markdown.tsx
```

No logic was changed. Existing imports use extensionless `./markdown`, so no import updates were required.

### Files Changed

* `lib/rendering/mdx/markdown.ts` -> `lib/rendering/mdx/markdown.tsx`

### Verification

* `npx tsc --noEmit --skipLibCheck`: parser issue fixed, but global TypeScript now exposes unrelated semantic debt across the repo.
* `npx next build`: passed.

### Remaining global TS debt

Unrelated semantic issues remain in areas such as:

* components/readers
* access/session typing
* executive report constitution typing
* navigation surface contracts
* diagnostics pages
* billing checkout nullability

### Final Decision

**PRIMARY PARSER ISSUE FIXED, OTHER GLOBAL TS DEBT REMAINS**
