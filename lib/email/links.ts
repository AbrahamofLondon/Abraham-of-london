import { canonicalUrl } from "@/config/site";

function absolute(path: string): string {
  return canonicalUrl(path.startsWith("/") ? path : `/${path}`);
}

export const EmailLinks = {
  home: absolute("/"),
  contact: absolute("/contact"),
  strategyRoom: absolute("/strategy-room"),
  executiveReporting: absolute("/diagnostics/executive-reporting"),
  innerCircle: absolute("/inner-circle"),
  downloads: (slug: string) => absolute(`/downloads/${slug}`),
  artifacts: (slug: string) => absolute(`/artifacts/${slug}`),
  evidence: (slug: string) => absolute(`/evidence/${slug}`),
  enterpriseRespond: (token: string) =>
    absolute(`/alignment/enterprise/respond?token=${encodeURIComponent(token)}`),
  enterpriseAssessment: (token: string) =>
    absolute(`/enterprise/assessment/${encodeURIComponent(token)}`),
  auditParticipant: (participantId: string) =>
    absolute(`/audit/${encodeURIComponent(participantId)}`),
  accessAccept: (token: string) =>
    absolute(`/access/accept?token=${encodeURIComponent(token)}`),
  adminVerify: (token: string, email: string, returnTo: string) =>
    absolute(
      `/api/admin/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(
        email,
      )}&returnTo=${encodeURIComponent(returnTo)}`,
    ),
};

export type EmailLinksMap = typeof EmailLinks;
