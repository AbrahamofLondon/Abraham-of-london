// lib/content/real.ts — SERVER-SAFE CONTENTLAYER ACCESS (Pages Router friendly)
import "server-only";
import type { DocBase } from "@/lib/contentlayer-compat";
import {
  allBooks,
  allCanons,
  allDownloads,
  allEvents,
  allPosts,
  allPrints,
  allResources,
  allShorts,
  allStrategies,
} from "@/lib/contentlayer-compat";

export function getAllContentlayerDocs(): DocBase[] {
  // Flatten everything into one array for universal routing/search.
  // IMPORTANT: keep stable ordering (date sorting should happen at call site if needed).
  return [
    ...(allPosts as any[]),
    ...(allBooks as any[]),
    ...(allCanons as any[]),
    ...(allDownloads as any[]),
    ...(allEvents as any[]),
    ...(allPrints as any[]),
    ...(allResources as any[]),
    ...(allShorts as any[]),
    ...(allStrategies as any[]),
  ] as DocBase[];
}