import { notFound } from "next/navigation";
import { getUnifiedContentBySlug } from "@/lib/server/unified-content";

export default async function PrintPage({ params }: { params: { slug: string } }) {
  const item = await getUnifiedContentBySlug(params.slug);

  if (!item) return notFound();

  return (
    <div className="print-layout min-h-screen bg-white p-6">
      <h1>{item.title}</h1>
      <article>{item.content}</article>
    </div>
  );
}

// Temporary fix: return empty array or hardcode some slugs
export async function generateStaticParams() {
  // Return empty array for now to fix build
  return [];
  
  // Or hardcode some document slugs if you know them
  // return [
  //   { slug: "document-1" },
  //   { slug: "document-2" },
  // ];
}