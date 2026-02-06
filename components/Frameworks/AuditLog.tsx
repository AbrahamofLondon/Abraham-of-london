/* components/Frameworks/AuditLog.tsx */
import React from 'react';
import { History, Printer, Eye, User } from 'lucide-react';

interface AuditEntry {
  timestamp: string;
  action: 'VIEW' | 'PRINT';
  user: string;
}

export const AuditLog: React.FC<{ slug: string; userName: string }> = ({ slug, userName }) => {
  const [logs, setLogs] = React.useState<AuditEntry[]>([]);

  // Simulate or Fetch Audit History
  React.useEffect(() => {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action: 'VIEW',
      user: userName
    };
    // In production, this would be a POST to /api/audit/log
    setLogs(prev => [entry, ...prev].slice(0, 5));
  }, [slug, userName]);

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-5 font-mono text-[10px] uppercase tracking-wider">
      <div className="flex items-center gap-2 mb-4 text-white/40 border-b border-white/5 pb-2">
        <History size={12} />
        <span>Dossier Access Log</span>
      </div>
      <div className="space-y-3">
        {logs.map((log, i) => (
          <div key={i} className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-2 text-zinc-500">
              {log.action === 'PRINT' ? <Printer size={10} /> : <Eye size={10} />}
              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="text-right text-zinc-300">
              {log.action} BY {log.user}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};