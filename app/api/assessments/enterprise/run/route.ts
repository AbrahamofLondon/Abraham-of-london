// app/api/assessments/enterprise/run/route.ts
import { NextResponse } from "next/server";

type EnterpriseDomain = {
  label: string;
  authority: number;
  governance: number;
  clarity: number;
  execution: number;
  trust: number;
  exposure: number;
};

function n(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function s(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = s(body?.email).toLowerCase();
    const organisation = s(body?.organisation, "Unknown organisation");
    const domains = Array.isArray(body?.domains) ? (body.domains as EnterpriseDomain[]) : [];

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    if (domains.length < 3) {
      return NextResponse.json(
        { ok: false, error: "At least three enterprise domains are required." },
        { status: 400 },
      );
    }

    const disorderScores = domains.map((d) => {
      const averageHealth =
        (n(d.authority) + n(d.governance) + n(d.clarity) + n(d.execution) + n(d.trust)) / 5;
      return {
        label: d.label,
        disorder: Math.max(0, Math.round(n(d.exposure) - averageHealth / 2)),
      };
    });

    disorderScores.sort((a, b) => b.disorder - a.disorder);

    // ✅ FIX: Safely access the first element
    const highestDisorder = disorderScores[0]?.disorder ?? 0;

    const enterprisePosture =
      highestDisorder >= 45
        ? "DISORDERED"
        : highestDisorder >= 25
          ? "MISALIGNED"
          : "DRIFTING";

    return NextResponse.json({
      ok: true,
      organisation,
      enterprisePosture,
      heatDomains: disorderScores.slice(0, 4).map((x) => x.label),
      nextLayer: "EXECUTIVE_REPORTING",
      domains: disorderScores,
    });
  } catch (error) {
    console.error("[ENTERPRISE_ASSESSMENT_RUN_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to run enterprise assessment." },
      { status: 500 },
    );
  }
}