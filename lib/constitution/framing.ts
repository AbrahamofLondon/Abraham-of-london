export type DecisionOption = {
  option: string;
  tradeoff: string;
  whenToChoose: string;
};

export function buildDecisionFrame(input: {
  readiness: number;
  trajectory: string;
}): DecisionOption[] {
  return [
    {
      option: "Act immediately",
      tradeoff: "Speed vs structural risk",
      whenToChoose:
        input.readiness > 70
          ? "When execution capability is strong"
          : "Not recommended under current conditions",
    },
    {
      option: "Stabilise first",
      tradeoff: "Delay vs increased success probability",
      whenToChoose:
        input.trajectory === "FRAGILE" ||
        input.trajectory === "DETERIORATING"
          ? "Recommended path"
          : "Optional",
    },
    {
      option: "Do nothing",
      tradeoff: "Avoid risk vs opportunity loss",
      whenToChoose: "When downside outweighs upside",
    },
  ];
}