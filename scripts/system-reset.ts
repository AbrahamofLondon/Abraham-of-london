/* scripts/system-reset.ts */
import { db } from "@/lib/db"; // Adjust to your DB path

async function emergencyUnlock() {
  console.log("▲ INITIALIZING EMERGENCY UNLOCK PROTOCOL...");
  
  try {
    // Force set the system state to unlocked in the DB
    await db.systemConfig.upsert({
      where: { key: 'GLOBAL_LOCKDOWN' },
      update: { value: 'false', updatedAt: new Date() },
      create: { key: 'GLOBAL_LOCKDOWN', value: 'false' }
    });
    
    console.log("✓ PERIMETER RESTORED. System unlocked.");
  } catch (err) {
    console.error("X DATABASE UNRESPONSIVE:", err);
  }
}

emergencyUnlock();