// lib/inner-circle/access.ts
export type { InnerCircleAccess } from "./access.client";
export { hasInnerCircleAccess, checkClientAccess } from "./access.client";

// Only export what actually exists
export { getInnerCircleAccess } from "./access.server";