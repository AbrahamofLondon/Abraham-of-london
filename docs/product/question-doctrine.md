# Question Doctrine — Abraham of London

> Established: 2026-05-08
> Status: Permanent standard for all future product design.
> Authority: Product architecture. No question may be added to any product surface without meeting this doctrine.

---

## The 15 Rules

### 1. No question without evidence yield.

Every question must produce at least one of: decision clarity, contradiction signal, authority mapping, cost/consequence pricing, execution evidence, verification anchor, recurrence detection, or retainer/boardroom usefulness. If a question cannot be traced to a downstream output that changes what the system does, it does not belong.

**Test:** "What downstream output degrades if we remove this question?" If the answer is "none," remove it.

### 2. No vague question where precision is required.

A question that accepts "things are generally fine" or "we're working on it" has failed. Every question on a paid surface must constrain the user to name a specific person, event, number, date, or structural condition. Words like "broadly," "generally," "various," and "somewhat" are signals that the question is too soft.

**Test:** "Can this question be answered with a single adjective?" If yes, it is too vague.

### 3. No generic question on a premium surface.

A question that could appear in a Google Form, an employee pulse survey, a coaching intake, or a personality test has no place in a governed decision infrastructure. Every question must feel like it was designed for this product and no other.

**Test:** "Would a competitor's product ask this exact question?" If yes, rewrite it.

### 4. No question that asks for sensitive information without clear purpose.

If a question collects data that could be harmful if breached — financial exposure, personal relationships, internal conflicts, authority failures — the system must demonstrate why it needs this data and what it will do with it. No fishing. No data hoarding.

**Test:** "If this answer leaked, would the user be harmed?" If yes, the question must be essential, not optional.

### 5. No question that flatters the user into comfort.

A question that invites the user to confirm they are doing well is not a diagnostic — it is a compliment. Questions must test what the user claims against what the evidence suggests. If the user can answer every question positively and feel good about themselves, the question set has failed.

**Test:** "Can an honest person feel uncomfortable answering this?" If no, it is too soft.

### 6. No question that humiliates the user into defensiveness.

Discomfort is useful. Shame is not. A question that makes the user feel stupid, attacked, or judged will produce defensive answers, which are useless evidence. The right question makes the user think harder, not feel smaller.

**Test:** "Would an executive refuse to answer this in front of their board?" If yes because of shame (not sensitivity), the question is too aggressive.

### 7. Every major stage must expose at least one contradiction.

A stage that produces only affirmative signals has failed its diagnostic purpose. At minimum, one question per stage must create the possibility that two things the user believes cannot both be true. The dual-axis resonance/certainty mechanism, the leader/reality phase gap, and the reverse-scored constitutional questions are examples of contradiction architecture.

**Test:** "Can a user complete this stage without their beliefs being challenged?" If yes, add a contradiction-forcing question.

### 8. Every paid stage must establish consequence.

Before a user enters a paid stage (Executive Reporting, Strategy Room, Retainer), the system must have priced the cost of inaction. This means at least one question in every paid entry path must ask: "What gets more expensive, more damaged, or more irreversible if you do not act?"

**Test:** "Does this stage know what the user stands to lose?" If not, consequence has not been established.

### 9. Every execution stage must create accountability.

Before strategy is delivered, the user must commit to act. This commitment must be specific enough to be verified later. "I will think about it" is not a commitment. "I will implement the first recommended action within 48 hours" is. The commitment must be stored and referenced in future interactions.

**Test:** "Can the system confront this user 30 days later with what they said they would do?" If not, accountability was not created.

### 10. Every return stage must test what changed.

When a user returns to the system — via Return Brief, Outcome Verification, or re-assessment — the system must test whether the structural condition changed, not whether the user feels better. Outcome verification must compare baseline vs. current across measurable dimensions.

**Test:** "Does the return stage use evidence from the original assessment?" If not, it is performing a new assessment, not verifying an outcome.

### 11. Every retainer stage must reveal what would have been missed.

The retainer's value proposition is: "Without ongoing oversight, this would have gone undetected." Every retainer-stage question or output must surface something the client could not have seen alone — a recurrence, a deterioration, a contradiction that only appears over time, a commitment that was not honoured.

