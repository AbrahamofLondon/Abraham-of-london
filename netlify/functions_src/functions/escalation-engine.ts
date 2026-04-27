// netlify/functions_src/functions/escalation-engine.ts
// Scheduled function: runs every 6 hours to process escalation queue.

type NetlifyHandlerEvent = {
  headers: Record<string, string | undefined>;
};

type NetlifyHandlerContext = Record<string, unknown>;

type NetlifyHandlerResponse = {
  statusCode: number;
  body: string;
};

type Handler = (
  event: NetlifyHandlerEvent,
  context: NetlifyHandlerContext,
) => Promise<NetlifyHandlerResponse>;

export const handler: Handler = async (event, _context) => {
  const scheduledHeader = event.headers["x-netlify-scheduled"];

  if (scheduledHeader !== "true") {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized - Scheduled function only" }),
    };
  }

  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.URL ||
    "https://www.abrahamoflondon.org";

  const cronSecret = process.env.CRON_SECRET || "";

  try {
    const res = await fetch(`${url}/api/cron/escalation`, {
      method: "GET",
      headers: {
        "x-cron-secret": cronSecret,
        "Content-Type": "application/json",
      },
    });

    const body = await res.text();

    if (!res.ok) {
      console.error("[ESCALATION_CRON] Failed", { status: res.status, body });
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Escalation cron call failed",
          status: res.status,
        }),
      };
    }

    return {
      statusCode: 200,
      body,
    };
  } catch (error) {
    console.error("[ESCALATION_CRON] Network error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Escalation cron network failure",
      }),
    };
  }
};
