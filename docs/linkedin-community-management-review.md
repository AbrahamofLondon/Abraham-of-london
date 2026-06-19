# LinkedIn Community Management Review Workflow

## Route

Reviewer route:

`/integrations/linkedin/review`

Suggested production URL:

`https://www.abrahamoflondon.org/integrations/linkedin/review`

## Reviewer Account

Email:

`linkedin-reviewer@abrahamoflondon.org`

Configure the password through `LINKEDIN_REVIEWER_PASSWORD_HASH`. Do not store or commit the plain temporary password.

Generate a temporary password hash:

```bash
pnpm exec tsx -e "import { hashPassword } from './lib/auth/password'; hashPassword('temporary-password').then(console.log)"
```

## Environment

Required review workflow variables:

```bash
LINKEDIN_REVIEWER_EMAIL=linkedin-reviewer@abrahamoflondon.org
LINKEDIN_REVIEWER_PASSWORD_HASH=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_TOKEN_ENCRYPTION_KEY=
LINKEDIN_REVIEW_MODE=true
LINKEDIN_REVIEW_REDIRECT_URI=https://www.abrahamoflondon.org/api/integrations/linkedin/callback
LINKEDIN_REVIEW_SCOPES="openid profile email r_organization_admin r_organization_social w_organization_social"
LINKEDIN_REVIEW_LIVE_PUBLISHING=false
```

Set `LINKEDIN_REVIEW_LIVE_PUBLISHING=true` only when Standard Tier approval and organisation Page permission are confirmed.

## LinkedIn Form Text

Product URL:

`https://www.abrahamoflondon.org/integrations/linkedin/review`

Test login:

Username: `linkedin-reviewer@abrahamoflondon.org`

Password: temporary password configured by the owner

Reviewer instructions:

Please log in using the reviewer account and open the LinkedIn Community Management Review workflow. The reviewer workspace demonstrates Abraham of London’s Page Management and Page Analytics use cases: authorised LinkedIn page connection, approved content preparation, page selection, publishing approval, publishing/dry-run handling, analytics review, disconnect, data deletion, and audit trail. The reviewer account is restricted to this workspace and does not expose private customer data, billing, owner settings, or administrative controls.

## Screen Recording Checklist

1. Open Abraham of London.
2. Log in as `linkedin-reviewer@abrahamoflondon.org`.
3. Open `/integrations/linkedin/review`.
4. Show product purpose and selected use cases.
5. Show LinkedIn connection status.
6. Start or show LinkedIn OAuth connection.
7. Show selected LinkedIn organisation page status.
8. Open and edit “The Cost of Slow Decisions”.
9. Approve the post using the checkbox and approval button.
10. Publish or show clearly labelled API Review Dry Run.
11. Open analytics and refresh metrics status.
12. Open privacy controls.
13. Show disconnect and delete-data controls.
14. Show the audit trail.
15. Show that the reviewer cannot access `/admin`.

Do not show environment variables, API keys, tokens, passwords, private customer records, or unrelated admin screens.
