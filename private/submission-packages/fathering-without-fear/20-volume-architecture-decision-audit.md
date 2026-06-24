# Volume and Architecture Decision Audit — Fathering Without Fear

**Date:** 2026-06-24 (corrected pass: 2026-06-24)
**Auditor:** Claude Code (automated prose-strip word count + architectural analysis)
**Baseline reference:** 38,094 (prior stated total)
**Sources consulted:** `content/source-material/fathering-without-fear/drafts/ch*.mdx` (22 individual draft files — corrected from initial pass which incorrectly read `01-clean-manuscript.md`)
**Stage:** Pre-expansion-pass architectural lock

---

## Correction Notice

The initial version of this report (committed as `93c9cad87`) contained a counting error. The word-count script used a toggle-based `---` parser that also stripped sections of prose separated by `---` horizontal rules. Chapters using `---` as internal section dividers (Ch.12, Ch.14, Ch.17, Ch.18 and others) had alternating sections silently removed from the count. The corrected script only strips the initial YAML frontmatter block and leaves all subsequent prose intact.

Additionally, the initial pass read from `01-clean-manuscript.md` rather than the canonical draft files. The canonical source is the individual chapter files under `content/source-material/fathering-without-fear/drafts/`.

The corrected total is **42,335 words**, not 37,907.

### Ch.10 Note

Ch.10 (Leaving Lagos) stood at approximately 1,919 prose words at the confirmed commit `ce312cbfa` (Expand Chapter 10 arrival provision). A subsequent commit, `80bbd9679` (labelled "Refine Chapter 2 inheritance"), also modified `ch10-leaving-lagos.mdx`, replacing longer expansive sentences with compressed, punchier prose. The chapter now stands at **1,660 words** — down 259 from ce312cbfa. This was not an error; it was a stylistic compression. But it means Ch.10 is 266 words below the user's confirmed post-expansion figure of 1,926. The user should be aware that this revision exists.

---

## Section 1: Current Word Count

### Total Prose Word Count

**42,335 words** (prose-only; all 22 chapters)

Counting methodology: excluded YAML/frontmatter (first `---`...`---` block only), chapter-title heading lines (`# Chapter X`), and blank lines. All prose body, section-separator `---` lines (counted as content markers), production notes, and italic colophons are included in the prose strip. This is the established count method applied consistently across all 22 files.

### Per-Chapter Breakdown

| Chapter | Title | Word Count |
| :------ | :---- | ---------: |
| Ch.1  | Hounslow Call                          | 1,184 |
| Ch.2  | Isua to Agege                          |   976 |
| Ch.3  | The Boy Who Was Already Old            | 1,327 |
| Ch.4  | A Hearing Date                         | 1,227 |
| Ch.5  | Jumoke                                 | 1,380 |
| Ch.6  | The Fire and the Deal                  | 2,506 |
| Ch.7  | The Name That Had to Be Powerful       | 1,185 |
| Ch.8  | The Spiritual Covering                 | 1,107 |
| Ch.9  | The Boy Who Became a Father at Fifteen | 1,111 |
| Ch.10 | Leaving Lagos                          | 1,660 |
| Ch.11 | A Post on Facebook                     |   858 |
| Ch.12 | Married by December                    | 3,795 |
| Ch.13 | Serena                                 |   896 |
| Ch.14 | David Was Missing From the Wedding     | 3,753 |
| Ch.15 | Funke                                  |   930 |
| Ch.16 | Fatherhood Began Outside               | 1,272 |
| Ch.17 | What the System Sees                   | 3,032 |
| Ch.18 | Seven Years                            | 3,737 |
| Ch.19 | Damisi                                 | 3,376 |
| Ch.20 | Love Does Not Fear                     | 3,283 |
| Ch.21 | Devotion                               | 2,893 |
| Ch.22 | Final Room                             |   847 |
| **TOTAL** |                                    | **42,335** |

### Net Movement vs Baseline

