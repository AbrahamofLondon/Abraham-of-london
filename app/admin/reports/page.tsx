export const dynamic = "force-dynamic";
// app/admin/reports/page.tsx
import Link from "next/link";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function ReportsIndexPage() {
  const campaigns = await prisma.alignmentCampaign.findMany({
    where: { status: "completed" },
    include: {
      organisation: true,
      participants: {
        where: { status: "completed" },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-amber-500/70">
            Executive Intelligence Briefs
          </p>
          <h1 className="mt-2 font-serif text-2xl text-white">
            Reports
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Sovereign alignment reports and market intelligence
          </p>
        </div>

        <div className="overflow-hidden border border-white/10 bg-zinc-950/70">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-black/30">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">
                    Campaign
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">
                    Organisation
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">
                    Participants
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">
                    Generated
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-white/40">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-white/40"
                    >
                      No completed campaigns found.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm text-white/80">
                          {campaign.title || "Untitled Campaign"}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-sm text-white/50">
                        {campaign.organisation?.name || "Sovereign Client"}
                      </td>

                      <td className="px-4 py-3 text-sm text-white/50">
                        {campaign.participants?.length || 0}
                      </td>

                      <td className="px-4 py-3 text-sm text-white/50">
                        {format(new Date(campaign.updatedAt), "dd MMM yyyy")}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/campaigns/${campaign.id}/report`}
                          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-white/50 transition-colors hover:text-amber-300"
                        >
                          <FileText className="h-3 w-3" />
                          View Brief
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}