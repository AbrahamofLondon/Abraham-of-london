# 2026-07 Four-Pillar Unauthorised Push Reconciliation

## Scope

This record covers the remote push events discovered while reconciling the Four-Pillar / estate-restoration construction programme on 2026-07-07.

## Local State Observed

- Worktree: `C:\Dev\aol-estate-construction`
- Local branch: `construction/estate-restoration`
- Local HEAD at reconciliation start: `b71752436332db0a74f5e298e5fb3e4acef6085f`
- Remote: `origin https://github.com/AbrahamofLondon/Abraham-of-london.git`
- Remote branch observed: `origin/construction/estate-restoration`
- Remote resulting HEAD: `b71752436332db0a74f5e298e5fb3e4acef6085f`
- Last pre-push programme HEAD previously reported locally: `a0c6a0376f4e322fdae1af9af4c7bf2fd6447a6a`

## Push Events Observed

Source: public GitHub repository events API and local `git for-each-ref` / `git reflog`.

| UTC timestamp | Event | Ref | Before | Head |
|---|---|---|---|---|
| 2026-07-07T19:48:32Z | CreateEvent | `refs/heads/construction/estate-restoration` | n/a | branch created |
| 2026-07-07T19:52:21Z | PushEvent | `refs/heads/construction/estate-restoration` | `913ee1018b40ce52f45db102a7c88b16cd2087e6` | `12d9c00a0bf1d16a35df039ae40c75be35b0d5bd` |
| 2026-07-07T19:56:48Z | PushEvent | `refs/heads/construction/estate-restoration` | `12d9c00a0bf1d16a35df039ae40c75be35b0d5bd` | `744beaebfa7abd8b92de84432ff61c0f431c631c` |
| 2026-07-07T20:01:53Z | PushEvent | `refs/heads/construction/estate-restoration` | `744beaebfa7abd8b92de84432ff61c0f431c631c` | `b71752436332db0a74f5e298e5fb3e4acef6085f` |

The public event page does not expose the initial branch creation SHA in the CreateEvent payload. Local branch history shows the construction line contains the estate-restoration sequence through `913ee1018`, followed by `12d9c00a`, `744beaeb`, and `b717524`.

## Pushed Range

Operationally relevant pushed construction range since the last recorded local final report head:

`a0c6a0376f4e322fdae1af9af4c7bf2fd6447a6a..b71752436332db0a74f5e298e5fb3e4acef6085f`

Remote event feed proves the final three construction-branch updates from `913ee1018` to `b71752436`. The earlier construction commits up to `913ee1018` are present on the remote branch after branch creation; the CreateEvent does not provide enough public payload detail to prove the exact initial remote branch tip.

## Branch Protection

GitHub branch API response for `construction/estate-restoration`:

- `protected`: `false`
- `protection.enabled`: `false`
- required status checks: enforcement `off`, no contexts/checks

Branch protections did not apply.

## CI / Deployment Association

GitHub Actions API for branch `construction/estate-restoration` returned:

- `total_count`: `0`
- `workflow_runs`: `[]`

GitHub deployments API for ref `construction/estate-restoration` returned an empty list.

Tracked workflow configuration also shows the main CI/deploy workflows are scoped to `main`, PRs to `main`, manual dispatch, or scheduled runs. No tracked GitHub workflow explicitly targets `construction/estate-restoration` by branch name.

Tracked deployment configuration exists:

- `netlify.toml` contains a production-capable Netlify build command.
- `vercel.json` contains a Vercel build command.

But repository evidence gathered here shows no GitHub Actions run and no GitHub deployment record for the pushed construction branch.

## Production Effect Classification

- Push occurred: **YES**.
- Deployment occurred from this pushed construction branch: **NO EVIDENCE FOUND**. GitHub deployment records for the ref are empty; Actions runs for the branch are zero.
- Production state changed from this pushed construction branch: **NO EVIDENCE FOUND**.

This record does not assert that external Netlify/Vercel dashboards were inspected. It records repository-visible and GitHub-visible evidence only.

## Actions Not Taken

- No force push.
- No branch deletion.
- No history rewrite.
- No remote mutation.
- No concealment of the event.
