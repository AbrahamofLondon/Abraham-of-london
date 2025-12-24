// lib/stubs/contentlayer-generated.js
// Runtime shim for any legacy imports from "@/lib/contentlayer".
// It simply proxies through to the real Contentlayer bundle under `.contentlayer/generated`.

let realExports = {};

try {
  // This path is from the project root: .contentlayer/generated/index.(js|mjs)
  // Webpack/Turbopack will bundle this correctly.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  realExports = require("../../.contentlayer/generated");
} catch (err) {
  // In development, you can log; in production we stay quiet and just expose empty exports.
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[contentlayer-generated stub] Failed to load .contentlayer/generated; returning empty exports."
    );
  }
  realExports = {};
}

module.exports = realExports;