# Component Strategy and Replacement Map

## Governing rule

Do not build one giant universal content component.

Build:

- tightly controlled primitives
- thin surface compositions
- page-level assemblies

This preserves reuse without turning the system into conditional spaghetti.

## Primitive layer

These are the first-class reusable building blocks.

### 1. `CardShell`

Responsibility:

- outer container
- surface-aware background/panel/border treatment
- spacing rhythm
- hover/focus treatment
- optional linked-card behavior

Must not own:

- content normalization
- metadata decisions
- surface-specific branching beyond safe variants

### 2. `SmartCover`

Responsibility:

- image slot
- aspect ratio control
- fallback behavior
- safe overlays
- optional priority handling for above-the-fold usage

Must not own:

- card layout
- route-specific metadata logic
- random visual effects

### 3. `ContentMeta`

Responsibility:

- title
- eyebrow/kicker
- byline/date/read time
- tags/status chips
- hierarchy rules

Must not own:

- navigation wrappers
- data fetching
- layout shells

### 4. `SurfaceHeader`

Responsibility:

- hero framing
- heading, dek, supporting metadata
- stable reading zone
- surface-specific tone via contract

Must not own:

- page business logic
- random client-side copy changes

### 5. `ReaderFrame`

Responsibility:

- prose width
- typography rhythm
- quote/callout/list/code/caption rules
- reader comfort

### 6. `ActionLink`

Responsibility:

- consistent CTA/link treatment
- icon alignment
- hover/focus styling

### 7. `SectionDivider`

Responsibility:

- surface-aware separation
- hairline and spacing rhythm

### 8. `FilterBar`

Responsibility:

- search/filter/sort shell
- tokenized controls
- restrained density

### 9. `EmptyState`

Responsibility:

- calm, legible no-content states
- not cartoon sadness

### 10. `SurfaceNav`

Responsibility:

- local context
- restrained hierarchy
- no duplication with hero copy

## Thin composition layer

These components should primarily assemble primitives and select configuration.

### `CanonCard`
Uses:
- `CardShell`
- `SmartCover`
- `ContentMeta`
- `ActionLink`

### `VaultCard`
Uses:
- `CardShell`
- `ContentMeta`
- optional `SmartCover`
- technical metadata emphasis

### `EssayCard`
Uses:
- `CardShell`
- `SmartCover`
- `ContentMeta`

### `ShortCard`
Uses:
- `CardShell`
- `ContentMeta`
- minimal image usage

### `BookCard`
Uses:
- `CardShell`
- `SmartCover`
- `ContentMeta`

### `InnerCircleCard`
Uses:
- `CardShell`
- `ContentMeta`
- restrained restricted-state accents

## Adapter layer

Do not use one giant "normalize everything" blob.

Create separate typed adapters for:

- `normalizeListItem`
- `normalizeReaderDocument`
- `normalizeFeatureItem`

Potential follow-on specializations may include:

- `normalizeSearchResult`
- `normalizeDownloadItem`
- `normalizeEventItem`

## Suggested legacy-to-new mapping

This is a migration guide, not a deletion license.

| Legacy pattern | Target replacement |
|---|---|
| Multiple unrelated content cards | primitives + thin compositions |
| Surface-specific hand-built hero wrappers | `SurfaceHeader` |
| Page-local metadata stacks | `ContentMeta` |
| Repeated cover-image markup | `SmartCover` |
| Ad hoc CTA link styles | `ActionLink` |
| Page-specific prose wrappers | `ReaderFrame` |
| one-off separators/hairlines | `SectionDivider` |
| noisy top-of-page utility bars | `SurfaceNav` + `FilterBar` |

## Deletion policy

Legacy components may be removed only after:

1. pilot surfaces pass
2. visual review passes
3. accessibility review passes
4. page behavior matches required baseline
5. no hidden business logic is lost

## Implementation warning

If a composed card starts accumulating layout branches for multiple surfaces, stop and push that branching back into:

- surface contracts
- primitives
- dedicated thin compositions

That is the main anti-bloat rule.
