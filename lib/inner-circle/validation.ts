/* lib/inner-circle/validation.ts — Phase 5: Zod validation schemas for Inner Circle APIs */
import { z } from "zod";

export const PressureSignalSchema = z.object({
  concern: z
    .string()
    .min(36, "Concern must be at least 36 characters")
    .max(5000, "Concern must not exceed 5000 characters")
    .trim(),
});

export const RiseDecayAnswersSchema = z.object({
  authorityClarity: z.number().int().min(1).max(5),
  decisionLatency: z.number().int().min(1).max(5),
  founderDependency: z.number().int().min(1).max(5),
  evidenceQuality: z.number().int().min(1).max(5),
  operatingCadence: z.number().int().min(1).max(5),
  capitalConstraint: z.number().int().min(1).max(5),
  cultureUnderPressure: z.number().int().min(1).max(5),
  recoveryReadiness: z.number().int().min(1).max(5),
  teamOrEnterpriseSignal: z.boolean().optional(),
  governanceRecurrence: z.boolean().optional(),
});

export const WorksheetActionSchema = z.object({
  id: z.string().min(1).max(120),
  status: z.enum(["not_started", "in_progress", "completed", "deferred", "overdue"]).optional(),
  response: z.string().max(4000).optional(),
  note: z.string().max(2000).optional(),
  deadline: z.string().optional(),
  dueDate: z.string().optional(),
  dueDateOffsetDays: z.number().int().min(1).max(90).optional(),
  nextReviewDate: z.string().optional(),
  completedAt: z.string().optional(),
  pathSlug: z.string().max(80).optional(),
});

export const AdvisoryQueueActionSchema = z.object({
  qualificationId: z.string().min(1),
  action: z.enum(["contacted", "converted-boardroom", "converted-strategy", "converted-retainer", "dismiss", "add-note"]),
  note: z.string().max(2000).optional(),
});

export const EmailTriggerSchema = z.object({
  event: z.enum([
    "pressure_green",
    "pressure_amber",
    "pressure_red",
    "rise_decay_low_medium",
    "rise_decay_high",
    "rise_decay_critical",
    "seven_day_no_scorecard",
  ]),
});
