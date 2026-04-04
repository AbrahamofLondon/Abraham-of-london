/* lib/server/crm/pushToCRM.ts */

import type { DiagnosticSubmissionPayload } from "@/lib/diagnostics/types";

type CRMEnvelope = {
  diagnosticRef: string;
  submittedAt: string;
  payload: DiagnosticSubmissionPayload;
  actor: {
    userId: string | null;
    tier: string;
    authenticated: boolean;
  };
};

export async function pushToCRM(record: CRMEnvelope): Promise<boolean> {
  const webhook = process.env.DIAGNOSTICS_CRM_WEBHOOK_URL?.trim();

  if (!webhook) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(record),
      signal: controller.signal,
    });

    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}