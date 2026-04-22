import { z } from "zod";
import { PURPOSE_ALIGNMENT_QUESTIONS } from "./checklist";

const dualAxisAnswerSchema = z.object({
  resonance: z.number().int().min(0).max(10),
  certainty: z.number().int().min(0).max(10),
});

export const purposeAlignmentInputSchema = z.object({
  answers: z.record(z.string(), dualAxisAnswerSchema),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  reflections: z
    .object({
      avoidedDecision: z.string().trim().max(1000).nullable().optional(),
      lastSevenDays: z.string().trim().max(1000).nullable().optional(),
      dissenter: z.string().trim().max(1000).nullable().optional(),
    })
    .optional(),
});

export type PurposeAlignmentInputSchema = z.infer<
  typeof purposeAlignmentInputSchema
>;

const validQuestionIds = new Set(PURPOSE_ALIGNMENT_QUESTIONS.map((q) => q.id));

export function validatePurposeAlignmentAnswers(
  answers: Record<string, { resonance: number; certainty: number }>
): void {
  for (const key of Object.keys(answers)) {
    if (!validQuestionIds.has(key)) {
      throw new Error(`Unknown assessment question: ${key}`);
    }
  }

  for (const question of PURPOSE_ALIGNMENT_QUESTIONS) {
    if (!answers[question.id]) {
      throw new Error(`Missing assessment question: ${question.id}`);
    }
  }
}
