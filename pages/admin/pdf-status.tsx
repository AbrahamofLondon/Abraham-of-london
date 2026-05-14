/* pages/admin/pdf-status.tsx — ASSET INTEGRITY & FILESYSTEM VERIFICATION */
import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Head from 'next/head';
import fs from 'fs/promises';
import path from 'path';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminPage } from "@/lib/access/server";
import { ShieldCheck, ShieldAlert, HardDrive, FileSearch, RefreshCcw } from 'lucide-react';

interface PDFStatus {
  name: string;
  exists: boolean;
  size?: number;
  lastModified?: string;
}

interface Props {
  pdfs: PDFStatus[];
  stats: {
    total: number | null;
    existing: number | null;
    missing: number | null;
  };
  scanError: string | null;
}

export default function PDFStatusDashboard({ pdfs, stats, scanError }: Props) {
  const [filter, setFilter] = useState<'all' | 'existing' | 'missing'>('all');

  const filteredPDFs = pdfs.filter(pdf => {
    if (filter === 'all') return true;
    if (filter === 'existing') return pdf.exists;
    if (filter === 'missing') return !pdf.exists;
    return true;
  });

  return (
    <AdminLayout>
      <Head>
        <title>Asset Integrity | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">Asset integrity</p>
          <h1 className="mt-3 font-serif text-3xl text-white">Portfolio Integrity</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">
            Filesystem verification across indexed PDF assets. Discrepancies here affect brief accessibility.
          </p>
        </section>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Indexed"
            value={stats.total}
            icon={<HardDrive className="h-4 w-4 text-blue-400" />}
          />
          <StatCard
            label="Verified Active"
            value={stats.existing}
            icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
            tone="success"
          />
          <StatCard
            label="Critical Failures"
            value={stats.missing}
            icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
            tone={typeof stats.missing === "number" && stats.missing > 0 ? 'error' : 'neutral'}
          />
        </div>

        {scanError ? (
          <div className="border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100/80">
            PDF filesystem scan unavailable: {scanError}
          </div>
        ) : null}

        {/* Filter + Re-Scan */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 border border-white/10 bg-black/30 p-1">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Assets</FilterButton>
            <FilterButton active={filter === 'existing'} onClick={() => setFilter('existing')}>Verified</FilterButton>
            <FilterButton active={filter === 'missing'} onClick={() => setFilter('missing')}>Missing</FilterButton>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white/60 transition-colors hover:border-white/20 hover:text-white/80"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Re-Scan Directory
          </button>
        </div>

        {/* Assets Table */}
        <section className="border border-white/10 bg-zinc-950/70">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-black/30">
                  <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">File designation</th>
                  <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Status</th>
                  <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Size</th>
                  <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Last modified</th>
                </tr>
              </thead>
              <tbody>
                {filteredPDFs.length > 0 ? (
                  filteredPDFs.map((pdf, index) => (
                    <tr key={index} className={`border-t border-white/5 align-top transition-colors hover:bg-white/5 ${!pdf.exists ? 'bg-rose-950/10' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <FileSearch className={`h-4 w-4 shrink-0 ${pdf.exists ? 'text-white/30' : 'text-rose-400/60'}`} />
                          <span className="text-sm text-white/80">{pdf.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                          pdf.exists
                            ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                            : 'border border-rose-500/30 bg-rose-500/10 text-rose-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${pdf.exists ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {pdf.exists ? 'Verified' : 'Missing'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-white/45">
                        {pdf.size ? `${(pdf.size / 1024).toFixed(1)} KB` : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-white/40">
                        {pdf.lastModified ? new Date(pdf.lastModified).toLocaleDateString('en-GB') : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-white/35">
                      No matching asset records in the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Infrastructure note */}
        <section className="border border-white/10 bg-zinc-950/70 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/60" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/40">Infrastructure note</p>
              <p className="mt-2 text-sm leading-6 text-white/55">
                This surface polls <code className="rounded bg-white/5 px-1 font-mono text-[11px] text-white/50">/public/pdfs/</code> for indexed brief assets.
                If a file is marked Missing, the generation pipeline must be re-initialised via the PDF Dashboard.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

/* Helper Components */
const StatCard = ({ label, value, icon, tone }: { label: string; value: number | null; icon: React.ReactNode; tone?: string }) => (
  <div className="border border-white/10 bg-zinc-950/70 p-5 flex items-center justify-between">
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p className={`mt-2 text-3xl font-serif font-light ${tone === 'error' && typeof value === "number" && value > 0 ? 'text-rose-400' : tone === 'success' ? 'text-emerald-400' : 'text-white'}`}>
        {typeof value === "number" ? value : "Unavailable"}
      </p>
    </div>
    <div className="rounded border border-white/10 bg-white/5 p-3">
      {icon}
    </div>
  </div>
);

const FilterButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
      active
        ? 'bg-white/10 text-white/90'
        : 'text-white/35 hover:text-white/60'
    }`}
  >
    {children}
  </button>
);

/* Server-side Assets Pulse */
export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const guard = await requireAdminPage<Props>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  try {
    const pdfDir = path.join(process.cwd(), 'public', 'pdfs');
    let pdfs: PDFStatus[] = [];

    try {
      await fs.access(pdfDir);
      const files = await fs.readdir(pdfDir);
      const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

      pdfs = await Promise.all(
        pdfFiles.map(async (file) => {
          const filePath = path.join(pdfDir, file);
          const stat = await fs.stat(filePath);
          return {
            name: file,
            exists: true,
            size: stat.size,
            lastModified: stat.mtime.toISOString(),
          };
        })
      );
    } catch (e) {
      return {
        props: {
          pdfs: [],
          stats: { total: null, existing: null, missing: null },
          scanError: e instanceof Error ? e.message : "PDF directory missing or inaccessible",
        },
      };
    }

    return {
      props: {
        pdfs,
        stats: {
          total: pdfs.length,
          existing: pdfs.filter(p => p.exists).length,
          missing: pdfs.filter(p => !p.exists).length,
        },
        scanError: null,
      },
    };
  } catch (error) {
    return {
      props: {
        pdfs: [],
        stats: { total: null, existing: null, missing: null },
        scanError: error instanceof Error ? error.message : "PDF filesystem scan failed",
      },
    };
  }
};
