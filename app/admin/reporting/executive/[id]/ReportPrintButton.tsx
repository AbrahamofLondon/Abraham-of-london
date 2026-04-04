'use client';

import React from 'react';
import { Printer, Loader2 } from 'lucide-react';

interface ReportPrintButtonProps {
  className?: string;
}

export default function ReportPrintButton({ className = "" }: ReportPrintButtonProps) {
  const [isPrinting, setIsPrinting] = React.useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    // Small delay to allow the UI to update
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className={`
        flex items-center gap-2 px-4 py-2 border border-neutral-200 bg-white 
        text-neutral-600 text-[8px] font-mono uppercase tracking-wider 
        hover:border-neutral-300 hover:text-neutral-800 
        transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isPrinting ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Printer className="w-3 h-3" />
      )}
      <span>{isPrinting ? "Preparing..." : "Print Report"}</span>
    </button>
  );
}