| Metric | Value |
| :----- | ----: |
| Prior stated baseline | 38,094 |
| Corrected current total | 42,335 |
| Net movement | **+4,241 words** |

The manuscript has grown substantially from the stated baseline. The prior baseline of 38,094 was itself likely affected by the same counting script error. The working figure for all planning purposes is **42,335**.

---

## Section 2: Chapter Status Table

| Chapter | Word Count | Status | Last Action | Verdict | Reason |
| :------ | ---------: | :----- | :---------- | :------ | :----- |
| Ch.1  Hounslow Call                          | 1,184 | Controlled, underdeveloped | No expansion pass yet | CAN EXPAND | Sensory/scene gaps; legal constraints respected; room for 400–800 additional prose words |
| Ch.2  Isua to Agege                          |   976 | Skeletal — founding chapter | Revised (masterpiece pass) | NEEDS SOURCE | Boolekaja, road, tailoring detail partially rendered; more scene-level memory can grow this |
| Ch.3  The Boy Who Was Already Old            | 1,327 | Controlled — naming chapter | Sharpened (masterpiece pass) | CAN EXPAND | Naming weight is present; room for one domestic childhood scene without disrupting focus |
| Ch.4  A Hearing Date                         | 1,227 | Intentionally brief — legally constrained | No action (locked) | LOCKED | Brevity is the form; court compresses time; chapter does too; do not expand |
| Ch.5  Jumoke                                 | 1,380 | Controlled — first death | Expanded/restructured (masterpiece pass) | CAN EXPAND | Jumoke as living child before death requires one ordinary memory; 400–600 word gain possible |
| Ch.6  The Fire and the Deal                  | 2,506 | Saturated | No action (locked) | LOCKED | Fully rendered from source; any expansion is invention |
| Ch.7  The Name That Had to Be Powerful       | 1,185 | Controlled, slightly underdeveloped | No expansion pass yet | CAN EXPAND | Room for the scene of Iyalode speaking; 500–800 word gain possible |
| Ch.8  The Spiritual Covering                 | 1,107 | Controlled — major character | Refined (masterpiece pass) | NEEDS SOURCE | Iyalode as person not concept; one physical domestic detail still missing |
| Ch.9  The Boy Who Became a Father at Fifteen | 1,111 | Controlled — David Senior origin | Refined (masterpiece pass) | NEEDS SOURCE | Labour/siblings scene not yet fully rendered; 500–1,000 word gain if source confirmed |
| Ch.10 Leaving Lagos                          | 1,660 | Medium — revised down from 1,919 | Expanded then compressed (80bbd9679) | CAN EXPAND | 266 words below confirmed post-expansion figure; Heathrow/post-burial texture may remain |
| Ch.11 A Post on Facebook                     |   858 | Controlled, underdeveloped | No expansion pass yet | CAN EXPAND | Scene texture of post, reply landing, invitation quality; 400–600 word gain possible |
| Ch.12 Married by December                    | 3,795 | Saturated — legally aware | No action (locked) | LOCKED | Book's longest chapter; legally sensitive; do not add |
| Ch.13 Serena                                 |   896 | Controlled, underdeveloped | No expansion pass yet | CAN EXPAND | National service life confirmed (Awka, shirts, Aba fabric trips); 600–1,000 word gain possible |
| Ch.14 David Was Missing From the Wedding     | 3,753 | Saturated | No action (locked) | LOCKED | Formally and emotionally complete |
| Ch.15 Funke                                  |   930 | Controlled — grief hinge | Refined (masterpiece pass) | NEEDS SOURCE | Funke as living person before loss; one ordinary memory still needed |
| Ch.16 Fatherhood Began Outside               | 1,272 | Legally constrained, emotionally undersized | No expansion pass yet | CAN EXPAND | Sensory of door offered and refused; 500–800 word gain possible |
| Ch.17 What the System Sees                   | 3,032 | Saturated — legally constrained | No action (locked) | LOCKED | Legally complete; formally complete |
| Ch.18 Seven Years                            | 3,737 | Saturated | No action (locked) | LOCKED | Duration rendered through register; expansion would break the form |
| Ch.19 Damisi                                 | 3,376 | Saturated — child protection boundary | No action (locked) | LOCKED | Must not become evidence; must not become inventory |
| Ch.20 Love Does Not Fear                     | 3,283 | Saturated — theological restraint | No action (locked) | LOCKED | Expansion would push into sermon |
| Ch.21 Devotion                               | 2,893 | Near-saturated — recently expanded | No action (review only) | LOCKED | No structural gap identified; do not expand without confirmed need |
| Ch.22 Final Room                             |   847 | Controlled, underdeveloped | No expansion pass yet | CAN EXPAND | Sensory detail of room, table, ordinary closing moment; 300–600 word gain possible |

