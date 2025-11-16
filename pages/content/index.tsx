// pages/content/index.tsx
import type {
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import type { UnifiedContent } from "@/lib/server/unified-content";
import { getAllUnifiedContent } from "@/lib/server/unified-content";

type ContentListItem = Omit<UnifiedContent, "updatedAt"> & {
  updatedAt: string | null;
};

interface ContentIndexProps {
  items: ContentListItem[];
}

export const getStaticProps: GetStaticProps<ContentIndexProps> = async () => {
  const all = await getAllUnifiedContent();

  // 🔒 HARD GUARANTEE: no `undefined` in `updatedAt`
  const items: ContentListItem[] = all.map((item) => ({
    ...item,
    updatedAt:
      typeof item.updatedAt === "string" && item.updatedAt.trim().length > 0
        ? item.updatedAt
        : null,
  }));

  return {
    props: { items },
    revalidate: 3600,
  };
};

export default function ContentIndexPage({
  items,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout title="Content index">
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-serif font-semibold">
          Content Index
        </h1>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500">
            No content items found yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.slug} className="border-b pb-3">
                <div className="text-xs uppercase text-gray-500">
                  {item.type}
                </div>
                <div className="font-semibold">
                  <Link href={`/${item.slug}`}>{item.title}</Link>
                </div>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {item.description}
                  </p>
                )}
                {item.updatedAt && (
                  <p className="mt-1 text-xs text-gray-400">
                    Updated: {item.updatedAt}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </Layout>
  );
}