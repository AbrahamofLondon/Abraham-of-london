# Abraham of London Editorial House Style

This standard governs Abraham of London editorial prose, including Editorials and Editorial Series. It protects consistency without flattening literary voice.

## Language Standard

British English / UK English is the default for editorial prose.

US spelling is not used in editorial prose unless the term is part of quoted material, a proper noun, an official source title, a technical protocol, or an external product name. Keep code, API names, package names, URLs, slugs, filenames, environment variables, and imported identifiers in their canonical form.

## Core Spelling Table

| Preferred editorial form | US or review form |
| --- | --- |
| civilisation | civilization |
| organisation | organization |
| behaviour | behavior |
| labour | labor |
| colour | color |
| favour | favor |
| honour | honor |
| centre | center |
| theatre | theater |
| defence | defense |
| licence, for the noun | license, where used as the US noun |
| practise, for the verb | practice, where used as the US verb |
| judgement | judgment |
| programme | program, outside computing or official names |
| travelled | traveled |
| modelling | modeling |
| fulfil | fulfill |
| ageing | aging |
| analyse | analyze |
| catalyse | catalyze |
| emphasise | emphasize |
| recognise | recognize |
| authorise | authorize |
| authorised | authorized |

Use judgement on context-sensitive pairs:

- `licence` is the UK noun. `license` can remain where it is the verb, an official title, a filename, or a technical term.
- `practice` is the UK noun. `practise` is the UK verb.
- `programme` is preferred for editorial prose about initiatives or broadcasts. `program` remains correct for software, code, or an official name.

## Allowed Exceptions

Do not normalise these into house spelling:

- OAuth authorization URL
- API authorization header
- HTTP header names
- Official LinkedIn, Stripe, Netlify, and Cloudflare terminology
- Quoted text
- Official titles
- Filenames and slugs
- Code identifiers
- Environment variables
- Imported package names

When an exception appears inside editorial prose, preserve it only as far as the source or technical meaning requires.

## Tone Standard

Editorial writing should be:

- Literary but clear
- Serious but not inflated
- Precise over decorative
- Morally grounded without sermonising
- Restrained, not promotional
- Intellectually confident, not theatrical

Avoid:

- Marketing slogans inside editorial prose
- Excessive abstractions
- Americanised corporate filler
- "Thought leadership" language
- AI or technology hype unless being critically examined
- Overuse of `doctrine`, `sovereign`, `infrastructure`, or `authority` where ordinary language is stronger

## Product And Editorial Separation

Editorials are not sales pages.

Product pages may reference the intellectual record, but editorial prose must not become product copy. Do not interrupt editorial pieces with conversion CTAs beyond quiet navigation that serves the reading sequence.

## Series Consistency Rules

For Editorial Series:

- Use `Part One`, `Part Two`, and the corresponding worded sequence labels.
- Use `Editorial Series`, not `blog series`.
- Keep metadata format consistent across parts.
- Keep the author line consistent: `Abraham of London`.
- Preserve sequence navigation.
- Preserve literary rhythm where intentional.

## Editorial Style Checks

Run the report-mode checker before editing serial work:

```powershell
pnpm editorial:style
```

Use strict mode when a release should fail on flagged spelling risks:

```powershell
pnpm editorial:style:strict
```

The checker is a guardrail, not an editor. It scans editorial MDX for common US spellings, reports file paths and line numbers, and deliberately ignores code fences, inline code, URLs, and frontmatter keys. Review each finding in context before changing prose.
