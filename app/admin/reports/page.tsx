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
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight text-neutral-900">
            Executive Intelligence Briefs
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Sovereign alignment reports and market intelligence
          </p>
        </div>

        <div className="overflow-hidden border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Campaign
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Organisation
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Participants
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Generated
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-neutral-500"
                    >
                      No completed campaigns found.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-neutral-800">
                          {campaign.title || "Untitled Campaign"}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {campaign.organisation?.name || "Sovereign Client"}
                      </td>

                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {campaign.participants?.length || 0}
                      </td>

                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {format(new Date(campaign.updatedAt), "dd MMM yyyy")}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/campaigns/${campaign.id}/report`}
                          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-neutral-600 transition-colors hover:text-neutral-900"
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