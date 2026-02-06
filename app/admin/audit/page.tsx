// app/admin/audit/page.tsx
import { getPrisma } from "@/lib/prisma";
import { Shield, Clock, User, AlertCircle, Database } from "lucide-react";

export default async function AuditDashboard() {
  // Use getPrisma instead of direct prisma import
  const prisma = getPrisma();
  
  try {
    // Check if we have a real Prisma client or a stub
    const isPrismaAvailable = prisma && prisma.systemAuditLog && typeof prisma.systemAuditLog.findMany === "function";
    
    if (!isPrismaAvailable) {
      return (
        <div className="p-8 bg-black min-h-screen text-zinc-300 font-mono">
          <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-6">
            <Shield className="text-amber-500" size={24} />
            <h1 className="text-xl uppercase tracking-[0.4em] text-white">System Forensic Ledger</h1>
          </div>
          
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="text-amber-400" size={24} />
              <h3 className="text-lg font-medium text-amber-300">Prisma Client Unavailable</h3>
            </div>
            <p className="text-amber-200/80 mb-4">
              The Prisma client could not be generated. This usually happens during build time.
            </p>
            <div className="text-sm text-amber-200/60">
              <p className="mb-2">To fix this:</p>
              <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                <li>Run <code className="bg-black/30 px-2 py-1 rounded">npx prisma generate</code> in development</li>
                <li>Ensure no processes are locking the Prisma files</li>
                <li>Check Windows file permissions on the node_modules folder</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // If we get here, Prisma is available
    const logs = await prisma.systemAuditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    // Helper function to format metadata
    const formatMetadata = (metadata: string | null) => {
      if (!metadata) return 'No metadata';
      try {
        const parsed = JSON.parse(metadata);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return metadata;
      }
    };

    return (
      <div className="p-8 bg-black min-h-screen text-zinc-300 font-mono">
        <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-6">
          <Shield className="text-amber-500" size={24} />
          <h1 className="text-xl uppercase tracking-[0.4em] text-white">System Forensic Ledger</h1>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No audit logs found. The system will log actions as they occur.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log: any) => (
              <div key={log.id} className="grid grid-cols-12 gap-4 p-3 border border-white/5 hover:bg-zinc-950 transition-colors text-[10px]">
                <div className="col-span-1 text-zinc-600 flex items-center gap-2">
                  <Clock size={10} /> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                
                <div className="col-span-2">
                  <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-tighter ${
                    log.severity === 'error' ? 'bg-red-500/20 text-red-400' :
                    log.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                    log.severity === 'info' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {log.severity}
                  </div>
                </div>
                
                <div className="col-span-2 text-amber-400 font-bold uppercase tracking-tighter truncate">
                  {log.action || 'UNKNOWN'}
                </div>
                
                <div className="col-span-1 text-zinc-500 text-center">
                  {log.resourceType || 'system'}
                </div>
                
                <div className="col-span-2 text-zinc-400 truncate">
                  {log.actorEmail ? (
                    <div className="flex items-center gap-1">
                      <User size={10} />
                      {log.actorEmail}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <AlertCircle size={10} />
                      SYSTEM
                    </div>
                  )}
                </div>
                
                <div className="col-span-3 text-zinc-400 font-mono text-[9px] truncate">
                  {formatMetadata(log.metadata)}
                </div>
                
                <div className="col-span-1 text-right text-zinc-500 text-[9px]">
                  {log.status || 'success'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Failed to load audit logs:', error);
    
    return (
      <div className="p-8 bg-black min-h-screen text-zinc-300 font-mono">
        <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-6">
          <Shield className="text-amber-500" size={24} />
          <h1 className="text-xl uppercase tracking-[0.4em] text-white">System Forensic Ledger</h1>
        </div>
        
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6">
          <h3 className="text-lg font-medium text-red-300 mb-2">Error Loading Audit Logs</h3>
          <p className="text-red-200/80 mb-4">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <div className="text-sm text-red-200/60">
            <p>Please check:</p>
            <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
              <li>Database connection</li>
              <li>Prisma client generation</li>
              <li>Server logs for more details</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}