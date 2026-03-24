import { getEnterpriseDashboardView } from "@/lib/alignment/enterprise-repository";
// app/admin/organisations/[id]/dashboard/page.tsx

import { notFound } from "next/navigation";
import { OGRInteractiveView } from "./ogr-interactive-view";
import { Shield, Globe } from "lucide-react";

export default async function OrganisationDashboardPage({ params }: { params: { id: string } }) {
  const data = await getEnterpriseDashboardView(params.id);

  if (!data) return notFound();

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12">
      {/* HEADER SECTION */}
      <header className="flex justify-between items-end border-b pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#8A6A2F]">
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Sovereign Intelligence // Dashboard</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">
            {data.organisation.name}
          </h1>
        </div>
        <div className="text-right flex items-center gap-4">
          <div className="text-right">
             <p className="text-[10px] font-bold text-neutral-400 uppercase">Region</p>
             <p className="font-black text-sm uppercase">{data.organisation.region || 'Global'}</p>
          </div>
          <div className="h-10 w-[1px] bg-neutral-200" />
          <Globe className="w-8 h-8 opacity-20" />
        </div>
      </header>

      {/* INTERACTIVE OGR COMPONENT */}
      <OGRInteractiveView data={data} />
      
      {/* ... Other dashboard sections (Team Lists, etc) ... */}
    </div>
  );
}