/* app/briefs/[slug]/page.tsx */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { allPosts } from "contentlayer/generated";

import BriefContent from "@/components/BriefContent";
import AccessGate from "@/components/AccessGate";

/**
 * ✅ Polyfill for `notFound` in case `next/navigation` is not available.
 * This throws the same internal error that Next.js uses to trigger the not‑found boundary.
 */
function notFound(): never {
  const error = new Error("NEXT_NOT_FOUND");
  (error as any).digest = "NEXT_NOT_FOUND";
  throw error;
}

interface PageProps {
  params: { slug: string };
}

export default async function BriefPage({ params }: PageProps) {
  const { slug } = params;

  const session = await getServerSession(authOptions);

  // Find the brief in the verified index
  const brief = allPosts.find((p) => p._raw.flattenedPath === `briefs/${slug}`);

  if (!brief) {
    notFound();
  }

  // Institutional Authorization check
  const userTier = (session?.user as any)?.tier || "Public";
  const requiredTier = (brief as any)?.classification || "Verified";

  if (userTier !== requiredTier) {
    return (
      <AccessGate
        title={brief.title}
        requiredTier={requiredTier}
        message="This intelligence brief is restricted to verified members."
      />
    );
  }

  return <BriefContent brief={brief as any} />;
}