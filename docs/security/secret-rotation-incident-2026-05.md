# GitHub OAuth Secret Rotation Incident - May 2026

Status: credential rotation completed; deployment and history follow-up pending
Date opened: 2026-05-20
Last updated: 2026-05-20

## Exposure Source

A third-party notification reported a hardcoded GitHub OAuth client secret in public repository history.

- Repository: `AbrahamofLondon/Abraham-of-london`
- Historical commit: `5092022a734c35af2efc5cda108a763f6f6b1404`
- Historical path: `.env.production`
- Reported secret type: GitHub OAuth 2.0 client secret

No secret value is recorded in this document.

## Affected Secret Class

The application supports GitHub OAuth through the following environment variable names:

- Client ID: `GITHUB_ID`, `GITHUB_CLIENT_ID`, `AUTH_GITHUB_ID`
- Client secret: `GITHUB_SECRET`, `GITHUB_CLIENT_SECRET`, `AUTH_GITHUB_SECRET`

Treat any GitHub OAuth client secret that was present in the historical `.env.production` file as exposed.

## Required Rotation

| Action | Status | Evidence boundary |
|---|---|---|
| Rotate the GitHub OAuth client secret in GitHub Developer settings | Completed | Client confirmed rotation on 2026-05-20 |
| Revoke or delete the old exposed secret | Pending confirmation | Do not mark completed until explicit confirmation is received |
| Update the production Netlify environment variable with the new secret | Pending confirmation | Do not mark completed until explicit confirmation is received |
| Confirm the corresponding GitHub OAuth client ID remains correct | Pending confirmation | Verify during auth smoke test |
| Redeploy Netlify so the new environment value is loaded | Pending confirmation | Required after Netlify env update |
| Test GitHub auth/login end to end after redeploy | Pending confirmation | Required after redeploy |

Rotation neutralises the exposed credential. Public Git history may still contain the old revoked value until history rewrite is performed.

## Repository Hygiene Applied

- Current `.env.production` is not present in the working tree.
- Current `.env.production` is not tracked in the index.
- `.gitignore` blocks `.env` and `.env.*` while allowing `.env.example`, `.env.schema`, and `.env.local.example`.
- `.env.example` must contain placeholders only.
- Secret scanning must not print secret values if a future finding occurs.

## History Rewrite Recommendation

The historical `.env.production` file should be removed from repository history after credential rotation is complete.

Recommended tools:

- `git-filter-repo`
- BFG Repo-Cleaner

History rewriting should be scheduled separately because it rewrites commit SHAs and requires coordination with every clone, deployment integration, and protected branch workflow.

## Non-Repo Manual Actions

These actions must be performed outside the repository:

1. Open GitHub Developer settings directly.
2. Rotate the GitHub OAuth client secret.
3. Update Netlify environment variables directly.
4. Redeploy Netlify.
5. Verify GitHub auth/login.
6. Approve and coordinate history rewriting.

## Claim Boundary

This document records containment and required rotation steps. It asserts only that the GitHub OAuth client secret rotation has been confirmed by the client. It does not assert that Netlify has been updated, the old exposed secret has been separately revoked or deleted, GitHub auth has been retested, or the historical `.env.production` value has been removed from repository history.
