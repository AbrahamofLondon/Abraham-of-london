import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Boardroom web dossier route", () => {
  const clientSource = fs.readFileSync(
    path.join(process.cwd(), "app", "boardroom", "dossier", "[dossierId]", "BoardroomDossierClient.tsx"),
    "utf8",
  );
  const routeSource = fs.readFileSync(
    path.join(process.cwd(), "app", "api", "boardroom", "dossier", "[dossierId]", "route.ts"),
    "utf8",
  );

  it("keeps token-protected retrieval before rendering the dossier", () => {
    expect(routeSource).toContain("BoardroomAccessTokenService.validateToken");
    expect(routeSource).toContain("tokenRecord.dossierId !== dossierId");
    expect(routeSource).toContain("ACCESS_DENIED_RESPONSE");
  });

  it("uses the arrival screen and admin preview banner", () => {
    expect(clientSource).toContain("ArrivalScreen");
    expect(clientSource).toContain("[ADMIN PREVIEW — NOT DELIVERED]");
    expect(clientSource).toContain("Opening secure dossier link");
  });

  it("keeps the feedback widget attached to the delivered Boardroom artefact", () => {
    expect(clientSource).toContain("FeedbackWidget");
    expect(clientSource).toContain('surface="boardroom_brief_delivered"');
    expect(clientSource).toContain('productCode="boardroom_brief"');
  });
});
