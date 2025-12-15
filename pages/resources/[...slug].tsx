import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import { allResources } from "contentlayer/generated";

type Props = { 
  doc: any; 
  canonicalPath: string;
  error?: string;
};

// SAFE helpers
function safeString(value: any): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function safeSlug(value: any): string {
  const str = safeString(value);
  return str.replace(/\/index$/, "").replace(/^resources\//, "");
}

function normalizeSlug(slug: any): string[] {
  if (!slug) return [];
  if (Array.isArray(slug)) return slug.map(s => safeString(s));
  return [safeString(slug)];
}

const ResourceDocPage: NextPage<Props> = ({ doc, canonicalPath, error }) => {
  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Resource</h1>
          <p className="mt-2 text-gray-600">{error || "Document not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/resources"
      label="Resources"
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    // Get valid resources only
    const validResources = (allResources || []).filter(resource => {
      // Skip drafts in production
      if (process.env.NODE_ENV === 'production') {
        if (resource.draft === true || resource.draft === "true") return false;
      }
      
      // Must have a valid slug
      const slug = safeSlug(resource.slug || resource._raw?.flattenedPath);
      return !!slug && slug !== "index" && slug !== "";
    });

    const paths = validResources.map(resource => {
      const slug = safeSlug(resource.slug || resource._raw?.flattenedPath);
      const slugParts = slug.split('/').filter(part => part && part !== 'index');
      
      return {
        params: { slug: slugParts }
      };
    });

    console.log(`✅ Generated ${paths.length} paths for resources`);
    return { 
      paths, 
      fallback: false
    };
  } catch (error) {
    console.error("❌ Error generating static paths for resources:", error);
    return { paths: [], fallback: false };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slugParam = normalizeSlug(params?.slug);
    
    if (!slugParam.length) {
      return {
        props: {
          doc: null,
          canonicalPath: "",
          error: "No slug provided"
        }
      };
    }

    const targetSlug = slugParam.join('/');
    
    // Find resource
    let resource = (allResources || []).find(r => {
      if (process.env.NODE_ENV === 'production') {
        if (r.draft === true || r.draft === "true") return false;
      }
      
      const docSlug = safeSlug(r.slug || r._raw?.flattenedPath);
      return docSlug === targetSlug;
    });

    if (!resource) {
      console.warn(`❌ Resource not found for slug: ${targetSlug}`);
      return {
        props: {
          doc: null,
          canonicalPath: `/resources/${targetSlug}`,
          error: `Resource "${targetSlug}" not found`
        }
      };
    }

    // Create a clean, safe document
    const cleanDoc = {
      ...resource,
      slug: safeString(resource.slug || targetSlug),
      title: safeString(resource.title || "Untitled Resource"),
      date: safeString(resource.date || ""),
      excerpt: safeString(resource.excerpt || resource.description || ""),
      description: safeString(resource.description || resource.excerpt || ""),
      // Ensure body.code exists
      body: resource.body?.code ? resource.body : { code: "" }
    };

    console.log(`✅ Serving resource: ${cleanDoc.title} (${targetSlug})`);
    
    return {
      props: {
        doc: cleanDoc,
        canonicalPath: `/resources/${targetSlug}`,
      }
    };
  } catch (error) {
    console.error(`💥 Error in getStaticProps for resources/${params?.slug}:`, error);
    return {
      props: {
        doc: null,
        canonicalPath: "",
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    };
  }
};

export default ResourceDocPage;