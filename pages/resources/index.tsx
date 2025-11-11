pages/resources/index.tsx
import { GetStaticProps, InferGetStaticPropsType } from '...';
import Link from 'next/link';
import { allPosts, allResources, allBooks } from '...';
import SiteLayout from '@/components/SiteLayout';

interface ResourceItem {
  title: string;
  description: string;
  slug: string;
  date: string;
  author: string;
  category?: string;
  tags?: string[];
}

export default function ResourcesIndexPage({ 
  items 
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <SiteLayout
      pageTitle="Resources - Abraham of London"
      metaDescription="Explore valuable resources, guides, and tools for leadership, fatherhood, and legacy building."
      canonicalUrl="https://abrahamoflondon.com/resources"
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Resources</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Practical guides, tools, and insights for leadership, fatherhood, and building lasting legacies.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((resource) => (
            <Link
              key={resource.slug}
              href={`/resources/${resource.slug}`}
              className="block p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <article>
                <h2 className="text-xl font-semibold mb-3 text-gray-900 hover:text-blue-600">
                  {resource.title}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {resource.description}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{resource.author}</span>
                  <span>{resource.date}</span>
                </div>
                {resource.category && (
                  <div className="mt-3">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {resource.category}
                    </span>
                  </div>
                )}
              </article>
            </Link>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No resources available yet.</p>
            <p className="text-gray-400">Check back soon for new content.</p>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

export const getStaticProps: GetStaticProps<{ items: ResourceItem[] }> = async () => {
  const items = allResources
    .filter((resource) => !resource.draft)
    .map((resource) => ({
      title: resource.title,
      description: resource.description || resource.excerpt || '',
      slug: resource.slug,
      date: resource.date,
      author: resource.author,
      category: resource.category,
      tags: resource.tags || [],
    }))
    .sort((a, b) => {
      const da = a.date ? +new Date(a.date) : 0;
      const db = b.date ? +new Date(b.date) : 0;
      return db - da;
    });

  return {
    props: { items },
    revalidate: 1800,
  };
};