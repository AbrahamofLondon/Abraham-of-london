import { describe, expect, it } from "vitest";
import {
  createPilotStatusSessionValue,
  hashPilotStatusSecret,
  newPilotStatusSecret,
  PILOT_STATUS_SECRET_RE,
  verifyPilotStatusSessionValue,
} from "@/lib/engagements/pilot-status-security";

describe("Pilot status security", () => {
  it("issues high-entropy status secrets and stores only HMAC hashes", () => {
    const secret = newPilotStatusSecret();
    expect(secret).toMatch(PILOT_STATUS_SECRET_RE);
    const hash = hashPilotStatusSecret(secret);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(secret);
  });

  it("verifies signed short-lived status sessions and rejects tampering", () => {
    const value = createPilotStatusSessionValue("pilot_0123456789abcdef0123456789abcdef", 1_000);
    expect(verifyPilotStatusSessionValue(value, 2_000)?.reference).toBe("pilot_0123456789abcdef0123456789abcdef");
    expect(verifyPilotStatusSessionValue(value.replace(/.$/, "x"), 2_000)).toBeNull();
    expect(verifyPilotStatusSessionValue(value, 31 * 60 * 1000)).toBeNull();
  });
});