# Image And SVG Policy

## Decision

- `next.config.mjs` now sets `images.dangerouslyAllowSVG = false`.
- SVGs are not approved for the Next image optimization pipeline in the current launch posture.

## Reason

- This pass did not prove that every SVG reaching the image pipeline is permanently repo-controlled and non-user-supplied.
- In a launch-blocking security pass, the safer default is to deny SVG execution paths rather than rely on assumptions.

## Additional Notes

- `images.unoptimized = true` remains enabled. That is a performance tradeoff, not an approval for SVG execution.
- If SVG support is reintroduced later, it should be limited to explicitly approved static assets and accompanied by a CSP review.

## Status

- Hardening applied
