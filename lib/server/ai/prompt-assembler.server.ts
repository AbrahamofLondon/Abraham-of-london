import "server-only";

import { assembleServerPrompt, buildPromptEnvelope } from "@/lib/ai/prompt-engine";
import { getPromptFragments } from "@/lib/server/ai/prompt-fragments.server";

export function assembleProtectedPrompt(input: {
  dynamicContext: string;
  sessionSalt: string;
}) {
  const fragments = getPromptFragments();

  return assembleServerPrompt(
    buildPromptEnvelope({
      basePrompt: fragments.baseFragments.join(" "),
      dynamicContext: input.dynamicContext,
      hiddenInstructions: fragments.hiddenFragments.join(" "),
      sessionSalt: input.sessionSalt,
    }),
  );
}
