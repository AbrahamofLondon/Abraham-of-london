# Inner Circle MVP — Admin Smoke Test Flow
## Production Readiness Gate — Manual Test Procedures

### Prerequisites
- Admin access to `/admin/advisory-queue` and `/admin/analytics`
- A test user account that can complete the Rise-Decay Scorecard
- Feature flags set in `.env.local`:
  ```
  INNER_CIRCLE_MVP_ENABLED=true
  INNER_CIRCLE_EMAILS_ENABLED=false   # Keep disabled until test emails reviewed
  INNER_CIRCLE_SUBSCRIPTION_ENABLED=false
  INNER_CIRCLE_ADMIN_QUEUE_ENABLED=true
  ```

---

### Test 1: Low Risk User Flow

**Goal**: Verify that a user with low risk scores flows through the system cleanly without triggering advisory qualification.

**Steps**:
1. Create a new test user account (or use an existing one with no prior diagnostics).
2. Submit a low-pressure signal via `/api/pressure/signal`:
   ```json
   { "concern": "We need to decide whether to proceed with the quarterly review on schedule, but the team is still gathering data and the deadline is flexible." }
   ```
   **Expected**: `pressureLevel: "GREEN"`, `route.productKey: "free-account"`
3. Complete the Rise-Decay Scorecard with low-risk answers:
   ```json
   { "authorityClarity": 2, "decisionLatency": 2, "founderDependency": 2, "evidenceQuality": 2, "operatingCadence": 2, "capitalConstraint": 2, "cultureUnderPressure": 2, "recoveryReadiness": 2 }
   ```
   **Expected**: `riskLevel: "Low"`, no advisory qualification created.
4. Check `/admin/analytics`:
   - Scorecard completions incremented by 1
   - Risk distribution shows +1 Low
   - Worksheet actions created (3 items with +7, +14, +21 day due dates)
5. Check `/inner-circle/dashboard` for the test user:
   - Beta banner visible
   - Worksheet actions visible with due dates
   - "Continue Inner Circle path" as recommended route

---

### Test 2: High Risk User Flow

**Goal**: Verify that a user with high risk scores triggers advisory qualification and appears in the admin queue.

**Steps**:
1. Use the same or a new test user account.
2. Complete the Rise-Decay Scorecard with high-risk answers:
   ```json
   { "authorityClarity": 5, "decisionLatency": 5, "founderDependency": 4, "evidenceQuality": 4, "operatingCadence": 4, "capitalConstraint": 3, "cultureUnderPressure": 4, "recoveryReadiness": 4 }
   ```
   **Expected**: `riskLevel: "High"` or `"Critical"`, advisory qualification created with status `"OPEN"`.
3. Check `/admin/advisory-queue`:
   - User appears in the table
   - Risk level shows "High" or "Critical"
   - Recommended product shows "boardroom-brief" or "strategy-room"
   - Qualification reason is displayed
   - Status is "OPEN"
4. Test admin actions:
   - Click "Contact" → status changes to "CONTACTED"
   - Click "→ Boardroom" → status changes to "CONVERTED", product shows "boardroom-brief"
   - Click "Dismiss" → status changes to "DISMISSED"
5. Test CSV export:
   - Click "Export CSV" → file downloads with all qualification data
   - Verify no raw pressure text is present in the CSV

---

### Test 3: Critical Repeated Risk → Council Candidate

**Goal**: Verify that a user with repeated High/Critical results is flagged as a Council Candidate.

**Steps**:
1. Use a test user who already has at least one High or Critical result.
2. Complete the Rise-Decay Scorecard again with high-risk answers (same as Test 2).
3. **Expected**: `councilCandidate: true`, advisory qualification status `"COUNCIL_CANDIDATE"`.
4. Check `/admin/advisory-queue`:
   - User shows "Council" badge
   - Filter by "Council Candidates" → user appears
   - Stats show councilCandidates incremented
5. Check `/admin/analytics`:
   - Council Candidates count incremented
   - High/Critical Users count reflects the user

---

### Test 4: Email Safety Verification

**Goal**: Confirm that no email is sent unless explicitly enabled.

**Steps**:
1. With `INNER_CIRCLE_EMAILS_ENABLED=false`:
   - Call `POST /api/inner-circle/email-trigger` with `{ "event": "pressure_red" }`
   - **Expected**: `503 { "error": "EMAILS_NOT_ENABLED" }`
2. With `INNER_CIRCLE_EMAILS_ENABLED=true` (test environment only):
   - Call the same endpoint
   - **Expected**: Email is sent (check Resend dashboard or email log)
3. Verify no raw pressure text is stored:
   - Check `inner_circle_email_event_logs` table
   - Confirm no `concern` or raw input text is present
   - Only event type, userId, email, status, and timestamps are stored

---

### Test 5: Subscription Dormancy

**Goal**: Confirm that subscription restriction is not enforced.

**Steps**:
1. With `INNER_CIRCLE_SUBSCRIPTION_ENABLED=false`:
   - Complete the Rise-Decay Scorecard as a free user
   - Complete it again (second diagnostic)
   - **Expected**: Second diagnostic succeeds (no `FREE_DIAGNOSTIC_LIMIT_REACHED` error)
2. With `INNER_CIRCLE_SUBSCRIPTION_ENABLED=true` (test environment only):
   - Complete the Rise-Decay Scorecard as a free user
   - Complete it again
   - **Expected**: `403 { "error": "FREE_DIAGNOSTIC_LIMIT_REACHED" }`

---

### Test 6: Admin Queue Access Control

**Goal**: Confirm admin queue is admin-only.

**Steps**:
1. Access `/admin/advisory-queue` without admin session:
   - **Expected**: Redirect to login or 403
2. Access `/admin/analytics` without admin session:
   - **Expected**: Redirect to login or 403
3. Call `POST /api/admin/advisory-queue/action` without admin session:
   - **Expected**: `403 { "error": "ADMIN_REQUIRED" }`

---

### Test 7: No Raw Pressure Text in Storage

**Goal**: Confirm that no raw user concern text is stored in analytics, email logs, or advisory qualifications.

**Steps**:
1. Submit a pressure signal with identifiable text.
2. Check `pressure_signal_events` table:
   - `input_hash` contains SHA-256 hash (not raw text)
   - `result_json` contains only pressure level, warning, and route (not raw input)
   - `safe_metrics_json` contains only word count, char count, enterprise signal flag
3. Check `inner_circle_email_event_logs` table:
   - No raw concern text present
4. Check `inner_circle_advisory_qualifications` table:
   - `metadata_json` contains only domain names and flags (not raw input)
5. Check `inner_circle_diagnostic_results` table:
   - `answers_json` contains only numeric scores (1-5) and boolean flags

---

### Verification Checklist

| Check | Status |
|---|---|
| Low risk user creates no advisory qualification | ☐ |
| High risk user appears in advisory queue | ☐ |
| Admin can contact, convert, dismiss | ☐ |
| CSV export works without raw text | ☐ |
| Repeated High/Critical → Council Candidate | ☐ |
| Emails blocked when flag disabled | ☐ |
| Subscription not enforced when flag disabled | ☐ |
| Admin queue inaccessible to non-admin | ☐ |
| No raw pressure text in any table | ☐ |
| Beta banner visible on dashboard | ☐ |
| Worksheet actions created with due dates | ☐ |
| Analytics dashboard shows all funnel stages | ☐ |
