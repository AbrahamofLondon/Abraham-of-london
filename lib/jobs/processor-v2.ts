/* lib/jobs/processor-v2.ts */

import crypto from "crypto";
import { RESILIENCE_CONFIG } from "@/lib/resilience/config";
import { listQueuedJobs, saveQueuedJob, removeQueuedJob, type QueuedJob } from "@/lib/jobs/queue-v2";
import { logger } from "@/lib/observability/logger";
import { increment, gauge } from "@/lib/observability/metrics";
import { sendOperationalAlert } from "@/lib/observability/alerts";

type JobHandler = (payload: any, job: QueuedJob) => Promise<void>;

const handlers = new Map<string, JobHandler>();

export function registerJobHandler(type: string, handler: JobHandler) {
  handlers.set(type, handler);
}

function isLeaseExpired(job: QueuedJob) {
  return !job.leaseExpiresAt || Date.now() > job.leaseExpiresAt;
}

export async function processJobBatch(limit = RESILIENCE_CONFIG.queue.batchSize) {
  const workerId = crypto.randomUUID();
  const jobs = await listQueuedJobs();
  const ready = jobs
    .filter((job) => job.nextRunAt <= Date.now())
    .filter((job) => !job.leaseOwner || isLeaseExpired(job))
    .slice(0, limit);

  gauge("jobs.ready", ready.length);

  let processed = 0;

  for (const job of ready) {
    const handler = handlers.get(job.type);

    if (!handler) {
      increment("jobs.dead_letter", 1, { reason: "missing_handler", type: job.type });
      await removeQueuedJob(job.id);
      continue;
    }

    job.leaseOwner = workerId;
    job.leaseExpiresAt = Date.now() + RESILIENCE_CONFIG.queue.defaultLeaseMs;
    await saveQueuedJob(job);

    try {
      await handler(job.payload, job);
      increment("jobs.completed", 1, { type: job.type });
      await removeQueuedJob(job.id);
      processed++;
    } catch (error: any) {
      job.attempts += 1;

      if (job.attempts >= job.maxAttempts) {
        increment("jobs.dead_letter", 1, { reason: "max_attempts", type: job.type });
        logger.error("Job moved to dead letter", "jobs", {
          jobId: job.id,
          type: job.type,
          attempts: job.attempts,
          error: error?.message || "unknown",
        });

        await sendOperationalAlert({
          subject: `Dead letter job: ${job.type}`,
          severity: "warn",
          body: `Job ${job.id} failed permanently after ${job.attempts} attempts.`,
          meta: { jobId: job.id, type: job.type },
        });

        await removeQueuedJob(job.id);
      } else {
        const backoff = Math.min(
          RESILIENCE_CONFIG.queue.maxBackoffMs,
          RESILIENCE_CONFIG.queue.defaultBackoffMs * Math.pow(2, job.attempts)
        );

        job.nextRunAt = Date.now() + backoff;
        job.leaseOwner = null;
        job.leaseExpiresAt = null;

        increment("jobs.retried", 1, { type: job.type });
        await saveQueuedJob(job);
      }
    }
  }

  return { processed, workerId, considered: ready.length };
}