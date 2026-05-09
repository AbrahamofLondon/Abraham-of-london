# Homepage Mobile UX Audit

Date: 2026-05-09
Method: code-led audit of responsive structure, type scales, spacing, and navigation behavior. No live device session was run in this pass.

## Verdict

`MOBILE_ACCEPTABLE_WITH_FIXES`

## Key Findings

| Mobile Area | Status | Issue | Fix |
| --- | --- | --- | --- |
| Fixed header | Weak | Header remains visually heavy for a long one-column page | Reduce mobile brand stack and menu chrome |
| Hero | Mixed | Strong headline, but too many low-contrast support lines at `10px` and below | Collapse to one support paragraph and one trust line |
| First CTA | Strong | `Test a decision` remains visible and tappable | Keep |
| Refusal demo | Strong | Simple stacked cards work well in one column | Keep |
| Category differentiation | Mixed | Two-column desktop logic becomes repetitive one-column text | Compress card copy |
| Product ladder | Weak | Eight-stage list becomes long, menu-like scroll | Collapse to 3 states: start, escalate, verify |
| Buyer pathways | Weak | Three audience cards feel salesy and long when stacked | Rebuild or remove |
| Trust grid | Weak | Eight trust cards stack into a heavy doctrinal wall | Cut to four strongest cards |
| Evidence cards | Mixed | Small cards work, but arrive too late | Move earlier |
| Footer | Mixed | Premium but route-dense; small metadata copy risks fatigue | Reduce route count on mobile |

## Mobile-Specific Risks

- Small mono text is used repeatedly at `7px`, `8px`, and `9px`. That is visually premium on desktop and brittle on phones.
- The header plus hero top padding creates a long pre-content runway.
- Multiple stacked section types with the same border/panel language reduce rhythm and memorability.
- The page relies on long reading more than quick recognition.

## What Still Lands on Mobile

- The refusal headline
- The hero primary CTA
- The refusal demo sequence
- The dark institutional palette

## What Degrades on Mobile

- The distinction between category explanation, trust doctrine, and product routing
- The sense of calm authority
- The clarity of the entry path after the hero

## Minimum Mobile Fixes Before Public Push

1. Remove the premature front-door final CTA.
2. Move applied proof and fit qualification above any late-stage product route.
3. Reduce microcopy in the hero and trust blocks.
4. Compress the product ladder.
5. Simplify the footer on mobile.
