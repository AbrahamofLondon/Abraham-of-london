let running = false;

export async function triggerBackgroundRun() {
  if (running) return;

  running = true;

  setTimeout(async () => {
    try {
      const { runJobsBatch } = await import("./runner");
      await runJobsBatch(20);
    } finally {
      running = false;
    }
  }, 0);
}