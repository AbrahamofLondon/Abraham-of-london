import { createHash } from "crypto";

export interface LadderContext {
  subjectId: string | null;
  campaignId: string | null;
  constitutional: {
    route: string | null;
    severity: string | null;
    reportPayload: unknown | null;
  } | null;
  team: {
    score: number | null;
    band: string | null;
    fragility: string | null;
    gaps: string[] | null;
  } | null;
  enterprise: {
    score: number | null;
    sections: unknown[] | null;
    reading: string | null;
    route: string | null;
  } | null;
  strategyIntake: {
    id: string | null;
    status: string | null;
  } | null;
}

function parseJson(value: string | null | undefined): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toStringArray(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item || "").trim()).filter(Boolean);
    return items.length ? items : null;
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return null;
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export async function resolveLadderContext(
  subjectId: string | null,
  email: string,
  campaignId: string | null = null,
): Promise<LadderContext> {
  const context: LadderContext = {
    subjectId,
    campaignId,
    constitutional: null,
    team: null,
    enterprise: null,
    strategyIntake: null,
  };

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return context;

  const { prisma } = await import("@/lib/prisma");

  let organisationName: string | null = null;

  try {
    const campaign = campaignId
      ? await prisma.alignmentCampaign.findUnique({
          where: { id: campaignId },
          include: {
            organisation: {
              select: {
                name: true,
              },
            },
            teamSnapshots: {
              orderBy: { generatedAt: "desc" },
              take: 1,
            },
            organisationSnapshots: {
              orderBy: { generatedAt: "desc" },
              take: 1,
            },
          },
        })
      : null;

    if (campaign) {
      organisationName = campaign.organisation?.name ?? null;

      const latestTeam = campaign.teamSnapshots[0];
      if (latestTeam) {
        context.team = {
          score: latestTeam.percentScore ?? null,
          band: latestTeam.band ?? null,
          fragility: null,
          gaps: toStringArray(parseJson(latestTeam.weakestDomainsJson)),
        };
      }

      const latestEnterprise = campaign.organisationSnapshots[0];
      if (latestEnterprise) {
        context.enterprise = {
          score: latestEnterprise.percentScore ?? null,
          sections:
            (parseJson(latestEnterprise.domainScoresJson) as unknown[] | null) ??
            null,
          reading: latestEnterprise.fragilitySignal ?? null,
          route: latestEnterprise.band ?? null,
        };
      }
    }
  } catch {}

  try {
    const c = await prisma.constitutionalIntakeReport.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
      select: {
        route: true,
        seriousnessScore: true,
        reportJson: true,
        organisation: true,
      },
    });

    if (c) {
      organisationName = c.organisation ?? organisationName;
      context.constitutional = {
        route: c.route ?? null,
        severity:
          typeof c.seriousnessScore === "number"
            ? String(c.seriousnessScore)
            : null,
        reportPayload: parseJson(c.reportJson),
      };
    }
  } catch {}

  try {
    const s = await prisma.strategyIntake.findFirst({
      where: { emailHash: hashEmail(normalizedEmail) },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, organisation: true },
    });

    if (s) {
      organisationName = s.organisation ?? organisationName;
      context.strategyIntake = {
        id: s.id,
        status: s.status ?? null,
      };
    }
  } catch {}

  if (!organisationName) return context;

  if (!context.team) try {
    const t = await prisma.teamAssessmentSnapshot.findFirst({
      where: {
        campaign: {
          organisation: {
            name: organisationName,
          },
        },
      },
      orderBy: { generatedAt: "desc" },
      select: {
        percentScore: true,
        band: true,
        weakestDomainsJson: true,
      },
    });

    if (t) {
      context.team = {
        score: t.percentScore ?? null,
        band: t.band ?? null,
        fragility: null,
        gaps: toStringArray(parseJson(t.weakestDomainsJson)),
      };
    }
  } catch {}

  if (!context.enterprise) try {
    const e = await prisma.organisationAssessmentSnapshot.findFirst({
      where: {
        campaign: {
          organisation: {
            name: organisationName,
          },
        },
      },
      orderBy: { generatedAt: "desc" },
      select: {
        percentScore: true,
        domainScoresJson: true,
        fragilitySignal: true,
        band: true,
      },
    });

    if (e) {
      context.enterprise = {
        score: e.percentScore ?? null,
        sections: (parseJson(e.domainScoresJson) as unknown[] | null) ?? null,
        reading: e.fragilitySignal ?? null,
        route: e.band ?? null,
      };
    }
  } catch {}

  return context;
}
