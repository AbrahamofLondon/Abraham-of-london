// lib/subscribe.ts
export async function subscribe(email: string) {
  const r = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.message || "Subscribe failed");
  return data as { ok: true; message: string };
}
