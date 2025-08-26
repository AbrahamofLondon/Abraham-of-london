export async function subscribe(email: string): Promise<{ message: string }> {
  const r = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = (await r.json().catch(() => null)) as { message?: string } | null;
  if (!r.ok) throw new Error(json?.message || `Subscription failed (HTTP ${r.status})`);
  return { message: json?.message || "You’re subscribed. Welcome!" };
}
