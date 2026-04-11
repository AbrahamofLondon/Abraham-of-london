"use client";

import * as React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

type Props = {
  onResult?: (data: any) => void;
};

export default function StrategyRoomUnifiedIntake({ onResult }: Props) {
  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    organisation: "",
    role: "",
    jurisdiction: "",
    problemStatement: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<any>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // STEP 1 — INIT SESSION
      const initRes = await fetch("/api/strategy-room/session/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake: form }),
      });

      const initData = await initRes.json();

      if (!initRes.ok || !initData.sessionKey) {
        throw new Error(initData.error || "Session init failed");
      }

      // STEP 2 — GET GUIDANCE (REAL ENGINE)
      const guidanceRes = await fetch("/api/decision/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake: form }),
      });

      const guidance = await guidanceRes.json();

      if (!guidanceRes.ok) {
        throw new Error(guidance.error || "Guidance failed");
      }

      const canonical = guidance.canonical ?? guidance;

      setResult(canonical);
      onResult?.(canonical);
    } catch (err: any) {
      setError(err.message || "Something failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="fullName"
          placeholder="Full name"
          onChange={handleChange}
          className="w-full p-3 bg-black border border-white/10 text-white"
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full p-3 bg-black border border-white/10 text-white"
        />

        <textarea
          name="problemStatement"
          placeholder="Describe the mandate..."
          onChange={handleChange}
          className="w-full p-4 bg-black border border-white/10 text-white"
        />

        <button
          disabled={loading}
          className="bg-amber-500 text-black px-6 py-3 flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              Submit <ArrowRight />
            </>
          )}
        </button>

        {error && <div className="text-red-400">{error}</div>}
      </form>

      {result && (
        <div className="border border-white/10 p-4">
          <p className="text-white/70 text-sm">
            Route: {result.sections?.constitutionalPosture?.route}
          </p>
        </div>
      )}
    </div>
  );
}