---

## Section 3: Market Target Reality

### Current Band

At 42,335 words, the manuscript is in the **40,000–45,000 band: commercially narrow**.

This is not market-ready, but it is no longer in crisis territory. The manuscript has a solid structural foundation. The band is commercially possible for short literary memoir, but most agents and editors expect 45,000–55,000 for confident submission. The gap to the credible floor is real and must be closed through source-led expansion, not padding.

### Gaps to Market Thresholds

| Target | Gap from Current |
| :----- | ---------------: |
| 45,000 (commercially narrow floor) | +2,665 |
| 50,000 (credible short memoir)     | +7,665 |
| 55,000 (strong agent/editor target)| +12,665 |

### Assessment

The manuscript is 2,665 words from 45,000 — achievable in a single focused expansion pass on 2–3 underbuilt chapters. The 50,000 target requires a more complete expansion pass across 6–8 chapters. The 55,000 target likely requires both expansion and 1–2 new structurally necessary chapters.

**The structural imbalance remains.** Parts One and Two (Ch.1–10) average 1,321 words per chapter. Part Four (Ch.17–22) averages 2,861 words per chapter. The ancestral and childhood foundation still carries less weight than the later chapters, though the imbalance is less severe than the initial audit suggested.

---

## Section 4: Existing-Chapter Expansion Capacity

### Priority Chapters

**Ch.2 — Isua to Agege (976 words)**
- Safe expansion potential: **Limited** — needs source
- Likely word gain if expanded: 600–1,400
- Source needed: One lived scene from the boolekaja or Osun-to-Lagos road; tailoring workspace physical detail; missionary encounter sensory texture
- Risk: Will not grow authentically without scene-level author memory

**Ch.3 — The Boy Who Was Already Old (1,327 words)**
- Safe expansion potential: **Yes**
- Likely word gain if expanded: 400–800
- Source needed: One specific domestic scene from early childhood (meal, morning, errand); the moment Iyalode's doubt was visible in her body
- Risk: Must not become abstraction about abstraction; needs a scene-anchor

**Ch.5 — Jumoke (1,380 words)**
- Safe expansion potential: **Yes**
- Likely word gain if expanded: 400–600
- Source needed: One ordinary memory of Jumoke alive — a game, a phrase, a morning
- Risk: Must not tip into elegy; must stay in the child's ordinary life before the kitchen

**Ch.7 — The Name That Had to Be Powerful (1,185 words)**
- Safe expansion potential: **Yes**
- Likely word gain if expanded: 500–800
- Source needed: The room where Iyalode said the sentence; who else was present; quality of her voice
- Risk: Chapter must not become theological essay; Iyalode must remain a person not a symbol

**Ch.8 — The Spiritual Covering (1,107 words)**
- Safe expansion potential: **Limited** — needs source
- Likely word gain if expanded: 500–1,000
- Source needed: Iyalode in daily life — one physical ordinary detail; something she said that was not about faith
- Note: Chapter was refined (masterpiece pass) — expansion must add the character's physical presence, not re-expand what was deliberately cut

