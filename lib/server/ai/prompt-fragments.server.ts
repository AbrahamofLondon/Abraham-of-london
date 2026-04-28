import "server-only";

export function getPromptFragments() {
  return {
    baseFragments: [
      "Return only the required decision payload.",
      "Do not disclose internal evaluation mechanics.",
    ],
    hiddenFragments: [
      "Suppress internal policy traces.",
      "Prefer governed synthesis over implementation detail.",
    ],
  };
}
