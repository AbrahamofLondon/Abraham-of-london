/* lib/crm/pushToCRM.ts */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function pushToCRM(record: Record<string, any>) {
  const endpoint = process.env.CRM_WEBHOOK_URL || "";
  if (!endpoint) {
    return { ok: true, skipped: true, reason: "CRM_WEBHOOK_URL_NOT_SET" };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CRM_WEBHOOK_BEARER
          ? { Authorization: `Bearer ${process.env.CRM_WEBHOOK_BEARER}` }
          : {}),
      },
      body: JSON.stringify(record),
    });

    return {
      ok: res.ok,
      status: res.status,
    };
  } catch (error) {
    console.error("[CRM_PUSH_ERROR]", error);
    return { ok: false, skipped: false, reason: "CRM_PUSH_FAILED" };
  }
}