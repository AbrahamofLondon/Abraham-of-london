import { registerJobHandler } from "./runner";
import { regenerateReport } from "./handlers/regenerate-report";

export function bootstrapJobs() {
  registerJobHandler("report.regenerate", regenerateReport);
}