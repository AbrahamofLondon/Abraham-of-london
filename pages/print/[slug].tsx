// pages/print/[slug].tsx
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getAllPrintSlugs, getPrintDocumentBySlug } from "@/lib/server/print-utils";
import type { Print } from "contentlayer/generated";

type PageProps = {
  doc: Print;
};

// ----------------------------------------------
// Helper Functions
// ----------------------------------------------
function formatPretty(dateString: string, tz = "Europe/London"): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date TBC";
    
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "Date TBC";
  }
}

// ----------------------------------------------
// Page Component
// ----------------------------------------------
export default function PrintPage({ doc }: InferGetStaticPropsType<typeof getStaticProps>) {
  const MDXContent = useMDXComponent(doc.body.code);
  
  const { title, excerpt, date, tags, url } = doc;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const fullUrl = `${site}${url}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description: excerpt || "",
    url: fullUrl,
    datePublished: date,
    author: {
      "@type": "Person",
      name: "Abraham of London"
    }
  };

  return (
    <Layout pageTitle={title}>
      <Head>
        <title>{title} | Print</title>
        <meta name="description" content={excerpt || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt || ""} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={excerpt || ""} />
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} 
        />
      </Head>

      <article className="px-4 py-10 mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-4 text-deepCharcoal">
            {title}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
            {date && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Date:</span>
                <time dateTime={date}>{formatPretty(date)}</time>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="font-medium">Author:</span>
              <span>Abraham of London</span>
            </div>
          </div>
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                >
                  {String(tag)}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="prose prose-lg max-w-none mb-12">
          <MDXContent components={mdxComponents} />
        </div>

        <nav className="mt-12 pt-8 border-t border-lightGrey">
          <Link 
            href="/print" 
            className="inline-flex items-center gap-2 text-sm font-medium text-deepCharcoal hover:underline"
          >
            ← Back to Print Materials
          </Link>
        </nav>
      </article>
    </Layout>
  );
}

// ----------------------------------------------
// getStaticPaths
// ----------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllPrintSlugs();
  const paths = slugs.map((slug) => ({ params: { slug } }));

  console.log(`🖨️ Generated ${paths.length} print paths`);

  return { 
    paths, 
    fallback: false
  };
};

// ----------------------------------------------
// getStaticProps
// ----------------------------------------------
export const getStaticProps: GetStaticProps<PageProps> = async (context) => {
  const slug = context.params?.slug as string;
  
  if (!slug) {
    return { notFound: true };
  }

  const doc = getPrintDocumentBySlug(slug);
  
  if (!doc) {
    console.warn(`❌ Print document not found for slug: "${slug}"`);
    return { notFound: true };
  }

  console.log(`✅ Successfully loaded print document: "${doc.title}" (${slug})`);

  return {
    props: { 
      doc 
    },
    revalidate: 60 * 60, // 1 hour ISR
  };
};