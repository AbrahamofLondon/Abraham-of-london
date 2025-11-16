import type { NextPage } from "next";
import Layout from "@/components/Layout";

const ContentPage: NextPage = () => {
  return (
    <Layout title="Content Library">
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Content Library</h1>
        <p className="text-gray-600 mb-6">
          A unified content index is coming soon.
        </p>
        <p className="text-gray-500 text-sm">
          For now, please use the navigation to access books, blog posts,
          downloads, and strategy content directly.
        </p>
      </main>
    </Layout>
  );
};

// SAFE FIX: Add this to prevent the build error
export async function getStaticProps() {
  // Return completely safe, serializable props
  return {
    props: {
      // No data that could contain undefined values
    },
  };
}

export default ContentPage;