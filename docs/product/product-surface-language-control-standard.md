# Product Surface Language Control Standard

> Date: 2026-05-08
> Purpose: Prevent IP overexposure and overclaiming on public/client/sponsor-safe surfaces.

---

## Governing Principle

Every client-safe surface must show outcome, not mechanism.

| Show | Do Not Show |
|------|------------|
| Standards | Formulas |
| Evidence posture | Internal scoring |
| Consequence | Engine internals |
| Source | Proprietary logic |
| What the system found | How the system found it |

---

## Risky Phrases — Scan List

These phrases must not appear on public, client-safe, or sponsor-safe surfaces unless explicitly reviewed:

| Phrase | Risk | Allowed Context |
|--------|------|----------------|
| algorithm | Exposes mechanism | Internal docs only |
| formula | Exposes scoring | Internal docs only |
| weighting | Exposes scoring | Internal docs only |
| prompt | Exposes AI architecture | Internal docs only |
| arbitration logic | Exposes routing | Internal docs only |
| contradiction graph internals | Exposes engine | Internal docs only |
| exact threshold | Exposes gates | Internal docs only |
| calibration method | Exposes tuning | Internal docs only |
| engine mechanics | Exposes architecture | Internal docs only |
| scoring formula | Exposes IP | Internal docs only |
| certaintyWeight | Exposes calculation | Code only |
| percentFromLikert | Exposes calculation | Code only |

---

## Evidence Language Standard

| Evidence Posture | Allowed Language | Forbidden Language |
|-----------------|-----------------|-------------------|
| USER_REPORTED | "You reported", "You identified", "You previously stated" | "Confirmed", "Verified", "Known" |
| SYSTEM_INFERRED | "The system detected", "Signal identified", "Reading suggests" | "Proven", "Institutional truth", "Verified fact" |
| AGGREGATED | "Aggregate signal", "Reported divergence", "Team reading suggested" | "Team reality", "Employee confirmed", "Verified team truth" |
| OPERATOR_REVIEWED | "Operator reviewed", "Review recorded" | "Institutionally approved" (unless formally approved) |
| COUNSEL_REVIEWED | "Counsel reviewed" | Do not display on client-safe surfaces |
| OUTCOME_VERIFIED | "Outcome verified against stated criteria" | "Permanently resolved" (recurrence may occur) |
| SUPPRESSED | "Evidence captured but withheld for safety" | Never expose suppressed content |

---

## Surface Classification

| Surface | Classification | Who Sees It |
|---------|---------------|------------|
| Homepage / public pages | PUBLIC | Anyone |
| Fast Diagnostic result | PUBLIC | Authenticated user |
| Purpose Alignment result | PUBLIC | Authenticated user |
| Constitutional result | PUBLIC | Authenticated user |
| Executive Reporting result | CLIENT_SAFE | Paying user |
| Strategy Room session | CLIENT_SAFE | Paying user |
| Return Brief | CLIENT_SAFE | Session user |
| Oversight Brief | SPONSOR_SAFE | Retained client |
| Oversight Review | OPERATOR_ONLY | Operator/Admin |
| Counsel Review | OPERATOR_ONLY | Operator/Counsel |
| Control Room | SPONSOR_SAFE | Retained org |
| Decision Centre | CLIENT_SAFE | Authenticated user |
| Boardroom Dossier | BOARD_SAFE | Board-level access |

---

## Suppression Rules by Surface

| Surface | Suppress |
|---------|----------|
| PUBLIC | All scoring, all thresholds, all engine mechanics, all counsel content |
| CLIENT_SAFE | Raw respondent text, counsel recommendations, internal scoring, threshold logic |
| SPONSOR_SAFE | Individual respondent identity, small-sample detail, counsel recommendations |
| BOARD_SAFE | Individual respondent identity, politically sensitive detail without context |
| OPERATOR_ONLY | No suppression (operator sees all, including suppression reasons) |
