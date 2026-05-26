# Netlify Handler NFT Trace — Top Files Analysis

**Source:** `.next/next-server.js.nft.json`  
**Date:** 2026-05-26T14:00:10.511Z  
**Status:** PRE-BUILD ANALYSIS — `.next/standalone/` does not exist. Run `pnpm build:fast` to produce it.  

## Handler is NOT present locally

```
The ___netlify-server-handler is created by @netlify/plugin-nextjs during Netlify deploy.
To produce it locally, run: netlify build (requires site linking).
This report is based on next-server.js.nft.json NFT traces only.
```

## NFT Trace Summary

| Stat | Value |
|---|---|
| Total files in trace | 3042 |
| Build-only files (to be stripped) | 1471 (48%) |
| Expected runtime files | 1571 (52%) |

## Top 50 Packages by File Count

| # | Package | Files | Classification |
|---|---|---|---|
| 1 | `next` | 1191 | ✅ EXPECTED_RUNTIME |
| 2 | `webpack` | 642 | ⛔ BUILD_ONLY |
| 3 | `caniuse-lite` | 597 | ⛔ BUILD_ONLY |
| 4 | `@opentelemetry/api` | 48 | ✅ EXPECTED_RUNTIME |
| 5 | `enhanced-resolve` | 48 | ⛔ BUILD_ONLY |
| 6 | `ajv` | 43 | ✅ EXPECTED_RUNTIME |
| 7 | `ajv-keywords` | 38 | ✅ EXPECTED_RUNTIME |
| 8 | `postcss` | 29 | ⛔ BUILD_ONLY |
| 9 | `webpack-sources` | 25 | ⛔ BUILD_ONLY |
| 10 | `semver` | 21 | ✅ EXPECTED_RUNTIME |
| 11 | `critters` | 20 | ⛔ BUILD_ONLY |
| 12 | `terser-webpack-plugin` | 20 | ⛔ BUILD_ONLY |
| 13 | `tapable` | 16 | ✅ EXPECTED_RUNTIME |
| 14 | `uglify-js` | 15 | ⛔ BUILD_ONLY |
| 15 | `react-dom` | 14 | ✅ EXPECTED_RUNTIME |
| 16 | `schema-utils` | 14 | ✅ EXPECTED_RUNTIME |
| 17 | `sharp` | 14 | ✅ EXPECTED_RUNTIME |
| 18 | `source-map-js` | 12 | ✅ EXPECTED_RUNTIME |
| 19 | `css-select` | 11 | ✅ EXPECTED_RUNTIME |
| 20 | `eslint-scope` | 11 | ⛔ BUILD_ONLY |
| 21 | `@webassemblyjs/ast` | 10 | ⛔ BUILD_ONLY |
| 22 | `domutils` | 9 | ✅ EXPECTED_RUNTIME |
| 23 | `entities` | 9 | ✅ EXPECTED_RUNTIME |
| 24 | `react` | 9 | ✅ EXPECTED_RUNTIME |
| 25 | `watchpack` | 7 | ✅ EXPECTED_RUNTIME |
| 26 | `@img/sharp-win32-x64` | 6 | ✅ EXPECTED_RUNTIME |
| 27 | `@webassemblyjs/helper-wasm-section` | 5 | ⛔ BUILD_ONLY |
| 28 | `@webassemblyjs/leb128` | 5 | ⛔ BUILD_ONLY |
| 29 | `browserslist` | 5 | ⛔ BUILD_ONLY |
| 30 | `css-what` | 5 | ✅ EXPECTED_RUNTIME |
| 31 | `detect-libc` | 5 | ✅ EXPECTED_RUNTIME |
| 32 | `graceful-fs` | 5 | ✅ EXPECTED_RUNTIME |
| 33 | `postcss-media-query-parser` | 5 | ✅ EXPECTED_RUNTIME |
| 34 | `@webassemblyjs/utf8` | 4 | ⛔ BUILD_ONLY |
| 35 | `loader-runner` | 4 | ✅ EXPECTED_RUNTIME |
| 36 | `nth-check` | 4 | ✅ EXPECTED_RUNTIME |
| 37 | `styled-jsx` | 4 | ✅ EXPECTED_RUNTIME |
| 38 | `@img/colour` | 3 | ✅ EXPECTED_RUNTIME |
| 39 | `@webassemblyjs/helper-wasm-bytecode` | 3 | ⛔ BUILD_ONLY |
| 40 | `@webassemblyjs/wasm-edit` | 3 | ⛔ BUILD_ONLY |
| 41 | `@webassemblyjs/wasm-gen` | 3 | ⛔ BUILD_ONLY |
| 42 | `@webassemblyjs/wasm-opt` | 3 | ⛔ BUILD_ONLY |
| 43 | `@webassemblyjs/wasm-parser` | 3 | ⛔ BUILD_ONLY |
| 44 | `acorn-import-phases` | 3 | ✅ EXPECTED_RUNTIME |
| 45 | `dom-serializer` | 3 | ✅ EXPECTED_RUNTIME |
| 46 | `domhandler` | 3 | ✅ EXPECTED_RUNTIME |
| 47 | `mime-db` | 3 | ✅ EXPECTED_RUNTIME |
| 48 | `nanoid` | 3 | ✅ EXPECTED_RUNTIME |
| 49 | `sass` | 3 | ⛔ BUILD_ONLY |
| 50 | `terser` | 3 | ⛔ BUILD_ONLY |

## Exclusion Coverage

The following packages are in the trace and are now excluded via 3-layer mechanism:

- `webpack`: 642 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `webpack-sources`: 25 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `enhanced-resolve`: 48 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `acorn`: 2 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `eslint-scope`: 11 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `postcss`: 29 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `critters`: 20 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `terser`: 3 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `terser-webpack-plugin`: 20 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `uglify-js`: 15 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `caniuse-lite`: 597 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `browserslist`: 5 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `electron-to-chromium`: 2 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`
- `sass`: 3 files → stripped by `outputFileTracingExcludes` + `clean-standalone.mjs` + `netlify.toml excluded_files`

## Next Steps

1. Run `pnpm build:fast` to produce `.next/standalone/`
2. Run `netlify build` (with site linked) OR deploy to Netlify to package the handler
3. Run `node scripts/check-netlify-handler-size.mjs` for actual handler inventory
4. Verify handler is < 220 MB
