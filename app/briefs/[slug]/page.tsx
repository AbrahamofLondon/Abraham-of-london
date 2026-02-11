/* app/briefs/[slug]/page.tsx */
export default function BriefPage({ params }) {
  const { data: session } = useSession();
  const brief = getBriefBySlug(params.slug);

  // If user lacks the tier defined in the MDX frontmatter
  if (session?.aol.tier !== brief.classification) {
    return (
      <AccessGate 
        title={brief.title}
        requiredTier={brief.classification}
        message="This intelligence brief is restricted to verified members."
        onUnlocked={() => window.location.reload()}
      />
    );
  }

  return <BriefContent brief={brief} />;
}