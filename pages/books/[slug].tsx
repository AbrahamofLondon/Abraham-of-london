// pages/books/[slug].tsx — HARDENED (Gate Integrated)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { MDXLayoutRenderer } from "@/components/mdx/MDXLayoutRenderer";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import AccessGate from "@/components/AccessGate";

// Governance
import { normalizeSlug } from "@/lib/content/shared";
import { useAccess, type Tier } from "@/hooks/useAccess";

type Props = { book: any | null };

// ... loadAllBooks, getStaticPaths, getStaticProps (Stable from previous iteration) ...

const BookPage: NextPage<Props> = ({ book }) => {
  const { hasClearance, isValidating, verify } = useAccess();
  
  if (!book) return null;

  const title = book.title || "Intelligence Brief";
  const requiredTier = (book.accessLevel || 'public') as Tier;
  const isAuthorized = hasClearance(requiredTier);

  return (
    <Layout title={title} description={book.description || book.excerpt || ""} className="bg-black">
      <Head>
        <title>{title} | Abraham of London</title>
        <link rel="canonical" href={`https://www.abrahamoflondon.org/books/${book.slug}`} />
      </Head>

      <header className="border-b border-white/5 bg-zinc-950/50">
        <div className="mx-auto max-w-5xl px-6 py-24 lg:py-32">
          <div className="font-mono text-[10px] text-gold uppercase tracking-[0.5em] mb-8">
            Literature // {book.category || "Volume"}
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic text-white leading-tight">
            {title}
          </h1>
          {book.subtitle && (
            <p className="mt-8 text-xl text-white/40 font-light max-w-2xl leading-relaxed italic">
              {book.subtitle}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 lg:py-20">
        <BriefSummaryCard 
          category={book.category} 
          classification={requiredTier}
          date={book.date}
          author={book.author}
        />
        
        <div className="relative mt-12">
          {!isAuthorized && !isValidating ? (
            <div className="relative min-h-[500px]">
              {/* Visual abstraction for locked state */}
              <div className="select-none blur-2xl opacity-5 pointer-events-none grayscale">
                <MDXLayoutRenderer code={book.body?.code} />
              </div>
              
              <AccessGate 
                title="Classified Volume"
                message={`Decryption of "${title}" requires ${requiredTier.replace('-', ' ')} clearance.`}
                requiredTier={requiredTier}
                onUnlocked={() => verify()}
              />
            </div>
          ) : (
            <div className={`prose prose-invert prose-gold max-w-none transition-opacity duration-1000 ${isValidating ? 'opacity-0' : 'opacity-100'}`}>
              <MDXLayoutRenderer code={book.body?.code} />
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default BookPage;