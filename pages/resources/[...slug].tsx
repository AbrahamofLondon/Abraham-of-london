// pages/resources/[...slug].tsx - COMPLETE FIXED VERSION
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { getAllResources, getResourceBySlug } from "@/lib/contentlayer-helper";
import { serializeMDX } from "@/lib/mdx-utils";

type Props = {
  resource: {
    title: string;
    excerpt: string | null;
    description: string | null;
    date: string | null;
    coverImage: string | null;
    tags: string[];
    author: string | null;
    url: string;
    slug: string;
  };
  source: MDXRemoteSerializeResult;
};

const ResourcesCatchAllPage: NextPage<Props> = ({ resource, source }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Loading...">
        <main className="mx-auto max-w-3xl px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="text-gold/70">Loading...</div>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title={resource.title}>
      <Head>
        <link rel="canonical" href={`https://yourdomain.com${resource.url}`} />
        <meta name="description" content={resource.description || resource.excerpt || ""} />
        {resource.coverImage && (
          <>
            <meta property="og:image" content={resource.coverImage} />
            <meta name="twitter:image" content={resource.coverImage} />
          </>
        )}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Resources
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl lg:text-5xl">
            {resource.title}
          </h1>
          {resource.excerpt && (
            <p className="text-base leading-relaxed text-gray-200 sm:text-lg">
              {resource.excerpt}
            </p>
          )}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <article className="prose prose-invert prose-lg max-w-none">
          <MDXRemote {...source} components={mdxComponents} />
        </article>

        {resource.date && (
          <footer className="mt-12 border-t border-gold/10 pt-6">
            <p className="text-sm text-gold/60">
              Last updated: {new Date(resource.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </footer>
        )}
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const resources = getAllResources();

    // Build paths from all resources
    const paths = resources
      .filter((r: any) => {
        // Only include published resources
        if (r.draft === true) return false;
        
        // Must have a slug
        const slug = r.slug || r._raw?.flattenedPath;
        if (!slug) return false;

        // Exclude strategic-frameworks (has its own explicit route)
        const slugStr = String(slug).toLowerCase();
        if (slugStr.includes("strategic-frameworks")) return false;

        return true;
      })
      .map((r: any) => {
        // Get the slug from various possible locations
        const slug = r.slug || r._raw?.flattenedPath || "";
        
        // Clean and split the slug
        const cleanSlug = String(slug)
          .replace(/^resources\/?/, "") // Remove leading "resources/"
          .replace(/^\/+|\/+$/g, "") // Trim slashes
          .toLowerCase();

        const slugParts = cleanSlug.split("/").filter(Boolean);

        return {
          params: { slug: slugParts },
        };
      })
      .filter((p) => p.params.slug.length > 0); // Must have at least one slug part

    console.log(`📄 Resources: Generated ${paths.length} paths`);

    return {
      paths,
      fallback: false,
    };
  } catch (error) {
    console.error("❌ Error generating static paths for resources:", error);
    return {
      paths: [],
      fallback: false,
    };
  }
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  try {
    const slugArray = (ctx.params?.slug as string[]) || [];
    
    if (slugArray.length === 0) {
      return { notFound: true };
    }

    // Get the final slug (last part of the path)
    const finalSlug = slugArray[slugArray.length - 1];
    
    // Try to find the resource by slug
    const doc = getResourceBySlug(finalSlug);

    if (!doc) {
      console.warn(`⚠️ Resource not found for slug: ${finalSlug}`);
      return { notFound: true };
    }

    // Check if it's a draft
    if (doc.draft === true) {
      console.warn(`⚠️ Resource is draft: ${finalSlug}`);
      return { notFound: true };
    }

    // Extract content from various possible locations
    const content = 
      doc.body?.raw || 
      doc.body?.code || 
      doc.content || 
      "";

    if (!content || content.trim().length === 0) {
      console.warn(`⚠️ Resource "${doc.title}" has no content`);
      return { notFound: true };
    }

    // Serialize MDX
    const source = await serializeMDX(content);

    // Build the canonical URL
    const urlPath = `/resources/${slugArray.join("/")}`;

    return {
      props: {
        resource: {
          title: doc.title || "Untitled Resource",
          excerpt: doc.excerpt ?? doc.description ?? null,
          description: doc.description ?? doc.excerpt ?? null,
          date: doc.date ?? null,
          coverImage: doc.coverImage ?? null,
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          author: doc.author ?? null,
          url: urlPath,
          slug: finalSlug,
        },
        source,
      },
      revalidate: 3600, // ISR: regenerate every hour
    };
  } catch (error) {
    console.error("❌ Error in getStaticProps for resource:", ctx.params?.slug, error);
    return { notFound: true };
  }
};

export default ResourcesCatchAllPage;