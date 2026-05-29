# Foundry CI Gate Integration

The Foundry CI gate is a pre-deployment check that blocks releases when governance findings
exceed the configured severity threshold. It runs against the Foundry API, receives a structured
findings payload, and exits non-zero on any unresolved `CRITICAL` finding.

---

## How the gate works

1. Your CI pipeline calls the `/api/foundry/gate` endpoint with a release descriptor
2. The Foundry evaluates the current governance state for that release identifier
3. If any unresolved `CRITICAL` finding exists, the API returns `"blocked": true` and exits
4. Your pipeline receives a non-zero exit code — the deployment step does not run
5. The finding payload is printed to the CI log so the operator can act without leaving the terminal

The gate does not run AI inference at call time. It reads the most recent ResearchRun findings
for the given `releaseId`. Governance must be run upstream (typically via the Foundry admin panel
or the API) before the CI gate produces a meaningful result.

---

## Failure message format

When the gate blocks a release, it writes a structured failure message to stdout:

```
FOUNDRY GATE — BLOCKED
Release:  your-release-id
Findings: 2 CRITICAL, 1 HIGH
Reason:   Unresolved critical findings must be closed before deployment.

CRITICAL  Route exposure gap: /api/admin/users — no auth check detected
CRITICAL  Missing rollback path: no rollback procedure documented for this release
HIGH      Evidence adequacy: claim "reduces decision time by 40%" has no linked evidence run

Next step: Resolve findings at https://your-domain/admin/intelligence-foundry/runs
           or contact your Foundry operator to clear the block.
```

The gate exits 0 (pass) only when there are zero unresolved CRITICAL findings.
HIGH findings produce a warning line but do not block.

---

## GitHub Actions

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

