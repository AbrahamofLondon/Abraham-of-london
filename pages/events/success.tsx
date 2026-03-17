import Link from 'next/link';
import Layout from '@/components/Layout';
import { ShieldCheck, ChevronRight, FileText } from 'lucide-react';

export default function EventSuccess() {
  return (
    <Layout title="Clearance Confirmed">
      <div className="min-h-[80vh] bg-zinc-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-1000">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
            <ShieldCheck className="w-12 h-12 text-amber-500" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-serif italic text-white leading-tight">
              Clearance Granted<span className="text-amber-500">.</span>
            </h1>
            <p className="text-zinc-500 font-light leading-relaxed">
              Your application for the intelligence briefing has been processed. 
              The registry has updated your credentials.
            </p>
          </div>

          <div className="pt-8 flex flex-col gap-4">
            <Link 
              href="/dashboard/briefings" 
              className="group flex items-center justify-between p-5 bg-white text-black hover:bg-amber-500 transition-colors"
            >
              <span className="font-black uppercase tracking-widest text-[10px]">Access Briefing Vault</span>
              <FileText className="w-4 h-4" />
            </Link>
            
            <Link 
              href="/events" 
              className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em] hover:text-white transition-colors"
            >
              Return to Registry List
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}