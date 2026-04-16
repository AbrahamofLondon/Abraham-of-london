# Ban List

These patterns are prohibited in the migration unless there is an explicit, documented exception.

## Architecture bans

### 1. One giant universal content component

Do not create a single component that tries to solve every card, every surface, every metadata shape, and every layout through branching.

### 2. Delete-first migration

Do not delete legacy components or styling before pilot replacements are verified.

### 3. Homepage-first redesign

Do not start with the home page.

## Styling bans

### 4. Raw hex colors in page or component code

Raw color literals belong only in token-definition files.

### 5. Runtime Tailwind interpolation for styling values

Examples of banned patterns:

- `bg-[${value}]`
- `text-[${value}]`
- `border-[${value}]`
- fake utility strings like `-mt-{padding}`

Use semantic tokens and stable class recipes instead.

### 6. Text on unstable gradients without stabilization

No meaningful text may sit directly on a decorative gradient unless the surface contract explicitly allows it and the contrast target is proven.

### 7. Multicolor or high-intensity gradients behind dense copy

Do not turn reading zones into decorative weather.

### 8. Opacity-based faint text for style

No meaningful text may be faded below accessibility thresholds just to look subtle.

## Component bans

### 9. Business logic inside primitives

Primitives must not absorb route-specific content behavior, data fetching, or page business rules.

### 10. Duplicate surface logic hidden in multiple wrappers

Do not let surface distinctions drift into repeated local one-offs.

### 11. Client-only initial render changes for stable content

Do not change headings, metadata, or core layout between SSR and first client render.

## Accessibility bans

### 12. Contrast debt deferred until later

Contrast is not a final polish task. It is a shipping requirement.

### 13. Invisible or weak focus states

Keyboard focus must remain visible on every interactive surface.

### 14. Motion without reduced-motion support

Decorative motion must respect reduced-motion settings.

## Governance bans

### 15. One-off exceptions without documentation

If a page truly needs an exception, it must be documented in the migration notes with a clear reason.

### 16. Expanding scope mid-phase

Do not quietly migrate extra surfaces just because the agent is “already in there.”

### 17. Shipping without pilot review

Canon and Vault must be reviewed before broader rollout.

## Performance bans

### 18. Decorative layers without budget awareness

Do not add blur, grain, overlays, motion, and image treatments casually. Every layer has cost.

### 19. Heavy image treatments on card lists by default

Card grids are not hero banners.

### 20. Layout instability introduced by decorative behavior

No aesthetic enhancement may cause content jumping, delayed readability, or unstable structure.
