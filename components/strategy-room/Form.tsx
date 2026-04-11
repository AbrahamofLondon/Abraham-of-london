"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function StrategyRoomForm() {
  const [form, setForm] = React.useState({
    name: "",
    role: "",
    email: "",
    organisation: "",
    jurisdiction: "",
    mandateDescription: "",
  });

  const [submitState, setSubmitState] = React.useState<SubmitState>("idle");
  const [error, setError] = React.useState("");
  const [decision, setDecision] = React.useState<any>(null);

  function handleChange(e: React.ChangeEvent<any>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleEvaluate() {
    if (form.mandateDescription.length < 50) return;

    try {
      const res = await fetch("/api/strategy-room/session/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake: form }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Evaluation failed");

      setDecision(data.constitution);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitState("submitting");
    setError("");

    try {
      const res = await fetch("/api/strategy-room/enrol", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Submission failed");

      setSubmitState("success");
    } catch (err: any) {
      setSubmitState("error");
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          name="mandateDescription"
          value={form.mandateDescription}
          onChange={(e) => {
            handleChange(e);
            handleEvaluate();
          }}
          placeholder="Describe the mandate..."
          className="w-full p-4 bg-black border border-white/10 text-white"
        />

        {decision && (
          <div className="border border-white/10 p-4">
            <p className="text-sm text-white/70">
              Route: {decision.route}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitState === "submitting"}
          className="bg-amber-500 px-6 py-3 text-black"
        >
          {submitState === "submitting" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              Submit <ArrowRight />
            </>
          )}
        </button>

        {submitState === "error" && (
          <div className="text-red-400">{error}</div>
        )}

        {submitState === "success" && (
          <div className="text-green-400 flex gap-2">
            <CheckCircle2 /> Submitted successfully
          </div>
        )}
      </form>
    </div>
  );
}