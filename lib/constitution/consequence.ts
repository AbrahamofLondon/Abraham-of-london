export type ConsequenceNode = {
  step: string;
  impact: string;
};

export function buildConsequenceTree(input: {
  trajectory: string;
  readiness: number;
}): ConsequenceNode[] {
  const nodes: ConsequenceNode[] = [];

  if (input.trajectory === "DETERIORATING") {
    nodes.push({
      step: "Immediate action without correction",
      impact: "Structural weakness compounds",
    });

    nodes.push({
      step: "Execution under pressure",
      impact: "Decision quality drops",
    });

    nodes.push({
      step: "Second-order effect",
      impact: "Trust erosion or financial exposure",
    });
  } else {
    nodes.push({
      step: "Measured intervention",
      impact: "Improved control over execution",
    });

    nodes.push({
      step: "Second-order effect",
      impact: "Stability improves decision leverage",
    });
  }

  return nodes;
} 