// DEPRECATED: orphaned route — no inbound references.
// Pending operator decision: surface, redirect, or delete.
// Do not add new logic here.
import * as React from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CommandCentre() {
  const { data } = useSWR("/api/sovereign/mandates", fetcher);

  const mandates = data?.data || [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 text-white">
      <h1 className="text-3xl font-serif">Command Centre</h1>

      <div className="mt-8 space-y-4">
        {mandates.map((m: any) => (
          <div key={m.id} className="border border-white/10 p-5">
            <div className="flex justify-between">
              <div>
                <div className="text-lg">{m.title}</div>
                <div className="text-sm text-white/50">{m.description}</div>
              </div>

              <div className="text-xs">
                {m.status} · £{m.commercial.value}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() =>
                  fetch("/api/sovereign/mandates", {
                    method: "PATCH",
                    body: JSON.stringify({
                      id: m.id,
                      action: "ACCEPT",
                    }),
                  })
                }
                className="bg-amber-500 px-3 py-1 text-black"
              >
                Accept
              </button>

              <button
                onClick={() =>
                  fetch("/api/sovereign/mandates", {
                    method: "PATCH",
                    body: JSON.stringify({
                      id: m.id,
                      action: "COMPLETE",
                    }),
                  })
                }
                className="bg-emerald-500 px-3 py-1 text-black"
              >
                Complete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}