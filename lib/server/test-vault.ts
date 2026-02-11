/**
 * DIRECTORATE OS: SECURITY AUDIT SCRIPT
 * Targets: /api/access/enter
 * Objective: Verify Rate Limiter & Identity Handshake
 */

const TEST_CONFIG = {
  endpoint: "http://localhost:3000/api/access/enter",
  // Replace with a known test email from your Neon DB or a Master Key
  testToken: "MASTER_KEY_001", 
  attackVolume: 35, // Exceeds the 30-limit threshold
};

async function runAudit() {
  console.log("🏛️  INITIALISING VAULT AUDIT...");
  console.log(`📡 TARGET: ${TEST_CONFIG.endpoint}\n`);

  // 1. VERIFY IDENTITY HANDSHAKE
  console.log("🔍 STEP 1: VALIDATING LEGITIMATE HANDSHAKE...");
  try {
    const res = await fetch(TEST_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: TEST_CONFIG.testToken }),
    });
    
    const data = await res.json();
    console.log(`STATUS: ${res.status}`);
    console.log(`IDENTITY: ${data.tier || "UNVERIFIED"}`);
    console.log(`REMAINING: ${res.headers.get("X-RateLimit-Remaining")}\n`);
  } catch (err) {
    console.error("❌ CONNECTION FAILURE: Ensure dev server is running.\n");
    return;
  }

  // 2. SIMULATE BRUTE FORCE
  console.log(`🛡️  STEP 2: SIMULATING BRUTE FORCE (${TEST_CONFIG.attackVolume} REQUESTS)...`);
  
  let blockedAt = 0;

  for (let i = 1; i <= TEST_CONFIG.attackVolume; i++) {
    const res = await fetch(TEST_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: `wrong-key-${i}` }),
    });

    if (res.status === 429) {
      const data = await res.json();
      blockedAt = i;
      console.log(`✅ DEFENCE ACTIVE: Request #${i} blocked.`);
      console.log(`🛑 REASON: ${data.reason}`);
      console.log(`⏳ RETRY AFTER: ${data.retryAfter}s`);
      break;
    }

    if (i % 10 === 0) {
      console.log(`📡 Request #${i} processed (Remaining: ${res.headers.get("X-RateLimit-Remaining")})`);
    }
  }

  if (blockedAt > 0) {
    console.log(`\n✨ AUDIT COMPLETE: Sentinel triggered at request ${blockedAt}.`);
  } else {
    console.warn("\n⚠️  AUDIT WARNING: Rate limiter did not trigger. Check memory store persistence.");
  }
}

runAudit();