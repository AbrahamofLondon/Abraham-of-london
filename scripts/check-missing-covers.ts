// scripts/check-missing-covers.ts
import { buildSearchIndex, type SearchDoc } from "../lib/searchIndex";

type ContentKey = `${SearchDoc["type"]}:${string}`;

const COVER_OVERRIDES: Record<ContentKey, string> = require("../pages/content/cover-overrides.json"); 
// or, if you keep it inline, just copy the object here manually for the check.

function hasCover(doc: SearchDoc): boolean {
  const key = `${doc.type}:${doc.slug}` as ContentKey;
  // @ts-ignore - this is just a quick script
  const overrides = (global as any).COVER_OVERRIDES || {};
  if (overrides[key]) return true;
  return !!doc.coverImage;
}

const index = buildSearchIndex();

const missing = index.filter((doc) => !hasCover(doc));

console.log("Docs without cover art:");
for (const doc of missing) {
  console.log(
    `- ${doc.type}:${doc.slug}  (title: ${doc.title})  current coverImage: ${doc.coverImage ?? "none"}`,
  );
}