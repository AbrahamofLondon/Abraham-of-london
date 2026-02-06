/* components/Admin/IntakeFeed.tsx */
import { UserCheck, ShieldX, Clock } from 'lucide-react';

export const IntakeFeed: React.FC<{ inquiries: any[] }> = ({ inquiries }) => {
  return (
    <div className="space-y-4">
      {inquiries.map((iq) => (
        <div key={iq.id} className="p-5 bg-zinc-900/60 border border-white/5 rounded-2xl flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${
              iq.status === 'PRIORITY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {iq.status === 'PRIORITY' ? <UserCheck size={18} /> : <Clock size={18} />}
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase">{iq.name}</p>
              <p className="text-[10px] font-mono text-zinc-500">{iq.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 uppercase">Priority_Score</p>
              <p className="text-xs font-mono text-white">{iq.metadata?.priorityScore || 0}</p>
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">
              Onboard
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};