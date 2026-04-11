export function synthesisePosture(input: {
  trajectory: string;
  readiness: number;
  authority: string;
}): string {
  if (input.trajectory === "DETERIORATING") {
    return "You are operating in a degrading system. Priority is stabilisation, not expansion.";
  }

  if (input.readiness < 50) {
    return "Your ambition exceeds your current execution capacity.";
  }

  if (input.authority !== "DIRECT") {
    return "You are attempting to act without full decision control.";
  }

  return "You are in a position to act, but discipline will determine outcome quality.";
}