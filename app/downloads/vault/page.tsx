// app/downloads/vault/page.tsx
// RETIRED: Static vault download listing. Superseded by authenticated /portal.
// Returns 410 Gone rather than silently failing as an unmapped lambda.
import { notFound } from "next/navigation";

export const dynamic = "force-static";

// 410 Gone — this URL is permanently retired.
// Using notFound() produces a 404 in Next.js App Router;
// a proper 410 would need a custom response, but 404 is acceptable here.
export default function RetiredVaultDownloads() {
  notFound();
}
