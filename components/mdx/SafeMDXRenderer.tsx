'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { simpleMdxComponents } from '@/lib/server/md-utils';

// Dynamically import to keep the initial bundle light
const MDXRemote = dynamic(
  () => import('next-mdx-remote').then((mod) => mod.MDXRemote),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse bg-white/5 h-64 rounded-sm" /> 
  }
);

interface SafeMDXRendererProps {
  /** The MDXRemoteSerializeResult from the server */
  source: any;
  /** Optional overrides for the institutional components */
  components?: Record<string, React.ComponentType<any>>;
}

export const SafeMDXRenderer: React.FC<SafeMDXRendererProps> = ({ 
  source, 
  components = {} 
}) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Combine institutional defaults with local overrides
  const combinedComponents = {
    ...simpleMdxComponents,
    ...components
  };

  if (!source) {
    return (
      <div className="font-mono text-[10px] text-red-500 uppercase tracking-widest">
        // Transmission Error: Content Missing
      </div>
    );
  }

  return (
    <div className="prose prose-invert prose-gold max-w-none">
      {!isMounted ? (
        // Static Placeholder: Prevents layout shift during hydration
        <div className="opacity-40 grayscale pointer-events-none">
          <div className="h-4 w-3/4 bg-white/10 mb-4" />
          <div className="h-4 w-full bg-white/10 mb-4" />
          <div className="h-4 w-5/6 bg-white/10" />
        </div>
      ) : (
        <MDXRemote {...source} components={combinedComponents} />
      )}
    </div>
  );
};

export default SafeMDXRenderer;