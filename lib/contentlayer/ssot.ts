/* lib/contentlayer/ssot.ts — SINGLE SOURCE OF TRUTH (Contentlayer2 output = local .contentlayer) */
/* eslint-disable @typescript-eslint/no-explicit-any */

// ✅ Contentlayer2 writes generated code into: /.contentlayer/generated
// ✅ Import from the local generated output (NOT from the npm package).

export * from "../../.contentlayer/generated";

import * as Generated from "../../.contentlayer/generated";
export default Generated;