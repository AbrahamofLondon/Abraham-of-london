import React from 'react';
import auditData from '../../public/system/intel-audit-log.json';

interface AuditEntry {
  id: string;
  title: string;
  tier: string;
  type: string;
  words?: number;
  [key: string]: unknown;
}

interface AuditData {
  generatedAt: string;
  totalAssets: number;
  tierDistribution: {
    "inner-circle": number;
    public: number;
    member: number;
    "inner-circle-elite": number;
    private: number;
  };
  entries: AuditEntry[];
}

const IntelDashboard = () => {
  // ✅ Destructure the actual JSON properties
  const { totalAssets, tierDistribution, generatedAt, entries } = auditData as AuditData;

  const lexiconCount = entries.filter(i => i.type === 'LEXICON').length;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <header className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abraham of London</h1>
          <p className="text-slate-500 uppercase text-xs tracking-widest mt-1">
            Institutional Portfolio Intelligence — Last Audit: {new Date(generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 block uppercase">Portfolio Health</span>
          <span className="text-green-600 font-mono font-bold">STABLE</span>
        </div>
      </header>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <span className="text-slate-500 text-sm uppercase font-semibold">Total Inventory</span>
          <div className="text-4xl font-light mt-2">{totalAssets}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
          <span className="text-slate-500 text-sm uppercase font-semibold">Inner Circle</span>
          <div className="text-4xl font-light mt-2">{tierDistribution['inner-circle'] || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-green-500">
          <span className="text-slate-500 text-sm uppercase font-semibold">Public Access</span>
          <div className="text-4xl font-light mt-2">{tierDistribution.public || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <span className="text-slate-500 text-sm uppercase font-semibold">Lexicon Terms</span>
          <div className="text-4xl font-light mt-2">{lexiconCount}</div>
        </div>
      </div>

      {/* Inventory Control Ledger */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
          Institutional Asset Ledger
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-[10px] uppercase text-slate-400">Brief ID / Title</th>
              <th className="p-4 text-[10px] uppercase text-slate-400">Security Tier</th>
              <th className="p-4 text-[10px] uppercase text-slate-400">Class</th>
              <th className="p-4 text-[10px] uppercase text-slate-400">Wordcount</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-slate-800">{item.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.id}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.tier === 'public' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {item.tier}
                  </span>
                </td>
                <td className="p-4 text-xs font-semibold text-slate-500">{item.type}</td>
                <td className="p-4 text-xs tabular-nums text-slate-600">
                  {item.words?.toLocaleString() || '0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IntelDashboard;