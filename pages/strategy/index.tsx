// pages/startegy/index.tsx (Strategy Listing Page - SSR)

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetServerSideProps } from 'next';
import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

// Assuming your content is in 'content/startegy'
const STRATEGY_DIR = path.join(process.cwd(), 'content', 'startegy');

// Define the shape of your Strategy data for the list view
interface StrategyMeta {
  slug: string;
  title: string;
  version: string; // Strategy documents often have a version
  summary: string;
  date: string;
}

interface StrategyPageProps {
  strategies: StrategyMeta[];
}

/* -------------------- Data Fetching (getServerSideProps) -------------------- */

export const getServerSideProps: GetServerSideProps<StrategyPageProps> = async () => {
  let strategies: StrategyMeta[] = [];

  try {
    const filenames = fs.readdirSync(STRATEGY_DIR);

    strategies = filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map(filename => {
        const filePath = path.join(STRATEGY_DIR, filename);
        const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter } = matter(markdownWithMeta);
        
        return {
          slug: filename.replace('.mdx', ''),
          title: frontmatter.title || 'Untitled Strategy',
          version: frontmatter.version || 'V1.0',
          summary: frontmatter.summary || 'Click to view the full document.',
          date: frontmatter.date || '2024-01-01',
        } as StrategyMeta;
      })
      // Sort by date (newest first)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  } catch (error) {
    console.error("Error fetching strategy list for index page:", error);
    strategies = []; 
  }

  return {
    props: {
      strategies,
    },
  };
};

/* -------------------- Component Rendering -------------------- */

export default function StrategyIndex({ strategies }: StrategyPageProps){
  return (
    <>
      <Head>
        <title>Strategy Documents</title>
      </Head>
      <main className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-extrabold mb-10 border-b pb-4">Strategy Documents</h1>

        {strategies.length === 0 ? (
          <p className="text-gray-600">No strategy documents are currently available.</p>
        ) : (
          <div className="space-y-6">
            {strategies.map((strategy) => (
              <Link 
                key={strategy.slug} 
                href={`/startegy/${strategy.slug}`} 
                className="block border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold">{strategy.title}</h2>
                    <span className="text-sm font-medium px-3 py-1 bg-blue-100 rounded-full text-blue-700 flex-shrink-0">
                        {strategy.version}
                    </span>
                </div>
                <p className="text-gray-700 mb-3">{strategy.summary}</p>
                <div className="text-sm text-blue-600 font-semibold">
                    Read Document &rarr;
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}