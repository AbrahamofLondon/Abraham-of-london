'use client';

import { useState, useRef } from 'react';
import { UserPlus, Loader2, X, ShieldCheck, FileUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AuditInviteProps {
  campaignId: string;
  organisationId: string;
}

export function AuditInvite({ campaignId, organisationId }: AuditInviteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    team: '',
    isExecutive: false,
  });

  const [batchStats, setBatchStats] = useState({ total: 0, current: 0, success: 0, failed: 0 });

  const downloadTemplate = () => {
    const headers = "name,email,team,isExecutive\n";
    const example = "Alexander Hamilton,hamilton@treasury.gov,Finance,true\nJohn Doe,doe@org.com,Operations,false";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'audit_roster_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const inviteNode = async (data: any) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) return true;
      const err = await res.json();
      console.error(`Node ${data.email} failed:`, err.message);
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      
      // Remove header row if it exists
      if (rows[0]?.toLowerCase().includes('email') || rows[0]?.toLowerCase().includes('name')) {
        rows.shift();
      }
      
      setBatchStats({ total: rows.length, current: 0, success: 0, failed: 0 });
      setLoading(true);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const columns = rows[i]!.split(',').map(s => s.trim());
        
        // Guard: Only process if we have at least Name and Email
        if (columns.length >= 2 && columns[1] && columns[0]) {
          const [name, email, team, isExec] = columns;
          const success = await inviteNode({
            name,
            email,
            team: team || '',
            isExecutive: isExec?.toLowerCase() === 'true'
          });
          
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        }
        
        setBatchStats(prev => ({ ...prev, current: i + 1, success: successCount, failed: failCount }));
      }

      setLoading(false);
      
      if (successCount > 0) {
        toast.success(`${successCount} nodes processed successfully.${failCount > 0 ? ` ${failCount} failed.` : ''}`);
      } else if (failCount > 0) {
        toast.error(`Failed to process ${failCount} nodes. Check email format.`);
      }
      
      setIsOpen(false);
      router.refresh();
    };
    reader.readAsText(file);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-2.5 border border-white/10 bg-white/5 text-white/75 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 active:scale-95"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Invite Node
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md h-full border-l border-white/10 bg-zinc-950 p-10 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-start mb-12">
              <div>
                <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.3em] block mb-2">Protocol Expansion</span>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                  {batchMode ? 'Batch Integration' : 'Add Participant'}
                </h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/45" />
              </button>
            </div>

            <div className="flex gap-2 mb-10 border-b border-white/10 pb-4">
              <button 
                onClick={() => setBatchMode(false)}
                className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 ${!batchMode ? 'bg-white text-black' : 'text-white/45 hover:text-white/70'}`}
              >
                Individual
              </button>
              <button 
                onClick={() => setBatchMode(true)}
                className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 ${batchMode ? 'bg-white text-black' : 'text-white/45 hover:text-white/70'}`}
              >
                CSV Batch
              </button>
            </div>

            {batchMode ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col justify-center items-center border border-dashed border-white/10 bg-white/[0.03] p-10 text-center mb-6">
                  <FileUp className="w-12 h-12 text-white/30 mb-4" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-white mb-2">Upload Roster</h3>
                  <p className="text-[10px] text-white/45 uppercase leading-relaxed mb-8 max-w-[200px]">
                    Format: name,email,team,isExecutive
                  </p>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleCSVUpload} 
                    accept=".csv" 
                    className="hidden" 
                  />
                  
                  <button
                    disabled={loading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {batchStats.current} / {batchStats.total}
                      </>
                    ) : 'Select CSV File'}
                  </button>
                </div>

                <button 
                  onClick={downloadTemplate}
                  className="w-full py-3 border border-white/10 bg-white/5 text-white/55 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white/75 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download Template
                </button>
              </div>
            ) : (
              <div className="flex-1 space-y-6">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-white/55 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-amber-500/40"
                    placeholder="Alexander Hamilton"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-white/55 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-amber-500/40"
                    placeholder="hamilton@treasury.gov"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-white/55 mb-2">Team</label>
                  <input
                    type="text"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full border border-white/10 bg-black/30 p-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-amber-500/40"
                    placeholder="Finance"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isExecutive}
                    onChange={(e) => setFormData({ ...formData, isExecutive: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/55">Executive Leadership</label>
                </div>
                
                <button
                  onClick={async () => {
                    if (!formData.email || !formData.name) {
                      toast.error("Name and email required");
                      return;
                    }
                    setLoading(true);
                    const success = await inviteNode(formData);
                    setLoading(false);
                    if (success) {
                      toast.success("Node invited");
                      setIsOpen(false);
                      router.refresh();
                    } else {
                      toast.error("Invite failed");
                    }
                  }}
                  disabled={loading}
                  className="w-full py-4 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                  {loading ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            )}
            
            <p className="mt-8 text-[9px] text-white/45 uppercase leading-relaxed tracking-widest italic border-t border-white/10 pt-8">
              Authorized expansion will trigger automated resonance requests.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
