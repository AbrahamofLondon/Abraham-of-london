/* scripts/smoke-test-intake.mjs */
import fetch from 'node-fetch';

const TEST_PAYLOAD = {
  meta: { source: "referral", page: "/consulting", submittedAtIso: new Date().toISOString() },
  contact: { 
    fullName: "Test Principal", 
    email: "test@example.com", 
    organisation: "Test Governance Corp" 
  },
  authority: { 
    role: "Managing Director", 
    hasAuthority: "Yes, fully", 
    mandate: "Full decision rights over capital allocation and institutional architecture for the 2026 fiscal year." 
  },
  decision: { 
    statement: "Restructuring the executive compensation model to align with long-term institutional stability rather than short-term yield.", 
    type: "Capital allocation",
    stuckReasons: ["Conflicting incentives", "Political risk"]
  },
  constraints: { 
    nonRemovableConstraints: "Board must approve the final transition timeline.", 
    avoidedTradeOff: "We have avoided the trade-off between growth and stability for too long.", 
    unacceptableOutcome: "Total talent drain during the transition phase." 
  },
  timeCost: { 
    costOfDelay: ["Financial", "Cultural"], 
    affected: "All senior leadership", 
    breaksFirst: "The cultural trust bond between the board and the executive team." 
  },
  readiness: { 
    readyForUnpleasantDecision: "Yes", 
    willingAccountability: "Yes", 
    whyNow: "Market pressure and recent governance audits indicate the current model is fragile and unsustainable." 
  },
  declarationAccepted: true,
  recaptchaToken: "TEST_TOKEN_BYPASS" // Ensure your API allows this during local testing
};

async function runSmokeTest() {
  console.log("🚀 [SMOKE TEST]: Initializing strategic intake simulation...");
  
  try {
    const response = await fetch('http://localhost:3000/api/strategy-room/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_PAYLOAD)
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log("✅ [SUCCESS]: Intake accepted by the Strategic Engine.");
      console.log("📊 [AUDIT]: Check your Neon Database and Discord Channel now.");
    } else {
      console.log("🛑 [DECLINED]:", result.message);
    }
  } catch (error) {
    console.error("💥 [FATAL ERROR]:", error.message);
  }
}

runSmokeTest();