jobs:
  foundry-gate:
    name: Foundry governance gate
    runs-on: ubuntu-latest
    steps:
      - name: Check Foundry gate
        env:
          FOUNDRY_API_URL: ${{ secrets.FOUNDRY_API_URL }}
          FOUNDRY_API_KEY: ${{ secrets.FOUNDRY_API_KEY }}
        run: |
          RESPONSE=$(curl -sf \
            -H "Authorization: Bearer $FOUNDRY_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{"releaseId":"${{ github.sha }}","branch":"${{ github.ref_name }}"}' \
            "$FOUNDRY_API_URL/api/foundry/gate")

          echo "$RESPONSE" | jq .

          BLOCKED=$(echo "$RESPONSE" | jq -r '.blocked')
          if [ "$BLOCKED" = "true" ]; then
            echo ""
            echo "FOUNDRY GATE — BLOCKED"
            echo "Unresolved critical findings prevent deployment."
            echo "$RESPONSE" | jq -r '.findings[] | "\(.severity)  \(.label): \(.detail)"'
            exit 1
          fi

          echo "FOUNDRY GATE — PASSED"

  deploy:
    name: Deploy to production
    needs: foundry-gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: echo "Deploy step here"
```

**Secrets to configure** in your GitHub repository settings:

| Secret | Value |
|--------|-------|
| `FOUNDRY_API_URL` | Your deployment root (e.g. `https://your-domain.com`) |
| `FOUNDRY_API_KEY` | Foundry operator API key from the admin panel |

---

## GitLab CI

```yaml
# .gitlab-ci.yml

stages:
  - governance
  - deploy

foundry-gate:
  stage: governance
  image: alpine:latest
  before_script:
    - apk add --no-cache curl jq
  script:
    - |
      RESPONSE=$(curl -sf \
        -H "Authorization: Bearer $FOUNDRY_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"releaseId\":\"$CI_COMMIT_SHA\",\"branch\":\"$CI_COMMIT_REF_NAME\"}" \
        "$FOUNDRY_API_URL/api/foundry/gate")

      echo "$RESPONSE" | jq .

      BLOCKED=$(echo "$RESPONSE" | jq -r '.blocked')
      if [ "$BLOCKED" = "true" ]; then
        echo "FOUNDRY GATE — BLOCKED"
        echo "$RESPONSE" | jq -r '.findings[] | "\(.severity)  \(.label)"'
        exit 1
      fi

      echo "FOUNDRY GATE — PASSED"
  variables:
    FOUNDRY_API_URL: $FOUNDRY_API_URL
    FOUNDRY_API_KEY: $FOUNDRY_API_KEY

deploy:
  stage: deploy
  needs: [foundry-gate]
  script:
    - echo "Deploy step here"
  only:
    - main
```

**CI/CD variables** to configure in GitLab project settings → CI/CD → Variables:

| Variable | Value |
|----------|-------|
| `FOUNDRY_API_URL` | Your deployment root |
| `FOUNDRY_API_KEY` | Foundry operator API key |

---

## Curl example (manual or scripted)

Use this to test the gate from a terminal or integrate into any shell-based pipeline:

```bash
curl -sf \
  -H "Authorization: Bearer YOUR_FOUNDRY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"releaseId":"v2.4.1","branch":"main"}' \
  https://your-domain.com/api/foundry/gate | jq .
```

**Example passing response:**

```json
{
  "blocked": false,
  "releaseId": "v2.4.1",
  "findings": [],
  "checkedAt": "2026-05-29T14:22:00Z"
}
```

**Example blocked response:**

```json
{
  "blocked": true,
  "releaseId": "v2.4.1",
  "findings": [
    {
      "id": "finding_01jw...",
      "severity": "CRITICAL",
      "label": "Route exposure gap",
      "detail": "/api/admin/users — no auth check detected",
      "runId": "run_01jw..."
    }
  ],
  "checkedAt": "2026-05-29T14:22:00Z"
}
```

---

## Slack webhook notification on gate failure

Add this step after the gate check to post a message to your team when the gate blocks:

```yaml
# GitHub Actions step (add after the foundry-gate check step)

- name: Notify Slack on gate block
  if: failure()
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_FOUNDRY_WEBHOOK_URL }}
  run: |
    curl -sf -X POST "$SLACK_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "text": "*Foundry Gate Blocked — ${{ github.repository }}*",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*:no_entry: Foundry Gate Blocked*\nBranch: `${{ github.ref_name }}`\nCommit: `${{ github.sha }}`\n\nUnresolved CRITICAL findings are blocking deployment.\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View CI run>"
            }
          }
        ]
      }'
```

**Slack setup**: Create an Incoming Webhook at `api.slack.com/apps` → Your App → Incoming Webhooks.
Store the webhook URL as `SLACK_FOUNDRY_WEBHOOK_URL` in your repository secrets.

---

## Microsoft Teams webhook notification on gate failure

```yaml
# GitHub Actions step (add after the foundry-gate check step)

- name: Notify Teams on gate block
  if: failure()
  env:
    TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_FOUNDRY_WEBHOOK_URL }}
  run: |
    curl -sf -X POST "$TEAMS_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d '{
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "FF0000",
        "summary": "Foundry Gate Blocked",
        "sections": [
          {
            "activityTitle": "🚫 Foundry Gate Blocked",
            "activitySubtitle": "'"${{ github.repository }}"' — branch '"${{ github.ref_name }}"'",
            "facts": [
              { "name": "Commit", "value": "'"${{ github.sha }}"'" },
              { "name": "Status", "value": "BLOCKED — unresolved CRITICAL findings" }
            ],
            "markdown": true
          }
        ],
        "potentialAction": [
          {
            "@type": "OpenUri",
            "name": "View CI Run",
            "targets": [
              {
                "os": "default",
                "uri": "'"${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"'"
              }
            ]
          }
        ]
      }'
```

**Teams setup**: In your Teams channel → Connectors → Incoming Webhook → create a webhook.
Store the URL as `TEAMS_FOUNDRY_WEBHOOK_URL` in your repository secrets.

---

## Gate API reference

**Endpoint**: `POST /api/foundry/gate`

**Headers**:
```
Authorization: Bearer <operator-api-key>
Content-Type: application/json
```

**Request body**:
```json
{
  "releaseId": "string — commit SHA, tag, or release identifier",
  "branch":    "string — branch name (optional, used for context)",
  "notes":     "string — operator note attached to this gate check (optional)"
}
```

**Response** (always 200 even when blocked — inspect the `blocked` field):
```json
{
  "blocked":   "boolean",
  "releaseId": "string",
  "findings":  "Finding[] — only unresolved CRITICAL findings when blocked",
  "checkedAt": "ISO 8601 timestamp"
}
```

**Exit codes**: The curl examples above exit non-zero on `"blocked": true`.
A network error or 4xx/5xx response from the Foundry API also exits non-zero.

---

## Operator notes

- The gate checks the **current governance state**, not a point-in-time snapshot. Resolving a
  finding in the admin panel immediately clears it from subsequent gate calls.
- Findings are created by Foundry ResearchRuns. Run a diagnostic before expecting the gate to
  produce meaningful results for a new release.
- The `HIGH` severity threshold can be elevated to also block — contact your Foundry operator
  to configure this per-release or globally.
- Gate call history is logged to the ResearchRun audit trail. Each call is attributed to the
  API key used.
