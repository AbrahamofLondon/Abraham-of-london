import * as React from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gavel,
  Shield,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function InterventionConsole() {
  const { data } = useSWR("/api/constitution/interventions", fetcher);

  const list = data?.data || [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 text-white">
      <h1 className="text-3xl font-serif">Intervention Console</h1>

      <div className="mt-8 space-y-4">
        {list.map((item: any) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-black/30 p-5"
          >
            <div className="flex justify-between">
              <div>
                <div className="text-lg">{item.title}</div>
                <div className="text-sm text-white/50">{item.description}</div>
              </div>

              <div className="text-xs">
                {item.priority} · {item.status}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() =>
                  fetch("/api/constitution/interventions", {
                    method: "PATCH",
                    body: JSON.stringify({
                      id: item.id,
                      status: "IN_PROGRESS",
                    }),
                  })
                }
                className="rounded bg-amber-500 px-3 py-1 text-black"
              >
                Start
              </button>

              <button
                onClick={() =>
                  fetch("/api/constitution/interventions", {
                    method: "PATCH",
                    body: JSON.stringify({
                      id: item.id,
                      status: "COMPLETED",
                      completedAt: new Date().toISOString(),
                    }),
                  })
                }
                className="rounded bg-emerald-500 px-3 py-1 text-black"
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