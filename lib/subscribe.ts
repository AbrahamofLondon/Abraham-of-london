export async function subscribe(email: string): Promise<{ ok: boolean; message?: string }> {
  if (!email || !/.+@.+\..+/.test(email)) {
    return { ok: false, message: "Invalid email" };
  }
  // TODO: wire to your real ESP later
  return { ok: true, message: "Subscribed" };
}
