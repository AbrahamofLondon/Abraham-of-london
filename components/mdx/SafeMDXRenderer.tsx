'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const MDXRemote = dynamic(
  () => import('next-mdx-remote').then((mod) => mod.MDXRemote),
  { ssr: false }
);

interface SafeMDXRendererProps {
  source: any;
  components?: Record<string, React.ComponentType>;
}

export const SafeMDXRenderer: React.FC<SafeMDXRendererProps> = ({ 
  source, 
  components = {} 
}) => {
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient || !source) {
    return (
      <div className="prose prose-invert max-w-none">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: source?.compiledSource || '' 
          }} 
        />
      </div>
    );
  }
  
  return <MDXRemote {...source} components={components} />;
};