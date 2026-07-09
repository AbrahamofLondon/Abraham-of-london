export { isRecommendationContextStale } from "./recommendation-context-store.shared";
export type { RecommendationContextInput, RecommendationContextRecord, CorridorAccessMode } from "./recommendation-context-store.shared";

function isProd(): boolean { return process.env.NODE_ENV === "production"; }
async function adapter() { return isProd() ? import("./recommendation-context-store.prisma") : import("./recommendation-context-store"); }

export async function saveRecommendationContext(input: import("./recommendation-context-store.shared").RecommendationContextInput, now = new Date().toISOString()) {
  return (await adapter()).saveRecommendationContext(input, now);
}
export async function getRecommendationContext(recommendationId: string) { return (await adapter()).getRecommendationContext(recommendationId); }
export async function listRecommendationContextsForSession(sessionId: string) { return (await adapter()).listRecommendationContextsForSession(sessionId); }
