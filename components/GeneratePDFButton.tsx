"use client";

import { useState } from "react";

interface GeneratePDFButtonProps {
  documentId?: string; // e.g., 'ultimate-purpose-of-man'
  label?: string;
}

export default function GeneratePDFButton({ 
  documentId = "ultimate-purpose-of-man", 
  label = "Generate Premium PDF" 
}: GeneratePDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const generatePDF = async () => {
    setIsGenerating(true);
    setMessage(null);

    try {
      // 1. Payload Alignment with Hardened API
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: documentId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          text: `✅ Successfully generated: ${data.filename}`, 
          type: "success" 
        });
        
        // 2. Controlled Refresh
        // Reloading ensures the IQPDF viewer or download links fetch the fresh file
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ 
          text: `❌ Error: ${data.error || "Generation failed"}`, 
          type: "error" 
        });
      }
    } catch (error) {
      setMessage({ 
        text: `❌ Network error: ${error instanceof Error ? error.message : "Internal Failure"}`, 
        type: "error" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="group relative flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-4 font-bold text-white transition-all hover:from-amber-700 hover:to-orange-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating...
          </span>
        ) : (
          label
        )}
      </button>

      {/* 3. A11y Friendly Feedback */}
      <div aria-live="polite" className="h-6">
        {message && (
          <p className={`text-sm font-medium ${message.type === "success" ? "text-emerald-500" : "text-rose-500"}`}>
            {message.text}
          </p>
        )}
      </div>

      <p className="max-w-[280px] text-center text-[10px] uppercase tracking-widest text-gray-500">
        Targets Institutional Registry ID: <span className="font-mono text-amber-500/80">{documentId}</span>
      </p>
    </div>
  );
}