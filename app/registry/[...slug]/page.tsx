import { prisma } from '@/lib/db';
import { VaultGuard } from '@/components/VaultGuard';
import { notFound } from 'next/navigation';

// Prevent static bloat for 259 pages; fetch on demand
export const dynamic = 'force-dynamic'; 

export default async function RegistryPage({ params }: { params: { slug?: string[] } }) {
  const slugPath = params.slug?.join('/') || 'index';

  const asset = await prisma.contentMetadata.findUnique({
    where: { slug: slugPath },
  });

  if (!asset) notFound();

  return (
    <main className="min-h-screen bg-black py-20 px-6">
      <VaultGuard 
        title={asset.title} 
        slug={asset.slug}
        isGated={asset.classification === 'PRIVATE'}
      >
        <article className="prose prose-invert max-w-none">
          <h1>{asset.title}</h1>
          <div className="whitespace-pre-wrap">{asset.content}</div>
        </article>
      </VaultGuard>
    </main>
  );
}