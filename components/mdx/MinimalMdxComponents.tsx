/* components/mdx/MinimalMdxComponents.tsx */
import React from 'react';

export const MinimalMdxComponents = {
  // Basic HTML elements (essential for MDX)
  h1: (props: any) => <h1 className="text-4xl font-bold my-4" {...props} />,
  h2: (props: any) => <h2 className="text-3xl font-bold my-3" {...props} />,
  h3: (props: any) => <h3 className="text-2xl font-bold my-2" {...props} />,
  h4: (props: any) => <h4 className="text-xl font-bold my-2" {...props} />,
  p: (props: any) => <p className="my-3 leading-relaxed" {...props} />,
  a: (props: any) => <a className="text-amber-500 hover:text-amber-400 underline" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-6 my-3" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-6 my-3" {...props} />,
  li: (props: any) => <li className="my-1" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-amber-500 pl-4 italic my-4" {...props} />,
  code: (props: any) => <code className="bg-gray-800 rounded px-1 py-0.5 font-mono text-sm" {...props} />,
  pre: (props: any) => <pre className="bg-gray-900 rounded p-4 overflow-x-auto my-4" {...props} />,
  img: (props: any) => <img className="rounded my-4 max-w-full" {...props} />,
  hr: (props: any) => <hr className="my-6 border-gray-700" {...props} />,
  table: (props: any) => <table className="min-w-full divide-y divide-gray-700 my-4" {...props} />,
  thead: (props: any) => <thead className="bg-gray-800" {...props} />,
  tbody: (props: any) => <tbody className="divide-y divide-gray-700" {...props} />,
  tr: (props: any) => <tr {...props} />,
  th: (props: any) => <th className="px-3 py-2 text-left font-semibold" {...props} />,
  td: (props: any) => <td className="px-3 py-2" {...props} />,
  
  // Your custom components with safe fallbacks
  Badge: (props: any) => <span className="inline-block bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-sm" {...props} />,
  Callout: (props: any) => (
    <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 p-4 my-4" {...props} />
  ),
  Note: (props: any) => (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 my-4" {...props} />
  ),
  Quote: (props: any) => (
    <blockquote className="border-l-4 border-amber-500 pl-6 italic text-xl my-8" {...props} />
  ),
  // Add other components as needed
};

export default MinimalMdxComponents;