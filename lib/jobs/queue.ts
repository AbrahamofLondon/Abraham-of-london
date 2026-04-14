/* lib/jobs/queue.ts */

type Job = {
  id: string;
  type: string;
  payload: any;
  attempts: number;
  maxAttempts: number;
  nextRunAt: number;
  createdAt: number;
};

const queue: Job[] = [];
const deadLetter: Job[] = [];

export function enqueue(job: Omit<Job, "id" | "attempts" | "createdAt">) {
  const full: Job = {
    id: crypto.randomUUID(),
    attempts: 0,
    createdAt: Date.now(),
    ...job,
  };

  queue.push(full);
  return full.id;
}

export function dequeueReady(): Job | null {
  const now = Date.now();

  const index = queue.findIndex(j => j.nextRunAt <= now);
  if (index === -1) return null;

  const job = queue.splice(index, 1)[0];
  return job ?? null;
}

export function moveToDeadLetter(job: Job) {
  deadLetter.push(job);
}

export function requeue(job: Job, delayMs: number) {
  job.attempts++;
  job.nextRunAt = Date.now() + delayMs;
  queue.push(job);
}
