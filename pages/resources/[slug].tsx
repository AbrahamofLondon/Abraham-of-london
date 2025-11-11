// pages/resources/[slug].tsx
import { GetStaticProps, GetStaticPaths, InferGetStaticPropsType } from '...';
import { allResources } from '...';
import SiteLayout from '@/components/SiteLayout';
import { components } from '...'; // Fixed import
import { useMDXComponent } from '...';

interface ResourcePageProps {
  resource: {
    code: string;
    frontmatter: {
      title: string;
      description: string;
      date: string;
      author: string;
      category?: string;
      tags?: string[];
    };
    slug: string;
  };
}

export default function ResourcePage({
  resource,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const ResourceContent = useMDXComponent(resource.code);

  return (
    <SiteLayout
      pageTitle={`${resource.frontmatter.title} - Resources - Abraham of London`}
      metaDescription={resource.frontmatter.description}
      canonicalUrl={`https://abrahamoflondon.com/resources/${resource.slug}`}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <article className="prose prose-lg max-w-none">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4">{resource.frontmatter.title}</h1>
            <p className="text-xl text-gray-600 mb-4">{resource.frontmatter.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>By {resource.frontmatter.author}</span>
              <span>{resource.frontmatter.date}</span>
              {resource.frontmatter.category && <span>{resource.frontmatter.category}</span>}
            </div>
          </header>

          <div className="content">
            <ResourceContent components={components} />
          </div>

          {resource.frontmatter.tags && resource.frontmatter.tags.length > 0 && (
            <footer className="mt-8 pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                {resource.frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </footer>
          )}
        </article>
      </div>
    </SiteLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allResources.map((resource) => ({
    params: { slug: resource.slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const resource = allResources.find((resource) => resource.slug === params?.slug);

  if (!resource) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      resource: {
        code: resource.body.code,
        frontmatter: {
          title: resource.title,
          description: resource.description || resource.excerpt || '',
          date: resource.date,
          author: resource.author,
          category: resource.category,
          tags: resource.tags || [],
        },
        slug: resource.slug,
      },
    },
    revalidate: 3600,
  };
};