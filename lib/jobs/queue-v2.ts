/* lib/jobs/queue-v2.ts */

import crypto from "crypto";
import { kvGet, kvSet, kvDelete } from "@/lib/resilience/kv-store";
import { RESILIENCE_CONFIG } from "@/lib/resilience/config";

export type QueuedJob = {
  id: string;
  type: string;
  payload: any;
  attempts: number;
  maxAttempts: number;
  nextRunAt: number;
  createdAt: number;
  leaseOwner?: string | null;
  leaseExpiresAt?: number | null;
};

const INDEX_KEY = "jobs:index";

async function getIndex(): Promise<string[]> {
  const raw = await kvGet(INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function setIndex(ids: string[]) {
  await kvSet(INDEX_KEY, JSON.stringify(ids));
}

function jobKey(id: string) {
  return `jobs:item:${id}`;
}

export async function enqueueJob(input: {
  type: string;
  payload: any;
  nextRunAt?: number;
  maxAttempts?: number;
}) {
  const id = crypto.randomUUID();

  const job: QueuedJob = {
    id,
    type: input.type,
    payload: input.payload,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? RESILIENCE_CONFIG.queue.defaultMaxAttempts,
    nextRunAt: input.nextRunAt ?? Date.now(),
    createdAt: Date.now(),
    leaseOwner: null,
    leaseExpiresAt: null,
  };

  await kvSet(jobKey(id), JSON.stringify(job));
  const ids = await getIndex();
  ids.push(id);
  await setIndex(ids);

  return job;
}

export async function getQueuedJob(id: string): Promise<QueuedJob | null> {
  const raw = await kvGet(jobKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QueuedJob;
  } catch {
    return null;
  }
}

export async function saveQueuedJob(job: QueuedJob) {
  await kvSet(jobKey(job.id), JSON.stringify(job));
}

export async function removeQueuedJob(id: string) {
  const ids = await getIndex();
  await setIndex(ids.filter((x) => x !== id));
  await kvDelete(jobKey(id));
}

export async function listQueuedJobs(): Promise<QueuedJob[]> {
  const ids = await getIndex();
  const jobs = await Promise.all(ids.map((id) => getQueuedJob(id)));
  return jobs.filter(Boolean) as QueuedJob[];
}