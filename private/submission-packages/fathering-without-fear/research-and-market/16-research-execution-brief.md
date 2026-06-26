> **Historical / superseded note:** This document reflects an earlier manuscript state before the 23-chapter, 45,008-word baseline. Do not use its 22-chapter or 38k references as current manuscript facts. Current baseline: 24 chapters, 46,835 prose-only words. Ch.6 "A Year Without Home" integrated, Ch.20 "The Version in His Head" restored..

# Research Execution Brief — Comp Titles and Agent Targeting

## Purpose

This brief instructs the next research pass. Use fresh web research only. Cite all sources. Do not use stale data, guessed comps, or unverified agent information.

## Scope

Two parallel research tracks:

1. **Comp titles** — Identify 3–5 verifiable commercially published titles comparable to *Fathering Without Fear*
2. **Agent targets** — Identify literary agents currently open to queries who are a strong fit

## Comp Title Research Instructions

### Method

For each comp title candidate:

1. Search publisher catalogues, literary awards shortlists, agent wish-lists, and reputable book review sources
2. Verify: title, author, publisher, publication year, word count, form (memoir or literary nonfiction)
3. Read sample pages or professional reviews to confirm thematic and formal fit
4. Record source URL and date checked
5. Assess fit against the criteria below
6. Enter into `14-comp-title-research-table.csv`

### Criteria

| Requirement | Detail |
|---|---|
| Genre | Literary memoir or formally compressed literary nonfiction |
| Form | Short chapters, fragmentary or compressed structure (under 50,000 words preferred) |
| Themes | Fatherhood, family, inheritance, grief, faith, institutional pressure, migration, cross-cultural identity |
| Publication window | 2011–2026 |
| Publisher | Major trade publisher or respected independent press |
| Exclusions | Not celebrity memoir, not self-help, not devotional/religious genre, not legal exposé, not prescriptive parenting |
| Faith handling | Faith may be present as lived experience or family inheritance, but must not be categorised as Christian/inspirational genre |
| Cultural context | Nigerian/British diaspora or cross-cultural family narrative preferred but not required |

### Categories to Research

1. **Nigerian/British diaspora literary memoir** — A formally compressed memoir by a Nigerian or Nigerian-British author dealing with family, inheritance, grief, or faith
2. **Fatherhood / family literary memoir (short form)** — A short literary memoir (under 50,000 words) about fatherhood, family, or parenting under pressure
3. **Compressed / fragmentary literary memoir** — A memoir using short chapters, fragments, or compression as a formal strategy
4. **Faith-inflected literary nonfiction (non-devotional)** — A literary work where faith is present as lived experience or family inheritance without being categorised as Christian/inspirational genre
5. **Institutional pressure / family law literary memoir** — A literary memoir dealing with family court, supervised contact, or institutional pressure without becoming a legal exposé

### Prohibitions

- Do not invent comp titles
- Do not use comp titles from aggregated "books like X" lists without independent verification
- Do not use comp titles where only the theme matches but the form does not (e.g., a 90,000-word linear memoir is not comparable to a 38,000-word compressed one)
- Do not use comp titles from a different genre (e.g., self-help, devotional, parenting advice)

## Agent Research Instructions

### Method

For each potential agent:

1. Visit the agency's current website or verified submission portal
2. Confirm the agent is currently active and accepting queries
3. Confirm the agent represents memoir / literary nonfiction
4. Review the agent's manuscript wish-list or recent deals for fit indicators
5. Review submission guidelines for required materials
6. Record source URL and date checked
7. Score against rubric
8. Assign priority
9. Enter into `15-agent-research-table.csv`

### Scoring Rubric

| Criterion | Score (0–5) |
|---|---|
| Literary memoir fit | Does the agent actively represent literary memoir? |
| Compressed/formal nonfiction openness | Is the agent open to short or fragmentary nonfiction? |
| International/Nigerian/British context fit | Does the agent represent diaspora or cross-cultural narratives? |
| Faith-inflected but non-devotional tolerance | Can the agent position faith as lived experience without requiring devotional genre? |
| Fatherhood/family/grief/inheritance interest | Does the agent represent books on these themes? |
| Submission openness/current status | Is the agent currently open to queries? |

### Priority Guidelines

| Priority | Criteria |
|---|---|
| **A** | Score ≥ 20, no criterion below 3. Query first. |
| **B** | Score 15–19, or strong in most areas with one weakness. Query after A list. |
| **C** | Score 10–14, or marginal fit. Query only if A/B exhausted. |
| **Reject** | Score < 10, or any disqualifying factor. |

### Disqualifying Factors

Reject immediately if the agent:

- Represents only celebrity memoir or platform-driven nonfiction
- Requires a large social media following or established public profile
- Specialises exclusively in trauma memoir or "survivor narrative"
- Seeks prescriptive parenting or self-help nonfiction
- Would position the book as legal exposé or campaign journalism
- Is uncomfortable with faith as a presence in literary nonfiction
- Would require the manuscript to be expanded to 60,000+ words before submission
- Is not currently open to queries
- Has no track record in literary memoir or literary nonfiction

### Sources

- Agency websites (verified, not aggregated directories)
- Publishers Marketplace deals database
- Literary agency submission guidelines pages
- Manuscript wish-list posts (Twitter/X, Bluesky, agency blogs)
- Recent (within 12 months) interviews with agents about what they're seeking
- Author acknowledgements in similar memoirs (who represented the author)

## Output Requirements

### Comp Titles

Populate `14-comp-title-research-table.csv` with 3–5 verified entries. Each entry must include:

- Title, author, publisher, publication year
- Category (which of the five categories it fits)
- Why it is comparable (specific formal or thematic reasons)
- Why it is not comparable (honest limitations)
- Word count if available
- Source URL and date checked
- Confidence rating (High/Medium/Low)

### Agent Targets

Populate `15-agent-research-table.csv` with verified entries. Each entry must include:

- Agent name and agency
- Country
- Currently active (Yes/No/Unknown)
- Represents memoir (Yes/No/Unknown)
- Represents literary nonfiction (Yes/No/Unknown)
- Faith-inflected fit score (0–5)
- International context fit score (0–5)
- Fatherhood/family/grief fit score (0–5)
- Submission open (Yes/No/Unknown)
- Submission requirements (summary)
- Recent relevant sales or clients
- Source URL and date checked
- Total score
- Priority (A/B/C/Reject)
- Notes

## Important

- Do not contact any agent
- Do not submit the manuscript
- Do not use AI-generated agent recommendations without verification
- Every entry must have a verifiable source URL and date checked
- If information cannot be verified, mark as Unknown and note why
