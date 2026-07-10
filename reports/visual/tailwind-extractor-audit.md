# Tailwind Extractor Audit — DEFERRED TO PHASE 3

Per brief §11, this file requires the full empirical investigation:
1. Identify every file triggering the extractor exception — **done**, see `tailwind-extractor-trigger-inventory.json` (3 files, all `lib/` store modules, 0 component/page files).
2. Record expected Tailwind sentinel classes — not started.
3. Compile current CSS — not started.
4. Compile experimental default-extraction configuration — not started.
5. Compare emitted classes — not started.
6. Verify representative routes — not started.
7. Remove custom extraction only if empirical evidence supports it — pending steps 2–6.

This file will be completed as part of Phase 3 ("Tailwind and adapter convergence"). Step 1's result is already folded into the Phase 0 baseline (`visual-authority-baseline.md` §5) since it required no experimentation, just inventory.
