// app/registry/[...slug]/page.tsx
import { prisma } from "@/lib/prisma.server";
import { VaultGuard } from "@/components/VaultGuard";

// ✅ Polyfill notFound – works in any Next.js version
function notFound(): never {
  const error = new Error("NEXT_NOT_FOUND");
  (error as any).digest = "NEXT_NOT_FOUND";
  throw error;
}

export const dynamic = "force-dynamic";

export default async function RegistryPage({ params }: { params: { slug?: string[] } }) {
  const slugPath = params.slug?.join("/") || "index";

  const asset = await prisma.contentMetadata.findUnique({
    where: { slug: slugPath },
  });

  if (!asset) notFound();

  return (
    <main className="min-h-screen bg-black py-20 px-6">
      <VaultGuard
        title={asset.title}
        slug={asset.slug}
        isGated={(asset as any).classification === "PRIVATE"}
      >
        <article className="prose prose-invert max-w-none">
          <h1>{asset.title}</h1>
          <div className="whitespace-pre-wrap">{(asset as any).content}</div>
        </article>
      </VaultGuard>
    </main>
  );
}