// Example: pages/content/index.tsx (if you choose to make it)
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import { getAllUnifiedContent } from "@/lib/server/unified-content";

export const getStaticProps: GetStaticProps = async () => {
  const items = await getAllUnifiedContent();
  return { props: { items } };
};

export default function ContentIndexPage({
  items,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-serif font-semibold mb-6">Content Index</h1>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.slug} className="border-b pb-3">
            <div className="text-xs uppercase text-gray-500">{item.type}</div>
            <div className="font-semibold">{item.title}</div>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
