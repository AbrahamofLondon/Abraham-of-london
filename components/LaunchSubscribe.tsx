// components/LaunchSubscribe.tsx
"use client";
import * as React from "react";

export default function LaunchSubscribe() {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [ok, setOk] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/.netlify/functions/subscribe-launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    setOk(res.ok);
  }

  return (
    <form onSubmit={submit} className="not-prose rounded-xl border border-lightGrey bg-warmWhite/70 p-4 shadow-card">
      <div className="mb-2 font-semibold">Join the launch list</div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className="w-full rounded-lg border border-lightGrey px-3 py-2 text-sm" placeholder="Name (optional)" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="w-full rounded-lg border border-lightGrey px-3 py-2 text-sm" type="email" required placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <button className="aol-btn rounded-full px-4 py-2" type="submit">Notify me</button>
      </div>
      {ok && <p className="mt-2 text-xs text-forest">Welcome—watch your inbox for updates.</p>}
    </form>
  );
}
