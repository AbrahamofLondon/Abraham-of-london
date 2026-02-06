/* app/registry/page.tsx */
import React from 'react';
import { getAllContentlayerDocs, toUiDoc } from '@/lib/contentlayer-helper';
import RegistryView from './RegistryView';
import RegistryLayout from '@/components/layout/RegistryLayout'; // Fixed path

export const metadata = {
  title: 'Institutional Registry | Abraham of London',
  description: 'Sovereign Archive of Intelligence Briefs and Institutional Assets.',
};

export default async function RegistryPage() {
  const allDocs = getAllContentlayerDocs()
    .filter(d => !d.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const initialDocs = allDocs.map(toUiDoc);
  
  const categories = Array.from(
    new Set(initialDocs.map(d => d.category || 'General Lexicon'))
  ) as string[];

  return (
    <RegistryLayout>
      <RegistryView initialDocs={initialDocs} categories={categories} />
    </RegistryLayout>
  );
}