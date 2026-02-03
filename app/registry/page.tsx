import React from 'react';
import Layout from '@/components/Layout';
import { getAllContentlayerDocs, toUiDoc } from '@/lib/contentlayer-helper';
import RegistryView from './RegistryView';

// Next.js 16 Metadata
export const metadata = {
  title: 'Institutional Registry | Abraham of London',
  description: 'Sovereign Archive of Intelligence Briefs and Institutional Assets.',
};

export default async function RegistryPage() {
  // Institutional Data Fetching (Server-Side)
  const allDocs = getAllContentlayerDocs().filter(d => !d.draft);
  const initialDocs = allDocs.map(toUiDoc);
  
  // Extract unique categories for the filter bar
  const categories = Array.from(
    new Set(initialDocs.map(d => d.category).filter(Boolean))
  ) as string[];

  return (
    <Layout title="Institutional Registry">
      <RegistryView initialDocs={initialDocs} categories={categories} />
    </Layout>
  );
}