**Ch.9 — The Boy Who Became a Father at Fifteen (1,111 words)**
- Safe expansion potential: **Limited** — needs source
- Likely word gain if expanded: 500–1,000
- Source needed: One scene of David Senior with siblings, specific labour (farm, home-work), one instance where keeping promises felt impossible
- Note: Same structural note as Ch.8 — the refinement pass compressed this; restore character weight, not cut prose

**Ch.10 — Leaving Lagos (1,660 words)**
- Safe expansion potential: **Yes**
- Likely word gain if expanded: 300–500
- Source needed: Heathrow arrival sensory detail; the specific texture of the post-burial period before the Facebook chapter
- Note: Chapter was at 1,919 words at ce312cbfa, then compressed to 1,660 by 80bbd9679. Partial restoration is possible if source confirms the compressed material.

**Ch.11 — A Post on Facebook (858 words)**
- Safe expansion potential: **Yes**
- Likely word gain if expanded: 400–600
- Source needed: Texture of the Facebook post itself (not the wording — the act); the specific quality of the reply that stopped him
- Risk: Must not name her; must not foreshadow what follows

**Ch.13 — Serena (896 words)**
- Safe expansion potential: **Yes**
- Likely word gain if expanded: 600–1,000
- Source needed: National service ordinary life scene (walking, Aba fabric trips, selling shirts); one near-death experience at scene level
- Risk: Spiritual overclaiming; must not draw the line from Awka to London explicitly

**Ch.15 — Funke (930 words)**
- Safe expansion potential: **Limited** — needs source
- Likely word gain if expanded: 500–1,000
- Source needed: One ordinary memory of Funke alive — her voice, her humour, a specific phrase; the moment Abraham learned she had died
- Risk: Grief spectacle; must not duplicate Ch.14 register; must not become accusation

**Ch.16 — Fatherhood Began Outside (1,272 words)**
- Safe expansion potential: **Yes**
- Likely word gain if expanded: 500–800
- Source needed: Sensory of door offered and refused; emotional texture of staying; one specific detail from that domestic space
- Risk: Must not tip into legal framing; must stay in sensory and domestic register

**Ch.22 — Final Room (847 words)**
- Safe expansion potential: **Yes**
- Likely word gain if expanded: 300–600
- Source needed: Who was at the table; what was the food; one specific sensory detail from the room
- Risk: Triumphalism; earned-peace speech; must remain domestic not grand

### Chapters Not Assessed for Expansion

**Ch.1 — Hounslow Call (1,184 words)**
- Safe expansion potential: **Yes** — 400–800 words possible
- Currently controlled and functional; lower priority than the above

---

## Section 5: New Chapter Inevitability Test

**The eight tests for whether a new chapter is structurally necessary:**

1. Carries a missing life-stage, room, relationship, or decision not currently embodied
2. Cannot be absorbed into an existing chapter without weakening it
3. Has source strong enough to stand as a chapter
4. Advances emotional/spiritual/legal/legacy architecture
5. Does not create chronology confusion
6. Does not reopen protected material
7. Has a real chapter question
8. Would still deserve to exist if word count were already sufficient

**Verdict: New chapters are not structurally inevitable at this stage.**

At 42,335 words, the manuscript is closer to a workable base than the initial audit suggested. The 22-chapter architecture covers all major life-stages: ancestral lineage (Ch.2–3) → childhood marking (Ch.5–9) → departure and formation (Ch.10–12) → loss and marriage (Ch.11–15) → fatherhood under constraint (Ch.16–20) → legacy and reckoning (Ch.21–22).

The gap to 50,000 (7,665 words) is entirely closable through source-led expansion of existing chapters. New chapters should only enter consideration if the full expansion pass of existing chapters cannot reach 48,000 words.

**However**, Candidate B (Business/Refinery chapter after Ch.10) passes all 8 structural tests and should be kept in view as a near-ready candidate if word count requires it.

---

