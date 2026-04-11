export function shouldEscalate(input: {
  trajectory: string;
  readiness: number;
  authority: string;
  seriousness: number;
}): boolean {
  if (input.authority !== "DIRECT") return false;

  if (input.readiness < 60) return false;

  if (input.seriousness < 50) return false;

  if (input.trajectory === "DETERIORATING") return false;

  return true;
}