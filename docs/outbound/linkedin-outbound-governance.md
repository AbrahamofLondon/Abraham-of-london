# LinkedIn Outbound Governance

LinkedIn posts live in `content/outbound/linkedin/`. Published historical posts may be moved to `content/outbound/linkedin/posted/`.

## Statuses

- `draft`: not publishable and may still depend on lifecycle or claim review.
- `ready`: approved for release only when `published: true` or an explicit release flag is present.
- `published`: released in the outbound system but not necessarily confirmed as posted on LinkedIn.
- `posted`: manually posted on LinkedIn; add `postedAt` or `linkedinUrl` where available.
- `retired`: removed from active outbound use.

## Required Frontmatter

Each governed LinkedIn asset must include `title`, `sequence` where applicable, `channel: linkedin`, `contentType`, `status`, `draft`, `published`, `date`, `category: Outbound`, `tier`, `claimRisk`, and `tags`.

Optional governance fields include `campaign`, `productLine`, `linkedProduct`, `linkedReportId`, `publicationGate`, `notBefore`, `postedAt`, `canonicalUrl`, `linkedinUrl`, and `requiresLifecycleCheck`.

## Release Rules

- `draft: true` cannot also have `published: true`.
- `status: draft` is never publishable.
- `status: ready` is publishable only when release is explicit.
- Sequence numbers cannot duplicate within the same campaign.
- Sequence gaps warn, but do not fail, unless a campaign is later made strict.
- Posted content should include `postedAt` or `linkedinUrl` when available.

## Claim Safety

LinkedIn outbound copy must not claim guaranteed outcomes, predictive certainty, or unsupported market prediction capability. The phrase "AI predicts markets" is explicitly blocked.

`claimRisk: HIGH` requires a `publicationGate` or `manualApprovalNote`.

## GMI And Report-Gated Rules

Outbound assets linked to reports must use `linkedReportId` and `requiresLifecycleCheck: true`.

GMI-Q2-2026 content must remain `draft: true`, `published: false`, and `status: draft` while the lifecycle registry says the report is `DRAFT`. No post may say the Q2 report is available until the lifecycle registry and public report surface are updated.

## Readiness Check

Run:

```bash
pnpm outbound:linkedin:check
```

The check reports total posts, draft, ready, published, posted, blocked, warnings, and errors. Hard errors fail the command.

## After Manual Posting

After a post is manually published on LinkedIn, move it to `content/outbound/linkedin/posted/` or update its `status` to `posted`, then add `postedAt` or `linkedinUrl` where available.
