// ---------------------------------------------------------------------------
// SSG
// ---------------------------------------------------------------------------

interface ContentPageProps {
  items: ContentResource[];
}

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const items: ContentResource[] = [
    ...normalisePosts(),      // 👈 THIS is the missing piece
    ...normaliseBooks(),
    ...normaliseDownloads(),
    ...normaliseEvents(),
    ...normalisePrints(),
    ...normaliseResources(),
    // You can also inject static "page" links here if you want About/Contact etc.
  ];

  // Optional: sort newest first by date
  const sorted = items.slice().sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? 1 : -1;
  });

  return {
    props: { items: sorted },
    revalidate: 3600,
  };
};