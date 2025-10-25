// lib/subscribe.ts
export async function subscribe(
  email: string,
): Promise<{ ok: boolean; message: string }> {
  const r = await fetch("/api/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await r.json().catch(() => ({}));
  if (r.ok && data?.ok)
    return {
      ok: true,
      message: String(
        data.message || "YouÃƒ¢Ã¢â€š¬Ã¢â€ž¢re subscribed. Welcome!",
      ),
    };

  // Always return a string message
  return {
    ok: false,
    message: String(
      data?.message ||
        `Subscription failed (HTTP ${r.status}). Please try again.`,
    ),
  };
}
