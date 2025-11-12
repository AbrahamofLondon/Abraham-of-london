// pages/print/index.tsx
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getAllPrintDocuments } from "@/lib/server/print-utils";

type Props = {
  prints: Array<{
    title: string;
    slug: string;
    date: string;
    excerpt?: string;
    tags?: string[];
    url: string;
  }>;
};

export default function PrintIndexPage({ prints }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout pageTitle="Print Materials">
      <Head>
        <title>Print Materials | Abraham of London</title>
        <meta name="description" content="Collection of print materials, guides, and resources from Abraham of London." />
      </Head>

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-serif font-bold text-deepCharcoal mb-4">
            Print Materials
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Collection of guides, resources, and print materials for leadership, strategy, and personal development.
          </p>
        </header>

        {prints.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No print materials available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {prints.map((print) => (
              <article 
                key={print.slug}
                className="border border-lightGrey rounded-lg p-6 hover:shadow-card transition-shadow"
              >
                <h2 className="text-xl font-semibold text-deepCharcoal mb-2">
                  <Link 
                    href={print.url}
                    className="hover:text-forest transition-colors"
                  >
                    {print.title}
                  </Link>
                </h2>
                
                {print.excerpt && (
                  <p className="text-gray-600 mb-3">{print.excerpt}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <time dateTime={print.date}>
                    {new Date(print.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </time>
                  
                  {print.tags && print.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {print.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-block bg-warmWhite px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const prints = getAllPrintDocuments().map((doc) => ({
    title: doc.title,
    slug: doc.slug,
    date: doc.date,
    excerpt: doc.excerpt || undefined,
    tags: doc.tags || undefined,
    url: doc.url
  }));

  return {
    props: {
      prints
    },
    revalidate: 60 * 60 // 1 hour
  };
};