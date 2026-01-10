// lib/redis-enhanced.ts
// This file must be Edge-safe at parse time.

export type { RedisInterface } from "./redis-enhanced.edge";

// If Next runs this in Edge, NEXT_RUNTIME is "edge".
// Use string access only; avoid process.versions etc.
const isEdge = () => {
  try {
    // eslint-disable-next-line no-undef
    return typeof process !== "undefined" && process.env?.NEXT_RUNTIME === "edge";
  } catch {
    return true;
  }
};

const mod = isEdge()
  ? require("./redis-enhanced.edge")
  : require("./redis-enhanced.node");

export const redis = mod.redis;
export default mod.default ?? mod.redis;
