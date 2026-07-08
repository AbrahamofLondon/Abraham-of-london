# Executive Demo — 10 Minutes

Objective: show one buyer how the system turns a high-stakes decision from anonymous signal into governed continuation without fabricating certainty.

1. Route: `/decision-instruments/signal`
Fixture/input: "We are delaying a supplier concentration decision because switching raises cost now, but staying exposed could interrupt two enterprise customers." Set delay cost HIGH, confidence 6, consequence STRUCTURAL, urgency HIGH.
Expected result: input-sensitive pressure result, evidence trace, contradiction/evidence gap if applicable, stable recommendation ID, next admissible move.
Buyer question: "Is this just a lead form?"
Evidence-backed answer: No. The engine computes from material inputs, exposes uncertainty, and may decline paid action when not justified. Tests: `tests/demo-journey/decision-signal-engine.test.ts`.

2. Route: `/corridor?rec=<recommendationId>`
Fixture/input: use the recommendation ID from Signal.
Expected result: "You are here", established facts, unresolved contradiction/evidence/ownership/timing/commitment, one next admissible move, not-yet-appropriate state.
Buyer question: "Why this product, not the highest-priced one?"
Evidence-backed answer: Corridor reads the persisted recommendation context and renders access mode and rationale. Tests: `tests/demo-journey/corridor-recommendation-context.test.ts`.

3. Route: `/engagements/operator-pilot`
Fixture/input: Meridian Components Ltd, COO, supply-chain restructure, HIGH materiality, FRAMING, real stakeholders, authority confirmed, checkpoints accepted.
Expected result: governed qualification, no auto-acceptance, reference issued.
Buyer question: "Can a controlled engagement be self-approved?"
Evidence-backed answer: No. Final acceptance requires human authority in the lifecycle store. Tests: `tests/demo-journey/operator-pilot-qualification.test.ts` and `pilot-intake-store.test.ts`.

4. Route: `/engagements/operator-pilot-status`
Fixture/input: returned pilot reference.
Expected result: customer-safe status only: reference, current state, last update, requested information, next step, final decision when applicable.
Buyer question: "Can one customer see another customer's status?"
Evidence-backed answer: No list endpoint exists for customers; exact high-entropy reference is required and operator notes are excluded.

5. Route: `/admin/operator-pilot`
Fixture/input: admin session.
Expected result: operator queue with organisation, role, domain, materiality, deadline, confidentiality, evidence posture, qualification state, owner, ageing, next action.
Buyer question: "Does operation require database inspection?"
Evidence-backed answer: No. The queue is a governed admin surface registered in `admin-domain-registry`.

6. Route: `/admin/conversion-dashboard`
Fixture/input: generated journey events.
Expected result: funnel counts and drop-off summary from durable event store.
Buyer question: "What evidence will early adoption create?"
Evidence-backed answer: Structured funnel events, qualification outcomes, continuation status, and governed decision records without sensitive free-text analytics leakage.
