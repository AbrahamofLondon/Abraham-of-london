/* components/admin/reports/ReportQueueTable.tsx */
"use client";

import * as React from "react";
import Link from "next/link";

export default function ReportQueueTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-4 py-4">Reference</th>
              <th className="px-4 py-4">Title</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Client</th>
              <th className="px-4 py-4">Created</th>
              <th className="px-4 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-900 text-slate-300">
                <td className="px-4 py-4 font-mono">{row.reference}</td>
                <td className="px-4 py-4">{row.title}</td>
                <td className="px-4 py-4 uppercase">{row.status}</td>
                <td className="px-4 py-4">{row.userEmail || "—"}</td>
                <td className="px-4 py-4">
                  {new Date(row.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/inner-circle/admin/reports/${row.id}`}
                    className="rounded-full border border-blue-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-400"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}