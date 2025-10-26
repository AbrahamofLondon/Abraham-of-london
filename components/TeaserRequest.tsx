// components/TeaserRequest.tsx
"use client";
import * as React from "react";

export default function TeaserRequest() {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [status, setStatus] = React.useState<"idle"|"ok"|"err"|"busy">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    try {
      const res = await fetch("/.netlify/functions/send-teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch { setStatus("err"); }
  }

  return (
    <form onSubmit={submit} className="not-prose rounded-xl border border-lightGrey bg-warmWhite/70 p-4 shadow-card">
      <div className="mb-2 font-semibold">Get the FREE teaser by email</div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Name (optional)"
          className="w-full rounded-lg border border-lightGrey px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="you@example.com"
          required
          className="w-full rounded-lg border border-lightGrey px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          className="aol-btn rounded-full px-4 py-2"
          disabled={status === "busy"}
        >
          {status === "busy" ? "Sending…" : "Email me the teaser"}
        </button>
      </div>
      {status === "ok" && <p className="mt-2 text-xs text-forest">Check your inbox—teaser sent!</p>}
      {status === "err" && <p className="mt-2 text-xs text-red-600">Sorry—something went wrong.</p>}
    </form>
  );
}
