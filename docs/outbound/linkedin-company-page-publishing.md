# LinkedIn Company Page Publishing

## Purpose

The governed LinkedIn outbound console is intended to publish approved Abraham of London outbound assets as the Abraham of London LinkedIn Company Page.

Member-profile publishing remains available only as an explicit fallback path. The system must not silently publish as an individual profile when the intended target is the company page.

## Publishing Targets

### Company Page

- Owner type: `organization`
- Owner URN format: `urn:li:organization:{id}`
- Intended page: Abraham of London
- Required write scope: `w_organization_social`
- Optional read/verification scope: `r_organization_social`

### Member Profile Fallback

- Owner type: `member`
- Owner URN format: `urn:li:person:{id}`
- Required write scope: `w_member_social`
- Fallback use requires explicit operator confirmation and must be visible in the admin console.

## Required LinkedIn Conditions

Company-page publishing requires all of the following:

1. The LinkedIn app has the required organisation posting product/scope approved.
2. The authenticated user has the required Page admin role.
3. `LINKEDIN_ORGANIZATION_URN` is configured or successfully discovered through an approved LinkedIn organisation API.
4. The OAuth token includes `w_organization_social`.
5. The outbound post passes the governed publishing gate.

If LinkedIn returns a permission or scope error, the admin console should show a safe message explaining that the LinkedIn app may not yet have organisation publishing approval or the authenticated account may not have the required Page role.

## Environment Checklist

```env
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=
LINKEDIN_TOKEN_ENCRYPTION_KEY=
LINKEDIN_OAUTH_SCOPES=openid profile w_member_social w_organization_social r_organization_social
LINKEDIN_DEFAULT_OWNER_TYPE=organization
LINKEDIN_ORGANIZATION_URN=
LINKEDIN_PUBLISHING_ENABLED=true
```

Do not commit real LinkedIn credentials or token values. `LINKEDIN_ORGANIZATION_URN` may remain empty until the page URN is confirmed.

## Governance Rules

- Draft outbound assets cannot be published.
- Report-gated outbound assets cannot be published while the linked report lifecycle blocks release.
- GMI-Q2-2026 outbound content remains blocked while GMI-Q2-2026 is draft.
- Tokens must be encrypted at rest and never rendered to the browser.
- Provider raw errors must be normalised before being returned to the admin console.
- The production server must not mutate MDX files or git state after a successful LinkedIn post.

## After Manual Posting Verification

After a successful company-page post, record the returned safe metadata operationally:

- `status: posted`
- `postedAt: <ISO timestamp>`
- `linkedinUrl: <LinkedIn post URL>`

The v1 production server does not write these values back to source files.
