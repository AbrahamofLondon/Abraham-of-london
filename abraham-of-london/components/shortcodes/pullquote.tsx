import React from 'react';

export default function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-gray-500 pl-4 italic text-lg text-gray-700 my-6">
      {children}
    </blockquote>
  );
}
