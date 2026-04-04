/* components/admin/GovernanceLedger.tsx — IMMUTABLE AUDIT VIEW */
import React, { useEffect, useState } from 'react';
import { History, ClipboardList } from 'lucide-react';

interface LogEntry {
  id: string;
  action: string;
  target: string;
  createdAt: string;
  details: any;
}

export const GovernanceLedger = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const fetchLogs = async () => {
    const res = await fetch('/api/admin/governance-logs', {
      headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}` }
    });
    const data = await res.json();
    setLogs(data.logs || []);
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="mt-8 border border-zinc-800 bg-black p-4 font-mono">
      <div className="flex items-center gap-2 mb-4 text-zinc-500 text-xs font-bold uppercase tracking-widest">
        <History size={14} /> Sovereign Governance Ledger
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-left text-zinc-600 border-b border-zinc-900">
              <th className="pb-2">TIMESTAMP</th>
              <th className="pb-2">ACTION</th>
              <th className="pb-2">TARGET</th>
              <th className="pb-2 text-right">METRICS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {logs.map((log) => (
              <tr key={log.id} className="text-zinc-400">
                <td className="py-2 text-zinc-500">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="py-2 font-bold text-zinc-300">{log.action}</td>
                <td className="py-2">{log.target}</td>
                <td className="py-2 text-right italic text-zinc-500">
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};