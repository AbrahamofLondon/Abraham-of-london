export type PromptEnvelope = {
  basePrompt: string;
  dynamicContext: string;
  hiddenInstructions: string;
  sessionSalt: string;
};

const BASE_VARIANTS = [
  "Return only the required output shape.",
  "Resolve the request with disciplined brevity and structured reasoning.",
  "Produce the response without exposing internal policy fragments.",
] as const;

export function buildPromptEnvelope(input: {
  basePrompt: string;
  dynamicContext: string;
  hiddenInstructions: string;
  sessionSalt: string;
}): PromptEnvelope {
  return {
    basePrompt: `${input.basePrompt}\n${BASE_VARIANTS[input.sessionSalt.length % BASE_VARIANTS.length]}`,
    dynamicContext: input.dynamicContext,
    hiddenInstructions: input.hiddenInstructions,
    sessionSalt: input.sessionSalt,
  };
}

export function assembleServerPrompt(envelope: PromptEnvelope): string {
  return [
    envelope.basePrompt,
    envelope.dynamicContext,
    envelope.hiddenInstructions,
    `session_salt=${envelope.sessionSalt}`,
  ].join("\n\n");
}
