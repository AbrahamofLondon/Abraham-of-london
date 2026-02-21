/* pages/registry/index.tsx — PAGES ROUTER VERSION */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import { getAllContentlayerDocs, toUiDoc } from '@/lib/contentlayer-helper';
import RegistryView from '@/components/registry/RegistryView';
import RegistryLayout from '@/components/layout/RegistryLayout';
import { RegistryProvider } from '@/contexts/RegistryContext'; // Add provider

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

  const initialDocs = allDocs.map(toUiDoc);
  
  const categories = Array.from(
    new Set(initialDocs.map(d => d.category || 'General Lexicon'))
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