**Test:** "If oversight stopped, would this signal exist?" If yes, it is not a retainer-grade insight.

### 12. Every team/enterprise question must protect respondent privacy.

Respondent answers must be aggregated, anonymised, and sample-safety-checked before appearing in any output. No question should invite the respondent to write identifying details. No output should allow a leader to trace an answer to a specific respondent when the sample is small.

**Test:** "Could a leader identify who gave this answer?" If yes with a team of fewer than 10, the output must be suppressed.

### 13. Every boardroom question must be answerable by evidence, not opinion.

A boardroom-grade question produces an answer that can be defended in a formal governance setting. "Do you think the organisation is doing well?" is opinion. "Are the three stated priorities reflected in actual resource allocation this quarter?" is evidence.

**Test:** "Could this answer survive a board challenge: 'How do you know?'" If not, it is opinion, not evidence.

### 14. The system must ask fewer but better questions.

More questions do not produce better evidence. They produce fatigue, social desirability bias, and abandonment. Every new question added must justify its existence by demonstrating that it produces evidence no existing question captures. If two questions test the same construct, one must be removed.

**Test:** "Does removing this question reduce the system's ability to classify, route, or report?" If not, it is redundant.

### 15. A question is only premium if the answer changes what the system can responsibly do next.

A question that collects data for a dashboard is not premium. A question whose answer determines whether the system routes to Strategy Room or rejects the case, whether it escalates to counsel or continues monitoring, whether it reveals a contradiction or suppresses a weak signal — that question is premium. Every question should earn its place by changing a system decision.

**Test:** "Does this answer affect routing, scoring, escalation, suppression, or output generation?" If yes, it is premium. If not, it is decoration.

---

## Application

This doctrine applies to:
- All new question design
- All question rewrites
- All question sequence decisions
- All dynamic follow-up template creation
- All respondent-facing assessment design
- All retainer/counsel/boardroom question surfaces

No question may be shipped to production without a doctrine compliance check.

A question that violates any rule must be flagged, rewritten, or removed before deployment.

---

## Cross-Ladder Coherence Addendum (2026-05-08)

These rules extend the doctrine to cover the whole-ladder experience, including assessment-adjacent surfaces.

### 16. No assessment should copy another surface's role.

Each surface has one diagnostic job. Fast Diagnostic captures the first contradiction. Purpose Alignment reads the personal operating pattern. Constitutional reads the institutional structure. If two surfaces ask the same question, one of them is redundant.

### 17. The same signal may recur, but each recurrence must deepen context.

Cost of delay may be asked in the Fast Diagnostic, Executive Reporting, and Strategy Room. Each instance must ask at a higher level of specificity than the last. Repetition without deepening is wasted time.

### 18. Free does not mean casual.

Time, attention, and emotional exposure are real costs. A free assessment must earn those costs with the same seriousness as a paid one. The difference between free and paid is scope, not quality.

### 19. Respondent questions must be safe, anonymous where promised, and non-accusatory.

No respondent question may ask for names, blame, or identifying details. Aggregation and small-sample suppression must be enforced at the evidence layer, not left to the question layer.

### 20. Enterprise questions must sound like institutional reality, not HR compliance.

If a question could appear in a corporate engagement survey, it does not belong in this product. Enterprise questions must test structural condition, not cultural sentiment.

### 21. Assessment-adjacent surfaces are part of the questioning architecture.

Retainer intake, counsel workflow, oversight review, organisation setup, and campaign creation are not "admin forms." They are surfaces where institutional trust is established or broken. They must be designed with the same intentionality as core assessments.

### 22. Every answer given must be available to every surface that could benefit from it.

If the user tells Purpose Alignment what they are avoiding, and the Return Brief does not reference that avoidance when the pattern returns, the product has broken its promise. Memory is not optional. Memory is the product.

---

## The Standard

> A question is either governance or it is noise.
> If it does not produce evidence, surface contradiction, force commitment, or price consequence, it does not belong in this product.
> The question layer is not a form. It is the institution's first encounter with the truth about itself.
> The product is not seven assessments stitched together. It is one governed journey through truth, consequence, correction, and memory.
