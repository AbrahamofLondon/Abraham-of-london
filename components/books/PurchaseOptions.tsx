// components/books/PurchaseOptions.tsx
'use client';

import * as React from "react";

interface PurchaseOptionsProps {
  book: {
    title?: string;
    slug?: string;
    availableFormats?: string[];
    isbn?: string;
    price?: number;
  };
}

const PurchaseOptions: React.FC<PurchaseOptionsProps> = ({ book }) => {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-32 rounded-lg bg-white/5 animate-pulse flex items-center justify-center">
        <p className="text-xs text-gray-500">Loading purchase options…</p>
      </div>
    );
  }

  // Safe array for formats
  const formats = Array.isArray(book.availableFormats) && book.availableFormats.length > 0
    ? book.availableFormats
    : ["Digital PDF", "Print Edition", "Audio Companion"];

  return (
    <div className="bg-gradient-to-br from-blue-900/10 to-indigo-900/10 rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4">Acquisition Options</h3>
      <div className="space-y-3">
        {formats.map((format, index) => (
          <button
            key={index}
            className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-gray-300 hover:text-gold hover:bg-white/10 transition-all flex justify-between items-center"
            type="button"
          >
            <span>{format}</span>
            <span className="text-xs text-gold">${((book.price || 29.99) + (index * 10)).toFixed(2)}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-500 text-center">
        Secure checkout • Institutional guarantee
      </p>
    </div>
  );
};

export default PurchaseOptions;