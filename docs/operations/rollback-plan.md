# Rollback Plan

Updated: 2026-05-07

1. Keep previous deploy artifact available.
2. Revert only the affected release window, not unrelated data.
3. Re-apply rotated secrets to the rollback target before reopening traffic.
4. Re-verify proxy/perimeter behavior, auth, downloads, and webhooks after rollback.
5. Keep incident logging enabled until postmortem closeout.
