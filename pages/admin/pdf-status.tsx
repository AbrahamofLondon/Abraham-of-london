/* pages/admin/pdf-status.tsx — ASSET INTEGRITY & FILESYSTEM VERIFICATION */
import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Head from 'next/head';
import fs from 'fs/promises';
import path from 'path';
import AdminLayout from '@/components/AdminLayout';
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
    total: number;
    existing: number;
    missing: number;
  };
}

export default function PDFStatusDashboard({ pdfs, stats }: Props) {
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
        <title>Asset Integrity | Abraham of London</title>
      </Head>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-black text-gray-900 tracking-tight">Portfolio Integrity</h1>
            <p className="text-gray-500 text-sm mt-1 font-mono uppercase tracking-widest">
              Filesystem Verification • 75 Core Briefs
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
          >
            <RefreshCcw size={14} />
            Re-Scan Directory
          </button>
        </div>

        {/* Tactical Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Total Indexed" 
            value={stats.total} 
            icon={<HardDrive className="text-blue-500" />} 
          />
          <StatCard 
            label="Verified Active" 
            value={stats.existing} 
            icon={<ShieldCheck className="text-emerald-500" />} 
            status="success"
          />
          <StatCard 
            label="Critical Failures" 
            value={stats.missing} 
            icon={<ShieldAlert className="text-rose-500" />} 
            status={stats.missing > 0 ? 'error' : 'neutral'}
          />
        </div>

        {/* Filter Navigation */}
        <div className="flex gap-2 p-1.5 bg-gray-200/50 rounded-2xl w-fit">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Assets</FilterButton>
          <FilterButton active={filter === 'existing'} onClick={() => setFilter('existing')}>Verified</FilterButton>
          <FilterButton active={filter === 'missing'} onClick={() => setFilter('missing')}>Missing</FilterButton>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">File Designation</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Security Status</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payload Size</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPDFs.length > 0 ? (
                  filteredPDFs.map((pdf, index) => (
                    <tr key={index} className={`group transition-colors ${pdf.exists ? 'hover:bg-gray-50/80' : 'bg-rose-50/30'}`}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <FileSearch size={18} className={pdf.exists ? 'text-gray-400' : 'text-rose-400'} />
                          <span className="text-sm font-bold text-gray-900">{pdf.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          pdf.exists ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700 animate-pulse'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${pdf.exists ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {pdf.exists ? 'Active' : 'Missing'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs font-mono text-gray-500">
                        {pdf.size ? `${(pdf.size / 1024).toFixed(1)} KB` : '---'}
                      </td>
                      <td className="px-8 py-5 text-xs text-gray-400">
                        {pdf.lastModified ? new Date(pdf.lastModified).toLocaleDateString('en-GB') : 'Unknown'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-serif italic text-lg">
                      No matching intelligence briefs found in the current sector.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Footer Note */}
        <div className="p-6 bg-blue-50/50 rounded-[1.5rem] border border-blue-100/50 flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">Infrastructure Protocol</h4>
            <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
              This system is polling <code>/public/pdfs/</code> in real-time. Discrepancies here will directly affect the accessibility of your 75 intelligence briefs. If a file is marked <strong>Missing</strong>, the generation pipeline must be re-initialized.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* Helper Components */
const StatCard = ({ label, value, icon, status }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-4xl font-serif font-black ${status === 'error' ? 'text-rose-600' : 'text-gray-900'}`}>{value}</p>
    </div>
    <div className="p-4 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">
      {icon}
    </div>
  </div>
);

const FilterButton = ({ active, onClick, children }: any) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
      active ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {children}
  </button>
);

/* Server-side Assets Pulse */
export const getServerSideProps: GetServerSideProps<Props> = async () => {
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
      console.error("Directory missing or inaccessible");
    }

    return {
      props: {
        pdfs,
        stats: {
          total: pdfs.length,
          existing: pdfs.filter(p => p.exists).length,
          missing: pdfs.filter(p => !p.exists).length,
        },
      },
    };
  } catch (error) {
    return { props: { pdfs: [], stats: { total: 0, existing: 0, missing: 0 } } };
  }
};