## Section 6: Candidate New-Chapter Map

Only chapters that pass 6 or more of the 8 structural tests are included. All are provisional — none should be written until the expansion pass of existing chapters has been completed and a new word-count baseline established.

---

### Candidate A — Lagos Agege Formation Chapter
**Working title:** The House at Agege / The Household Before the Name
**Placement:** After Ch.3 (before Ch.4)
**Chapter question:** What was the ordinary life of the household Abraham grew up inside — the meals, the street, the school, the father's presence as weather rather than event — before the first pressure arrived?
**Source required:** Author memory of the specific house at Agege — rooms, street, food, school journey, ordinary daily routine as a child; father's manner at home; Iyalode's annual arrival as event
**Why cannot be absorbed elsewhere:** Ch.3 is the naming chapter; it cannot simultaneously become the childhood-texture chapter without losing its focus. There is currently no chapter that gives the reader a continuous domestic room in Abraham's early childhood.
**Estimated word count:** 1,200–2,000
**Risk:** Could duplicate tone of Ch.3 if not tightly scoped; source must be specific enough to stay in scene not summary
**Tests passed:** 1, 2, 3, 4, 5, 6, 7 — FAILS test 8 (at 50,000+ words the book does not structurally require this chapter; it would add texture but not function)
**Assessment: CONDITIONAL candidate.** Worth commissioning only if the expansion pass leaves the manuscript below 47,000 words.

---

### Candidate B — Business/Refinery Chapter
**Working title:** The Deal Before the Deal / After the MBA
**Placement:** After Ch.10 (before Ch.11)
**Chapter question:** What was the specific shape of the professional ambition and the refinery project Abraham returned to Nigeria to pursue — and what was it like to move through business risk alongside the grief of his father's death?
**Source required:** Author memory of the refinery project, the people involved, the specific rooms and conversations of that season; the texture of working in Nigeria with an MBA behind him and a father in the ground
**Why cannot be absorbed elsewhere:** Ch.10 already carries departure, provision arc, and father's death. Ch.11 begins the Facebook post. The professional/business season that ran alongside grief is currently absent from the architecture.
**Estimated word count:** 1,500–2,500
**Risk:** Could become a business-memoir chapter that dilutes the emotional register; must stay grounded in what the ambition cost rather than what it aimed at; legally check any refinery-partner details before including
**Tests passed:** 1, 2, 3, 4, 5, 6, 7, 8 — PASSES all 8 tests
**Assessment: STRONG candidate** if source material is confirmed available.

---

### Candidate C — Short Interlude: The Night Before the Wedding
**Assessment: NOT recommended as a separate chapter.** The 4am material belongs inside Ch.12's architecture. Separating it would fragment the chapter's logic. Not revisited.

---

### Candidate D — Domestic Marriage Chapter (legally-safe period only)
**Working title:** The First Year / Inside the Ordinary
**Placement:** Between Ch.12 and Ch.13
**Chapter question:** What did the daily texture of early marriage feel like — before the legal processes — and what did Abraham do with the hope that was still present?
**Source required:** Author memory of the early domestic period; specific scenes from the first months that are not legally sensitive
**Why cannot be absorbed elsewhere:** Ch.12 ends at the wedding; Ch.13 is the Serena chapter from national service; no chapter currently renders early marriage as lived experience before the collapse
**Estimated word count:** 1,200–2,000
**Risk:** HIGH. Any domestic material from this period sits adjacent to legally sensitive territory. Author must confirm what is safe. This chapter requires legal review before writing.
**Tests passed:** 1, 3, 4, 5, 7, 8 — FAILS test 6 (may reopen protected material)
**Assessment: HIGH-RISK candidate.** Not recommended unless author and legal advisor confirm specific scenes are fully safe.

---

## Section 7: Three Volume Strategies

### Option A — No New Chapters

