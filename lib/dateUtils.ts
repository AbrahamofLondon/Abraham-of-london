// lib/datesUtil.ts
// Aggregator module for all date and time utilities from ./date.ts.

// 1. Named Exports: Use the standard wildcard re-export for all named exports
// from the base utility file. This is the preferred method for modern consumers.
export * from "./date";

// 2. Namespace Object: Import the named exports as a namespace object.
import * as DateUtils from "./date";

// 3. Default Export: Provide the namespace object as the default export for
// backward compatibility with consumers using 'import DateUtils from "./datesUtil"'.
export default DateUtils;

// Note: This pattern is often redundant in modern TypeScript/ESM environments
// but is maintained here specifically to support legacy 'default' imports.