// app/print/[slug].tsx
import { notFound } from "next/navigation";
import type { UnifiedContent } from "@/lib/server/unified-content";
import { getUnifiedContentBySlug } from "@/lib/server/unified-content";

type PrintPageProps = {
  params: { slug: string };
};

function formatDate(value: UnifiedContent["date"]): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    // ISO date → YYYY-MM-DD
    return value.toISOString().slice(0, 10);
  }

  const str = value.toString().trim();
  return str.length > 0 ? str : null;
}

export default async function PrintPage({ params }: PrintPageProps) {
  const item = await getUnifiedContentBySlug(params.slug);

  if (!item || !item.published) {
    notFound();
  }

  const dateLabel = formatDate(item.date);

  return (
    <div className="print-layout min-h-screen bg-white px-6 py-10">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-serif font-semibold">
          {item.title ?? params.slug}
        </h1>

        {dateLabel && (
          <p className="mt-1 text-sm text-gray-500">
            {dateLabel}
          </p>
        )}
      </header>

      {item.description && (
        <p className="mb-6 text-gray-700">{item.description}</p>
      )}

      {/* Placeholder – real MDX/print layouts can replace this later */}
      <p className="text-sm text-gray-500">
        Print view placeholder for <code>{item.slug}</code>.
      </p>
    </div>
  );
}

// Optional: keep this to avoid accidentally prebuilding all print pages
export async function generateStaticParams() {
  return [];
}