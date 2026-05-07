# Incident Response Plan

Updated: 2026-05-07

1. Classify incident scope: secrets, auth, payments, content, data privacy.
2. Freeze deploys except containment fixes.
3. Rotate all compromised or suspected-compromised secrets.
4. Invalidate sessions, tokens, and bypass credentials tied to rotated secrets.
5. Rebuild from clean env state and rerun validation.
6. Capture exact findings, fixes, residual risks, and operator actions.
