/* lib/jobs/runner.ts */

import { dequeueReady, requeue, moveToDeadLetter } from "./queue";

type Handler = (payload: any) => Promise<void>;

const handlers = new Map<string, Handler>();

export function registerJobHandler(type: string, handler: Handler) {
  handlers.set(type, handler);
}

export async function runJobsBatch(limit = 10) {
  let processed = 0;

  while (processed < limit) {
    const job = dequeueReady();
    if (!job) break;

    const handler = handlers.get(job.type);
    if (!handler) {
      moveToDeadLetter(job);
      continue;
    }

    try {
      await handler(job.payload);
      processed++;
    } catch (err) {
      if (job.attempts >= job.maxAttempts) {
        moveToDeadLetter(job);
      } else {
        const backoff = Math.min(60000, 2 ** job.attempts * 1000);
        requeue(job, backoff);
      }
    }
  }

  return processed;
}