**Method:** Source-led expansion of the 5 NEEDS SOURCE chapters (Ch.2, 8, 9, 15, plus Ch.5 with lighter source need) plus expansion of the 8 CAN EXPAND chapters (Ch.3, 7, 10, 11, 13, 16, 22, and Ch.1).

| Chapter | Current | Conservative Add | Full Add |
| :------ | ------: | ---------------: | -------: |
| Ch.2  |   976 | 600   | 1,200 |
| Ch.3  | 1,327 | 300   |   700 |
| Ch.5  | 1,380 | 400   |   600 |
| Ch.7  | 1,185 | 300   |   700 |
| Ch.8  | 1,107 | 500   | 1,000 |
| Ch.9  | 1,111 | 500   | 1,000 |
| Ch.10 | 1,660 | 200   |   400 |
| Ch.11 |   858 | 400   |   600 |
| Ch.13 |   896 | 400   |   800 |
| Ch.15 |   930 | 400   |   800 |
| Ch.16 | 1,272 | 400   |   700 |
| Ch.22 |   847 | 300   |   500 |
| Ch.1  | 1,184 | 300   |   600 |
| **Total adds** | — | **5,000** | **9,600** |

**Expected final word count (conservative):** ~47,300
**Expected final word count (full source):** ~52,000
**Risk:** Lower bound depends entirely on author supplying scene-level memory for the 5 NEEDS SOURCE chapters. If source arrives at minimum quality for all, the manuscript will reach 46,000–48,000. If source arrives at full scene quality, 50,000–52,000 is achievable without new chapters.

---

### Option B — Limited New Chapters (1–2)

**Recommended new chapters:** Candidate B (Business/Refinery, ~2,000 words) only; Candidate A (Agege Formation, ~1,500 words) only if expansion pass falls short of 47,000.

| Source | Conservative | Full |
| :----- | -----------: | ---: |
| Option A expansion | +5,000 | +9,600 |
| Candidate B (Business/Refinery) | +1,500 | +2,500 |
| Candidate A (Agege Formation, if needed) | +1,000 | +2,000 |
| **Total adds** | **+7,500** | **+14,100** |

**Expected final word count (conservative):** ~49,800
**Expected final word count (full):** ~56,400
**Risk:** Candidate B requires confirmed source availability at scene level. Risk is manageable if held to the same prose standard as the existing material.

---

### Option C — Full Architecture Expansion

**Method:** All Option A expansion + Candidates A and B + reassessment of Ch.16 and Ch.22 for deeper development + consideration of Candidate D (Domestic) if legally confirmed safe.

**Expected final word count:** 56,000–62,000
**Risk:** HIGH. Adding Candidate D requires legal clearance and risks contaminating the manuscript with material that could be read as adversarial. Option C should not be pursued as a first step. It is a fallback if Option A + partial Option B does not reach 50,000 words.

---

## Section 8: Recommendation

### Summary Recommendation

**Target final word count: 50,000–55,000 words**

The manuscript at 42,335 words is in the commercially narrow band. It needs 7,665 words to reach the credible short memoir floor (50,000). The recommended path is **Option A first, then Option B evaluation**.

---

### Whether New Chapters Are Needed

**Not yet. Not until the expansion pass is complete.**

New chapters should only be considered if:
1. The expansion pass of all existing chapters is complete
2. A new word-count baseline is established
3. That baseline is below 48,000 words

If the baseline after expansion is 48,000–50,000, Candidate B (Business/Refinery chapter after Ch.10) should be assessed. If it is 50,000+, no new chapters are needed.

---

### How Many New Chapters May Eventually Be Needed

**0–2.**

- If existing-chapter expansion reaches 50,000: zero new chapters.
- If existing-chapter expansion reaches 48,000–50,000: one new chapter (Candidate B — Business/Refinery).
- If existing-chapter expansion reaches below 48,000: two new chapters (Candidates A and B).
- Candidate D (Domestic Marriage) is not recommended unless author and legal advisor confirm safety.

---

### Where (Placement)

