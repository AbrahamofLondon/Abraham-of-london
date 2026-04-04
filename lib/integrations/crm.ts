type CRMRecordPayload = {
  id: string;
  diagnosticType: string;
  score: number;
  severity: string;
  verdict: string;
  userEmail?: string | null;
  createdAt: string;
  reportStatus?: string;
};

export async function pushToCRM(payload: CRMRecordPayload): Promise<void> {
  const endpoint = process.env.CRM_ENDPOINT;
  if (!endpoint) return;

  const secret = process.env.CRM_API_KEY || "";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CRM push failed: ${res.status} ${text}`);
  }
}