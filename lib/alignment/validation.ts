import { z } from "zod";
import { PURPOSE_ALIGNMENT_QUESTIONS } from "./checklist";

export const purposeAlignmentInputSchema = z.object({
  answers: z.record(z.string(), z.boolean()),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export type PurposeAlignmentInputSchema = z.infer<
  typeof purposeAlignmentInputSchema
>;

const validQuestionIds = new Set(PURPOSE_ALIGNMENT_QUESTIONS.map((q) => q.id));

export function validatePurposeAlignmentAnswers(
  answers: Record<string, boolean>
): void {
  for (const key of Object.keys(answers)) {
    if (!validQuestionIds.has(key)) {
      throw new Error(`Unknown assessment question: ${key}`);
    }
  }
}