// app-archived/print-disabled/[slug].tsx
import type { UnifiedContent } from "@/lib/server/unified-content";
import { getUnifiedContentBySlug } from "@/lib/server/unified-content";

type PrintPageProps = {
  params: { slug: string };
};

function formatDate(value: UnifiedContent["date"]): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const str = value.toString().trim();
  return str.length > 0 ? str : null;
}

export default async function PrintPage({ params }: PrintPageProps) {
  const item = await getUnifiedContentBySlug(params.slug);

  if (!item || !item.published) {
    // Fallback 404 rendering
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
          <p className="mt-2">The requested content could not be found.</p>
        </div>
      </div>
    );
  }

  const dateLabel = formatDate(item.date);

  return (
    <div className="print-layout min-h-screen bg-white px-6 py-10">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-serif font-semibold">
          {item.title ?? params.slug}
        </h1>

        {dateLabel && <p className="mt-1 text-sm text-gray-500">{dateLabel}</p>}
      </header>

      {item.description && (
        <p className="mb-6 text-gray-700">{item.description}</p>
      )}

      <p className="text-sm text-gray-500">
        Print view placeholder for <code>{item.slug}</code>.
      </p>
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}