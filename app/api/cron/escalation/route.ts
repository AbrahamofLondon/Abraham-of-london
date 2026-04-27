export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { buildEscalationPlan, getDueEscalationMessage } from "@/lib/follow-up/escalation-engine";
import { sendEmail } from "@/lib/email/core/sendEmail";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

const STAGE_LEVELS: Record<string, number> = {
  none: 0,
  "24h": 1,
  "48h": 2,
  "72h": 3,
  "5d": 4,
  "7d": 5,
};

function stageToLevel(stage: string): number {
  return STAGE_LEVELS[stage] ?? 0;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = req.headers.get("x-cron-secret");

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const isAuthorized =
    authHeader === `Bearer ${secret}` || cronSecret === secret;

  if (!isAuthorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const contracts = await prisma.patternBreakerContract.findMany({
    where: {
      verificationStatus: { not: "verified" },
      breachCount: { gte: 0 },
      createdAt: { gte: thirtyDaysAgo },
      status: "active",
    },
  });

  let processed = 0;
  let escalated = 0;
  let skipped = 0;

  for (const contract of contracts) {
    processed++;

    const ownerEmail = contract.ownerEmail;
    if (!ownerEmail) {
      skipped++;
      continue;
    }

    // Load the owner's intelligence spine for plan generation
    const journey = await prisma.diagnosticJourney.findFirst({
      where: {
        email: ownerEmail,
        diagnosticType: "intelligence_spine",
      },
      orderBy: { updatedAt: "desc" },
    });

    const spine = journey?.mergedTensionThread as unknown as IntelligenceSpine | null;
    if (!spine || !spine.id || !spine.case) {
      skipped++;
      continue;
    }

    // Calculate hours since contract creation
    const hoursSinceCreation =
      (Date.now() - new Date(contract.createdAt).getTime()) / (1000 * 60 * 60);

    const plan = buildEscalationPlan(spine);
    const dueMessage = getDueEscalationMessage(plan, hoursSinceCreation);

    if (!dueMessage) {
      skipped++;
      continue;
    }

    // Check idempotency: only send if calculated level > current escalationLevel
    const currentLevel = stageToLevel(contract.escalationLevel);
    const dueLevel = stageToLevel(dueMessage.stage);

    if (dueLevel <= currentLevel) {
      skipped++;
      continue;
    }

    // Send escalation email
    const emailResult = await sendEmail({
      type: "SYSTEM",
      to: ownerEmail,
      subject: dueMessage.subject,
      html: formatEscalationHtml(dueMessage.body, dueMessage.cta),
      text: dueMessage.body,
      meta: {
        source: "escalation-cron",
      },
    });

    if (emailResult.ok) {
      // Update escalation level on contract
      await prisma.patternBreakerContract.update({
        where: { id: contract.id },
        data: { escalationLevel: dueMessage.stage },
      });
      escalated++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    escalated,
    skipped,
    executedAt: new Date().toISOString(),
  });
}

function formatEscalationHtml(body: string, cta: { label: string; href: string }): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const ctaUrl = cta.href.startsWith("http") ? cta.href : `${baseUrl}${cta.href}`;

  const paragraphs = body
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
  ${paragraphs}
  <a href="${ctaUrl}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#1a1a1a;color:#fff;text-decoration:none;font-weight:600;border-radius:4px;">${cta.label}</a>
</div>`.trim();
}