If new chapters are added:
- Candidate B — after Ch.10, before Ch.11 (the professional/ambition season between MBA return and the Facebook post)
- Candidate A — after Ch.3, before Ch.4 (the domestic childhood texture before the first legal pressure)

---

### Which Existing Chapters Still Need Source-Led Work

In priority order:

1. **Ch.8 — The Spiritual Covering** (1,107 words): Iyalode as person. Physical presence, daily life, voice. Gap of up to 1,000 words.
2. **Ch.9 — Father at Fifteen** (1,111 words): David Senior origin. Labour, siblings, promise-keeping. Gap of up to 1,000 words.
3. **Ch.2 — Isua to Agege** (976 words): Founding chapter. Boolekaja, road, tailoring, Lagos arrival. Gap of up to 1,200 words.
4. **Ch.15 — Funke** (930 words): Grief hinge. Funke as living person. Gap of up to 1,000 words.
5. **Ch.5 — Jumoke** (1,380 words): First death. Jumoke as living child. Gap of up to 600 words.

Secondary expansion (source available or author-confirmed, lighter lift):
- Ch.3, Ch.7, Ch.10, Ch.11, Ch.13, Ch.16, Ch.22 — all CAN EXPAND without blocking source questions

---

### Which Chapters Are Now Locked

The following chapters must not be expanded, modified, or restructured without a specific identified structural gap:

| Chapter | Reason |
| :------ | :----- |
| Ch.4  — A Hearing Date       | Brevity is the form; legally constrained |
| Ch.6  — The Fire and the Deal| Fully rendered; any addition is invention |
| Ch.12 — Married by December  | Longest chapter; legally sensitive; complete |
| Ch.14 — David Was Missing    | Formally and emotionally complete |
| Ch.17 — What the System Sees | Legally constrained; formally complete |
| Ch.18 — Seven Years          | Duration rendered through register; adding would break the form |
| Ch.19 — Damisi               | Child-protection boundary; must not become evidence |
| Ch.20 — Love Does Not Fear   | Theological restraint; expansion pushes toward sermon |
| Ch.21 — Devotion             | Near-saturated; review only if structural gap identified |

---

### Next Operational Step

**Step 1 — Author source session (priority 5 chapters):**
Conduct a structured source session with the author targeting the exact questions listed in `19-expansion-source-capture-plan.md` for Ch.2, Ch.8, Ch.9, Ch.15, and Ch.5. This session produces the scene-level memory that unlocks expansion of the highest-value underbuilt chapters.

**Step 2 — Expansion pass (priority chapters, then secondary):**
Using source material from Step 1, expand each chapter. Apply masterpiece-pressure standard — each chapter must become stronger, not merely longer. Do not expand toward a word-count target; expand toward necessity.

**Step 3 — New word-count baseline:**
After expansion pass, strip-count prose again using the corrected methodology documented in this report. Establish new total.

**Step 4 — Decision gate:**
- If new total ≥ 50,000: secondary expansion pass on Ch.3, 7, 10, 11, 13, 16, 22 only. No new chapters.
- If new total 48,000–50,000: assess Candidate B (Business/Refinery). Commission only if source confirmed.
- If new total < 48,000: assess both Candidates A and B.

**Step 5 — Final volume audit:**
After all expansion and any new-chapter additions, run a final audit comparing structure, pacing, and part-level balance. Parts One and Two (Ch.1–10) must reach at least 30% of total manuscript volume before submission.

---

*This report supersedes the initial version committed as `93c9cad87`. Corrected prose-only word counts from individual draft files under `content/source-material/fathering-without-fear/drafts/`, counted on 2026-06-24. Counting script bug (toggle-based `---` parser stripping internal section dividers) was identified and corrected. All word-count figures are automated counts subject to ±50 word counting-methodology variance per chapter. The architectural assessments reflect the current state of the manuscript and supersede the expansion estimates in files 18 and 19 where they conflict.*
