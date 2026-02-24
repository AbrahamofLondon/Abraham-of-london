// lib/inner-circle/store.server.ts
import "server-only";

/**
 * INSTITUTIONAL RECONCILIATION
 * This file acts as a legacy bridge. 
 * Since 'exports.server.ts' provides named utility functions,
 * we aggregate them into a single namespace to satisfy the 
 * default export requirement.
 */
import * as innerCircleStore from "./exports.server";

export default innerCircleStore;