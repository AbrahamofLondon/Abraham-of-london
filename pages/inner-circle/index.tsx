// pages/inner-circle/index.tsx
import { useState } from "react";
import SiteLayout from "@/components/SiteLayout";

export default function InnerCirclePage() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState("");

  async function unlock() {
    setStatus("Checking…");

    const res = await fetch("/api/inner-circle/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });

    if (res.ok) {
      setStatus("Access granted. Reloading…");
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setStatus("Invalid key. Access denied.");
    }
  }

  return (
    <SiteLayout pageTitle="Inner Circle Access">
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-serif text-3xl text-softGold mb-2">Inner Circle</h1>
        <p className="text-gray-300 mb-8">
          Private access for trusted builders, fathers, and nation-shapers.
        </p>

        <input
          type="password"
          placeholder="Enter Access Key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200"
        />

        <button
          onClick={unlock}
          className="mt-4 w-full rounded-xl bg-softGold py-3 text-black font-bold hover:bg-softGold/90"
        >
          Unlock Access
        </button>

        <p className="mt-4 text-sm text-gray-400">{status}</p>
      </div>
    </SiteLayout>
  );
}