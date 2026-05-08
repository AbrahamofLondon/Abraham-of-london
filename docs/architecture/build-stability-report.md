# Build Stability Report

Generated: 2026-05-07

## Command Run

- `pnpm build:netlify`
- Narrowed diagnostic command: `pnpm contentlayer:build`
- Control probe: inline `node` script using `require("esbuild").context(...)`

## Exact Failure

Primary production-equivalent build path:

```text
pnpm build:netlify
  -> pnpm mdx:gate
  -> pnpm contentlayer:clean
  -> pnpm mdx:integrity
  -> pnpm build:fast
  -> tsx scripts/build-pdf-registry-json.ts
  -> next build --webpack
```

Observed failing stack:

```text
Warning: Contentlayer might not work as expected on Windows
Error: spawn EPERM
    at ChildProcess.spawn (node:internal/child_process:420:11)
    at Object.spawn (node:child_process:762:9)
    at ensureServiceIsRunning (node_modules/esbuild/lib/main.js:2268:29)
    at Module.context (node_modules/esbuild/lib/main.js:2167:33)
    at .../node_modules/@contentlayer2/core/dist/getConfig/esbuild.js:64:79
OS: win32 10.0.26200
Process: node ...\\contentlayer2\\bin\\cli.cjs build
Node version: v20.20.0
Contentlayer version: 0.5.8
```

The same failure reproduces on the narrower command:

- `pnpm contentlayer:build`

Control probe result:

- Direct `esbuild` invocation via inline `node` script succeeded: `esbuild-spawn-ok`
- `npx tsx scripts/audit-repo-hygiene.ts` also failed on this machine with `node_modules/tsx/node_modules/esbuild` reporting `spawn EPERM`

## Likely Root Cause

Most likely cause: Windows-local process execution failure inside the Contentlayer configuration build path, not a general Next.js compilation failure.

Why this is the leading diagnosis:

- The failure reproduces before route compilation is complete and also reproduces on `pnpm contentlayer:build`.
- The stack originates in Contentlayer calling `esbuild.context(...)` to evaluate `contentlayer.config.ts`.
- A direct `esbuild` control probe works in the same shell, so the machine can execute `esbuild` in general.
- Contentlayer emits its own Windows warning before the failure.

Most plausible contributing factors:

- Windows permission or endpoint-protection interference with the child-process spawn Contentlayer triggers.
- A Windows-only incompatibility in the `contentlayer2` plus `esbuild` path on this machine.
- Less likely: stale generated artifacts. Clearing `.next`, `.contentlayer`, `.turbo`, and caches removed earlier lock noise but did not remove the `spawn EPERM`.

Lower-probability causes based on current evidence:

- Next.js route/config conflict: the failure reproduces outside the full Next build.
- pnpm store corruption: possible, but not yet proven.
- Application code introduced in this pass: not supported by the failure locus or the successful typecheck/smoke runs.

Companion observation:

- The failure class is not limited to the full build. `tsx` can also hit the same Windows `spawn EPERM` path because it relies on an embedded `esbuild` service process. That reinforces the assessment that this is a local process-spawn problem, not a route-specific regression.

## Safe Remediation Commands

These are conservative and should be tried in order.

1. Clear generated build artifacts and rerun the narrow reproducer:

```powershell
Remove-Item -Path ".next", ".contentlayer", ".turbo", "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
pnpm contentlayer:build
```

2. Confirm `esbuild` itself still works independently:

```powershell
@'
const esbuild = require("esbuild");
(async () => {
  const ctx = await esbuild.context({
    stdin: { contents: "export default 1", resolveDir: process.cwd(), sourcefile: "inline-entry.js" },
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
  });
  await ctx.rebuild();
  await ctx.dispose();
  console.log("esbuild-spawn-ok");
})();
'@ | node -
```

3. Rebuild the local install state without changing repo config:

```powershell
pnpm rebuild esbuild
pnpm contentlayer:build
```

4. If the issue persists, refresh the local dependency tree:

```powershell
Remove-Item -Path "node_modules" -Recurse -Force
pnpm install
pnpm contentlayer:build
```

5. If endpoint protection is suspected, rerun the same narrow reproducer in a trusted terminal session after excluding the workspace from real-time scanning. Do not change Next or Contentlayer config until that test is complete.

## Local Windows-Only Or Deployment-Relevant

Current assessment: likely local Windows-only.

Evidence:

- The stack explicitly identifies `OS: win32`.
- Contentlayer itself warns that Windows may behave unexpectedly.
- The failure is in local child-process spawning, not in route code or a deterministic content schema error.

## Netlify Impact

Current assessment: not likely to block Netlify by itself, assuming Netlify builds on Linux and the deployed environment uses the same committed source and lockfile.

Caveat:

- This conclusion is specific to the observed `spawn EPERM` failure.
- It does not prove Netlify will succeed if there are separate environment, content, or dependency issues.
- If Netlify has not recently run this exact lockfile successfully, a remote build should still be treated as an unverified dependency.

## Caused By This Pass

No evidence that this pass caused the build failure.

Why:

- `npx tsc --noEmit --pretty false` passes.
- The smoke-route script passes for the targeted launch routes.
- The failing stack originates in `contentlayer2 build`, which is outside the route hardening, pricing protection, and documentation additions from this pass.
