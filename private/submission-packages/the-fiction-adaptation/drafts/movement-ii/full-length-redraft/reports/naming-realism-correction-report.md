# Naming Realism Correction Report

**Date:** 2026-06-28
**Pass type:** Naming realism only (no plot, structure, or prose-architecture change beyond names and the name-meaning passages).
**Trigger:** Igbo given names were over-clustered, producing an ethnically over-coded effect. Corrected toward a lived-in Nigerian-Christian / occupational mix before the cast expands at Ch.15.

---

## Names found (audit)

Grep across the whole package returned these Igbo given names in use as **characters**:
- **Nneoma** (the Elder / Mama Nneoma) — Ch.6, 10, 11, 12, 13, 14 + reports + assemblies.
- **Obiefuna** (the landlord) — Ch.12, 13, 14 + reports + assemblies.
- **Chinwe** (Mama Chinwe, a street neighbour) — Ch.13, 14 + reports + assemblies.

**False positives (not characters; no action):**
- **"Ada"** hits = the word "Adapt**a**tion" in titles/headers and historical notes — not a name.
- **"Adaeze"** hits = historical references to the *old placeholder* for Obianuju in early meta-docs (`movement-i/README`, `movement-i-drafting-report`), documenting the prior rename. Left as rename history.
- **Ngozi, Emeka, Ifeoma, Chukwudi, Uche, Obinna, etc.:** zero occurrences.

No other Igbo given names were in use.

---

## Names changed

| From | To | Rationale |
| :--- | :- | :-------- |
| Mama Nneoma / Nneoma | **Mama Agnes / Agnes** | Christian/public elder name; grounded, unshowy; preserves authority without ethnic over-coding. |
| Obiefuna | **Mr Stephen** | Realistic public address; removes the over-designed name-meaning; forces the threat to be earned by behaviour. |
| Mama Chinwe / Chinwe | **Mama Rose** | Common Christian/street-figure texture; unobtrusive; reduces Igbo-name clustering. |

Applied mechanically and consistently across `drafts/`, `reports/`, `assemblies/`, and the root assembled files. Possessives handled (e.g., "Obiefuna's" → "Mr Stephen's"; "Nneoma's" → "Agnes's").

## Names retained (and why)
- **Obianuju** — central figure; unchanged, unshortened, no diminutive invented. ✔
- **Kene** — the one additional Igbo name allowed: central, established, emotionally functional. ✔
- Occupational labels kept as-is and now carry more of the cast: the pepper woman, the snail woman, the young fish-seller, the bicycle-chain man (white-cap man), the man with the ladder, the women at the standpipe, the boys at the wall, the landlord. This widens the town and makes it feel lived-in rather than curated.

---

## Confirmations
- **Obianuju retained.** ✔
- **Kene retained.** ✔
- **Mama Nneoma → Mama Agnes.** ✔ (voice unchanged; the locked Elder sentence *"You can be welcomed and still be late."* unchanged; "carry it badly until you can carry it well" unchanged.)
- **Obiefuna → Mr Stephen.** ✔ (used in plain town address throughout; no surname needed.)
- **Mama Chinwe → Mama Rose.** ✔
- **Obiefuna name-meaning material removed/rewritten.** ✔ The function is now carried by **behaviour**, not the name:
  - **Ch.12 intro** — "His name meant *may the homestead not be lost*… making certain that no homestead of his was ever lost…" → "He had not lost a house in thirty years — not to flood, not to debt, not to the slow defeat of a room left empty and earning nothing — and he carried the settled certainty of a man whose whole life had been the keeping of things full."
  - **Ch.13 monologue** — the "*Obiefuna*… It is a prayer. *May the homestead not be lost.* My mother gave it to me…" speech → "I have kept houses thirty years… I keep them full and I keep them quiet. A full house pays; a quiet house keeps its tenants. And the ones that will not stay quiet… those I empty, and fill again, and they forget. Houses are very good at forgetting."
  - **Ch.13 closing** — "a man whose name was a prayer he had never once failed to answer." → "a man who in thirty years had never once failed to keep a house full."
  - The two **report** lines that quoted the name-meaning were also scrubbed (Ch.12 and Ch.13 drafting reports). Verified: grep for "homestead" returns 0 hits in drafts and reports.
  - The landlord's menace is now entirely behaviour: the rent book on the gatepost, the refusal to cross his own threshold, the need for quiet, the "enquiry" from replacement tenants, the emptying of loud houses, civility as threat.
- **No plot / structure / prose architecture changed beyond naming realism.** ✔ No chapter titles changed (no name appears in a title). No acceptance-gate sentence contained a renamed character, so none was altered. Cold architecture, Trance/Voice/Claim distinctions, and the memoir firewall untouched.
- **Assemblies rebuilt.** ✔ Deterministically regenerated from the corrected canonical chapter drafts: `movement-ii-ch11-assembled`, `movement-ii-ch11-12`, `…-ch11-13`, `…-ch11-14`, and `movement-i-ch01-10-assembled`. (Movement-I partial assemblies — ch01-03/05/06/08 — contained only the Nneoma→Agnes mechanical change and were updated in place.)
- **No memoir leakage introduced.** ✔ The behaviour-rewrites avoid fire/court/immigration/child material; "not to flood, not to debt" replaces the removed name-meaning without legal-case texture.
- **No site/`content/`/FWF/build files touched.** ✔ All changes inside `private/submission-packages/the-fiction-adaptation/`.

---

## Future naming rule (recorded)
From Ch.15 onward: **no new Igbo given names without owner approval.** Allowed — Obianuju; Kene; Christian/public names (Mama Agnes, Mr Stephen, Mama Rose pattern); occupational descriptors; titles (Mama, Aunty, Uncle, Brother, Sister, Madam, Mr); surnames sparingly. The town should read Nigerian, Christian, socially mixed, lived-in — not symbolic, not over-coded.

## Recommendation for Ch.15
Proceed to **Ch.15 — The Bargaining** under the new naming rule. Any new figures (a fellow tenant, a church/mosque-adjacent elder, a market or money figure the protagonist tries to bargain with) should use the Christian/public or occupational pattern. Mr Stephen and Mama Agnes are both available to return; the landlord's behaviour-carried menace is now the model for how pressure should work — in the scene, never in a name.

*No push. No deploy. No merge. No upstream pull.*
