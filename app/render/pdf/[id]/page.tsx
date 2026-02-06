// app/render/pdf/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getPDFRegistrySource } from '@/scripts/pdf/pdf-registry.source';

interface Props {
  params: { id: string };
}

export default async function PDFRenderPage({ params }: Props) {
  // In Next.js 15+, params should be awaited if this is a dynamic route
  const { id } = await params; 
  const registry = getPDFRegistrySource();
  const pdf = registry.find((item) => item.id === id);

  if (!pdf) return notFound();

  return (
    <div className="pdf-canvas bg-[#fdfaf3] text-[#050505] font-serif w-[210mm] min-h-[297mm] mx-auto overflow-hidden relative">
      {/* 1. Header Section */}
      <header className="p-12 pb-8 border-b-[0.5pt] border-[#D4AF37]/30">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#D4AF37] font-sans font-bold">
              {pdf.tier === 'free' ? 'Public Release' : 'Intelligence Brief'}
            </span>
            <h1 className="text-5xl font-medium leading-tight font-serif">
              {pdf.title}
            </h1>
            <p className="text-sm font-sans tracking-wide text-gray-500 uppercase">
              {pdf.category || 'Strategic Framework'}
            </p>
          </div>
          <div className="w-16 h-16 bg-[#050505] flex items-center justify-center">
             <span className="text-[#fdfaf3] text-2xl font-serif">A</span>
          </div>
        </div>
      </header>

      {/* 2. Content Body */}
      <main className="p-12 pt-10 min-h-[220mm]">
        <div className="prose prose-slate max-w-none">
          {/* Metadata Block */}
          <div className="grid grid-cols-3 gap-8 mb-12 border-y border-gray-100 py-6 font-sans">
             <div>
                <span className="block text-[0.5rem] uppercase text-gray-400">Reference ID</span>
                <span className="text-xs font-mono">{pdf.id}</span>
             </div>
             <div>
                <span className="block text-[0.5rem] uppercase text-gray-400">Authority</span>
                <span className="text-xs">{pdf.author}</span>
             </div>
             <div>
                <span className="block text-[0.5rem] uppercase text-gray-400">Version</span>
                <span className="text-xs">{pdf.version}</span>
             </div>
          </div>

          <div className="space-y-8">
            <section className="border-l-2 border-[#D4AF37] pl-8 py-2">
              <h2 className="text-2xl font-serif font-medium mt-0">Strategic Intent</h2>
              <p className="text-lg leading-relaxed text-gray-700 italic">
                {pdf.description || "This framework serves as a canonical reference for the London-based intelligence portfolio."}
              </p>
            </section>

            <div className="grid grid-cols-2 gap-12 mt-12">
               <div className="p-6 bg-gray-50 border border-gray-100 rounded-sm">
                  <h3 className="text-sm font-sans uppercase tracking-widest text-[#D4AF37] mt-0 font-bold">Core Principles</h3>
                  <ul className="text-sm space-y-2 list-none p-0 mt-4">
                    <li>• Systematic Integration</li>
                    <li>• Absolute Accountability</li>
                    <li>• Institutional Continuity</li>
                  </ul>
               </div>
               <div className="p-6 bg-[#050505] text-[#fdfaf3] rounded-sm shadow-xl">
                  <h3 className="text-sm font-sans uppercase tracking-widest text-[#f59e0b] mt-0 font-bold">Required Action</h3>
                  <p className="text-xs leading-relaxed opacity-80 mt-4">
                    Review this brief against current operational cadences to ensure alignment with the overarching legacy architecture.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="p-12 pt-0 absolute bottom-0 w-full">
        <div className="border-t border-gray-100 pt-8 flex justify-between items-end">
          <div className="text-[0.625rem] uppercase font-sans text-gray-400">
            <p>Abraham of London © {new Date().getFullYear()}</p>
            <p className="mt-1 font-mono tracking-normal">STRICTLY CONFIDENTIAL // {pdf.tier.toUpperCase()}</p>
          </div>
          <div className="text-right">
             <span className="text-[0.625rem] font-sans text-gray-300 uppercase tracking-widest">Printed in London, UK</span>
          </div>
        </div>
      </footer>

      {/* Raw HTML Style tag for Print Rules (Server Component Friendly) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
          }
          .pdf-canvas {
            box-shadow: none;
          }
        }
      `}} />
    </div>
  );
}