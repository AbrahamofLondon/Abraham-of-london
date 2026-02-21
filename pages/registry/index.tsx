/* pages/registry/index.tsx — PAGES ROUTER VERSION */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import { getAllContentlayerDocs } from '@/lib/contentlayer-helper';
import RegistryView from '@/components/registry/RegistryView';
import RegistryLayout from '@/components/layout/RegistryLayout';
import { RegistryProvider } from '@/contexts/RegistryContext';

interface RegistryPageProps {
  initialDocs: any[];
  categories: string[];
}

const RegistryPage: NextPage<RegistryPageProps> = ({ initialDocs, categories }) => {
  return (
    <RegistryProvider initialDocs={initialDocs} categories={categories}>
      <RegistryLayout>
        <RegistryView />
      </RegistryLayout>
    </RegistryProvider>
  );
};

export const getStaticProps: GetStaticProps<RegistryPageProps> = async () => {
  const allDocs = getAllContentlayerDocs()
    .filter(d => !d.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ✅ Only include minimal data needed for the registry view
  const initialDocs = allDocs.map(d => ({
    title: d.title,
    slug: d.slug,
    category: d.category || 'General Lexicon',
    date: d.date,
    excerpt: d.excerpt ? d.excerpt.substring(0, 200) : null, // Truncate to save space
    type: d.type || d.kind || 'unknown',
    accessLevel: d.accessLevel || 'public',
    coverImage: d.coverImage || null,
  }));
  
  const categories = Array.from(
    new Set(initialDocs.map(d => d.category))
  ) as string[];

  return {
    props: {
      initialDocs,
      categories,
    },
    revalidate: 3600,
  };
};

export default RegistryPage;