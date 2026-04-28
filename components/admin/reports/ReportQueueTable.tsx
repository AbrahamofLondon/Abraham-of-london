/* components/admin/reports/ReportQueueTable.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

type QueueRow = {
  id?: string;
  diagnosticRef?: string | null;
  reference?: string | null;
  reportId?: string | null;
  title?: string | null;
  reportTier?: string | null;
  version?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  userEmail?: string | null;
  email?: string | null;
  amount?: number | null;
  currency?: string | null;
};

type Props = {
  rows?: QueueRow[];
  items?: QueueRow[];
  reports?: QueueRow[];
  data?: QueueRow[];
  className?: string;
};

function safeString(value: unknown, defaultValue = "—"): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return defaultValue;
}

function toDateLabel(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  const time = raw ? new Date(raw).getTime() : NaN;
  if (!Number.isFinite(time)) return "—";
  return new Date(time).toLocaleString("en-GB");
}

function toCurrency(amount: unknown, currency: unknown): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  const c = safeString(currency, "GBP").toUpperCase();

  if (!Number.isFinite(n)) return "—";

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: c,
      maximumFractionDigits: 2,
    }).format(n / 100);
  } catch {
    return `${c} ${n / 100}`;
  }
}

function getRows(props: Props): QueueRow[] {
  const candidate =
    props.rows ??
    props.items ??
    props.reports ??
    props.data ??
    [];

  return Array.isArray(candidate) ? candidate : [];
}

export default function ReportQueueTable(props: Props) {
  const rows = getRows(props);

  if (!rows.length) {
    return (
      <div
        className={[
          "rounded-2xl border border-gray-200 bg-white p-8 text-center",
          props.className || "",
        ].join(" ")}
      >
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
          Report Queue
        </div>
        <p className="mt-3 text-sm text-gray-500">
          No report items are currently queued.
        </p>
      </div>
    );
  }

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-gray-200 bg-white",
        props.className || "",
      ].join(" ")}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                Ref
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                Title
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                Client
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                Created
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const ref =
                row.diagnosticRef ||
                row.reference ||
                row.reportId ||
                row.id ||
                `row-${index}`;

              return (
                <tr
                  key={safeString(row.id || ref || index, `row-${index}`)}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {safeString(ref)}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-700">
                    {safeString(row.title, "Diagnostic Report")}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-700">
                    {safeString(row.userEmail || row.email)}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-700">
                    {safeString(row.reportTier || row.version)}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                      {safeString(row.status)}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-700">
                    {toCurrency(row.amount, row.currency)}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-500">
                    {toDateLabel(row.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
