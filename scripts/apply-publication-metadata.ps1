<#
.SYNOPSIS
  Applies publication metadata to all 50 analytical intelligence briefs.
  Run once after editorial audit. Safe to re-run — only adds missing fields.

.USAGE
  pwsh scripts/apply-publication-metadata.ps1
#>

$BRIEFS_DIR = "C:\aol-check-visual\content\briefs"

# ─── Editorial audit scores (1-5) ──────────────────────────────────────────
# Criteria: thesis clarity, originality, authority, practical relevance,
# strategic depth, doctrine connection, product routing, absence of generic
# consulting language, factual safety, strength of conclusion.
# All briefs share the same disciplined 5-section structure.
# Score 5 = launch candidate | 4 = publication-ready | 3 = light edit needed

# ─── Complete metadata map ──────────────────────────────────────────────────
# Format: slug → @{ fields }
# publicationStatus: published | scheduled | editorial-hold
# season: S1 (launch/8), S2 (weeks 1-8/16), S3 (ongoing/26)
# featured: only S1 briefs
# publishedAt / scheduledFor: ISO date (Thursday cadence from 2026-06-11)

$META = @{

  # ── INSTITUTIONAL ALPHA ────────────────────────────────────────────────────

  "institutional-alpha-the-hidden-cost-of-flattering-data" = @{
    score = 5; publicationStatus = "published"; publishedAt = "2026-06-11"
    season = "S1"; featured = "true"; sequence = 1
    editorialCluster = "Reporting Integrity"
    primaryRoute = "/boardroom"; secondaryRoute = "/decision-pressure"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Audit your reporting chain for cosmetic distortion before the next board cycle."
  }

  "institutional-alpha-why-executive-summaries-mislead" = @{
    score = 5; publicationStatus = "published"; publishedAt = "2026-06-11"
    season = "S1"; featured = "true"; sequence = 2
    editorialCluster = "Reporting Integrity"
    primaryRoute = "/boardroom"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-012-aesthetics-of-order"
    innerCircleBridge = "Rewrite your executive briefing format against decision-grade standards."
  }

  "institutional-alpha-why-leaders-stop-hearing-reality" = @{
    score = 5; publicationStatus = "published"; publishedAt = "2026-06-11"
    season = "S1"; featured = "true"; sequence = 3
    editorialCluster = "Leadership Intelligence"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Diagnose the specific layer in your structure where reality is being filtered."
  }

  "institutional-alpha-when-the-board-sees-a-different-company" = @{
    score = 5; publicationStatus = "published"; publishedAt = "2026-06-11"
    season = "S1"; featured = "true"; sequence = 4
    editorialCluster = "Leadership Intelligence"
    primaryRoute = "/boardroom-brief"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Map the intelligence gap between what your board is briefed and what is operationally true."
  }

  "institutional-alpha-intelligence-after-the-founder-myth" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-06-18"
    season = "S2"; featured = "false"; sequence = 5
    editorialCluster = "Leadership Intelligence"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Build the intelligence layer that replaces founder intuition as the firm scales."
  }

  "institutional-alpha-the-politics-of-suppressed-bad-news" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-06-25"
    season = "S2"; featured = "false"; sequence = 6
    editorialCluster = "Reporting Integrity"
    primaryRoute = "/boardroom-brief"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-012-aesthetics-of-order"
    innerCircleBridge = "Identify where bad news stalls in your escalation chain and why."
  }

  "institutional-alpha-reporting-systems-that-reward-optimism" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-07-02"
    season = "S2"; featured = "false"; sequence = 7
    editorialCluster = "Reporting Integrity"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/boardroom"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Audit your reporting incentives to find where optimism is being structurally rewarded."
  }

  "institutional-alpha-intelligence-debt-in-scaling-firms" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-07-09"
    season = "S2"; featured = "false"; sequence = 8
    editorialCluster = "Decision Infrastructure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-004-parallel-estate"
    innerCircleBridge = "Quantify your firm's intelligence debt and build a clearance timeline."
  }

  "institutional-alpha-the-discipline-of-decision-grade-intelligence" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-07-16"
    season = "S2"; featured = "false"; sequence = 9
    editorialCluster = "Decision Infrastructure"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-012-aesthetics-of-order"
    innerCircleBridge = "Apply the decision-grade standard to your current briefing format and intelligence cycle."
  }

  "institutional-alpha-overinterpreting-motion-as-momentum" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-07-23"
    season = "S2"; featured = "false"; sequence = 10
    editorialCluster = "Leadership Intelligence"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Distinguish between genuine strategic progress and visible institutional activity."
  }

  "institutional-alpha-when-dashboards-outpace-judgment" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-07-30"
    season = "S2"; featured = "false"; sequence = 11
    editorialCluster = "Decision Infrastructure"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/boardroom"
    relatedCanon = "brief-012-aesthetics-of-order"
    innerCircleBridge = "Audit your dashboard environment against the standard of decision-grade judgment."
  }

  "institutional-alpha-the-blindness-of-clean-narratives" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-08-06"
    season = "S2"; featured = "false"; sequence = 12
    editorialCluster = "Reporting Integrity"
    primaryRoute = "/boardroom-brief"; secondaryRoute = "/decision-pressure"
    relatedCanon = "brief-012-aesthetics-of-order"
    innerCircleBridge = "Identify the friction points being smoothed out of your executive narrative."
  }

  "institutional-alpha-when-risk-travels-faster-than-reporting" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-08-13"
    season = "S2"; featured = "false"; sequence = 13
    editorialCluster = "Decision Infrastructure"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/boardroom"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Map the lag between risk materialisation and your earliest reporting signal."
  }

  "institutional-alpha-false-confidence-from-aggregated-metrics" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-08-20"
    season = "S3"; featured = "false"; sequence = 14
    editorialCluster = "Decision Infrastructure"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Disaggregate your key executive metrics to surface the local conditions they conceal."
  }

  "institutional-alpha-signal-decay-in-reporting-chains" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-08-27"
    season = "S3"; featured = "false"; sequence = 15
    editorialCluster = "Reporting Integrity"
    primaryRoute = "/boardroom"; secondaryRoute = "/decision-pressure"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Trace where urgency and nuance are lost between operational reality and the board room."
  }

  "institutional-alpha-the-comfort-of-lagging-indicators" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-09-03"
    season = "S3"; featured = "false"; sequence = 16
    editorialCluster = "Decision Infrastructure"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Replace lagging reassurance signals with early-warning diagnostics tuned to your operating context."
  }

  "institutional-alpha-pattern-recognition-without-operating-truth" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-09-10"
    season = "S3"; featured = "false"; sequence = 17
    editorialCluster = "Leadership Intelligence"
    primaryRoute = "/strategy-room"; secondaryRoute = "/decision-pressure"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Audit the operating truth your pattern analysis is built on."
  }

  "institutional-alpha-the-institutional-price-of-guesswork" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-09-17"
    season = "S3"; featured = "false"; sequence = 18
    editorialCluster = "Decision Infrastructure"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-008-ledger-of-legacy"
    innerCircleBridge = "Identify the decisions in your current pipeline that are being made on guesswork."
  }

  "institutional-alpha-when-scenario-planning-becomes-theatre" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-09-24"
    season = "S3"; featured = "false"; sequence = 19
    editorialCluster = "Decision Infrastructure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-012-aesthetics-of-order"
    innerCircleBridge = "Rebuild your scenario planning process against the standard that makes it decision-worthy."
  }

  "institutional-alpha-the-breakdown-of-field-intelligence" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-10-01"
    season = "S3"; featured = "false"; sequence = 20
    editorialCluster = "Reporting Integrity"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-004-parallel-estate"
    innerCircleBridge = "Restore direct field intelligence channels that have been replaced by centralised interpretation."
  }

  "institutional-alpha-when-analysts-inherit-a-broken-mandate" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-10-08"
    season = "S3"; featured = "false"; sequence = 21
    editorialCluster = "Reporting Integrity"
    primaryRoute = "/boardroom-brief"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-012-aesthetics-of-order"
    innerCircleBridge = "Clarify the mandate and success criteria for your intelligence and analytics function."
  }

  "institutional-alpha-the-difference-between-insight-and-surveillance" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-10-15"
    season = "S3"; featured = "false"; sequence = 22
    editorialCluster = "Leadership Intelligence"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Assess whether your monitoring environment is producing insight or creating friction."
  }

  "institutional-alpha-the-danger-of-unaudited-assumptions" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-10-22"
    season = "S3"; featured = "false"; sequence = 23
    editorialCluster = "Decision Infrastructure"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Run an assumption audit against your current strategic plan or operating model."
  }

  "institutional-alpha-intelligence-drift-after-rapid-expansion" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-10-29"
    season = "S3"; featured = "false"; sequence = 24
    editorialCluster = "Leadership Intelligence"
    primaryRoute = "/strategy-room"; secondaryRoute = "/decision-pressure"
    relatedCanon = "brief-004-parallel-estate"
    innerCircleBridge = "Assess the intelligence architecture that was built before your last expansion phase."
  }

  "institutional-alpha-weak-signals-before-reputational-fracture" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-11-05"
    season = "S3"; featured = "false"; sequence = 25
    editorialCluster = "Leadership Intelligence"
    primaryRoute = "/decision-pressure"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-008-ledger-of-legacy"
    innerCircleBridge = "Build an early-warning protocol for reputational signals before they become undeniable events."
  }

  # ── SOVEREIGN INTELLIGENCE ─────────────────────────────────────────────────

  "sovereign-intelligence-dependence-disguised-as-partnership" = @{
    score = 5; publicationStatus = "published"; publishedAt = "2026-06-11"
    season = "S1"; featured = "true"; sequence = 26
    editorialCluster = "Sovereignty Structure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-004-parallel-estate"
    innerCircleBridge = "Audit your critical dependencies for disguised leverage loss before conditions change."
  }

  "sovereign-intelligence-alignment-without-sovereignty" = @{
    score = 5; publicationStatus = "published"; publishedAt = "2026-06-11"
    season = "S1"; featured = "true"; sequence = 27
    editorialCluster = "Institutional Identity"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-007-covenantal-oath"
    innerCircleBridge = "Distinguish surface alignment from genuine decision authority across your leadership structure."
  }

  "sovereign-intelligence-the-vulnerability-of-narrative-capture" = @{
    score = 5; publicationStatus = "published"; publishedAt = "2026-06-11"
    season = "S1"; featured = "true"; sequence = 28
    editorialCluster = "Institutional Identity"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Assess whether your institutional narrative is governed by you or shaped by external stakeholders."
  }

  "sovereign-intelligence-why-power-concentrates-around-the-decisive" = @{
    score = 5; publicationStatus = "published"; publishedAt = "2026-06-11"
    season = "S1"; featured = "true"; sequence = 29
    editorialCluster = "Power and Influence"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-010-geometry-of-inner-circle"
    innerCircleBridge = "Map where decisive authority actually sits in your institution versus where governance says it does."
  }

  "sovereign-intelligence-when-optionality-quietly-dies" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-06-18"
    season = "S2"; featured = "false"; sequence = 30
    editorialCluster = "Sovereignty Structure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Map the cumulative commitments that are quietly eliminating your institution's future freedom of action."
  }

  "sovereign-intelligence-when-institutions-become-too-easy-to-pressure" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-06-25"
    season = "S2"; featured = "false"; sequence = 31
    editorialCluster = "Institutional Identity"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-007-covenantal-oath"
    innerCircleBridge = "Identify the specific vectors through which your institution is most vulnerable to external pressure."
  }

  "sovereign-intelligence-pricing-power-as-a-test-of-institutional-freedom" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-07-02"
    season = "S2"; featured = "false"; sequence = 32
    editorialCluster = "Strategic Exposure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Use pricing as a diagnostic instrument for real institutional leverage and market standing."
  }

  "sovereign-intelligence-the-geography-of-hidden-influence" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-07-09"
    season = "S2"; featured = "false"; sequence = 33
    editorialCluster = "Power and Influence"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-010-geometry-of-inner-circle"
    innerCircleBridge = "Map the informal influence networks operating beneath your formal governance structures."
  }

  "sovereign-intelligence-the-discipline-of-institutional-self-government" = @{
    score = 5; publicationStatus = "scheduled"; scheduledFor = "2026-07-16"
    season = "S2"; featured = "false"; sequence = 34
    editorialCluster = "Institutional Identity"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-004-parallel-estate"
    innerCircleBridge = "Assess your institution against the disciplines of genuine self-government."
  }

  "sovereign-intelligence-the-tax-of-strategic-appeasement" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-07-23"
    season = "S2"; featured = "false"; sequence = 35
    editorialCluster = "Power and Influence"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-007-covenantal-oath"
    innerCircleBridge = "Calculate the accumulated cost of stakeholder appeasement in your current strategic posture."
  }

  "sovereign-intelligence-the-strategic-risk-of-needing-everyone-to-like-you" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-07-30"
    season = "S2"; featured = "false"; sequence = 36
    editorialCluster = "Institutional Identity"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-007-covenantal-oath"
    innerCircleBridge = "Identify the approval dependencies that constrain your institution's governing courage."
  }

  "sovereign-intelligence-the-cost-of-borrowed-legitimacy" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-08-06"
    season = "S2"; featured = "false"; sequence = 37
    editorialCluster = "Institutional Identity"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Audit the external prestige your institution relies on to stabilise internal authority."
  }

  "sovereign-intelligence-strategic-exposure-without-red-lines" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-08-13"
    season = "S2"; featured = "false"; sequence = 38
    editorialCluster = "Sovereignty Structure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-004-parallel-estate"
    innerCircleBridge = "Define the red lines that protect your institution's freedom of action before negotiations require them."
  }

  "sovereign-intelligence-fragile-autonomy-in-capital-dependent-firms" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-08-20"
    season = "S3"; featured = "false"; sequence = 39
    editorialCluster = "Strategic Exposure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Map the autonomy constraints your capital structure imposes on governing decisions."
  }

  "sovereign-intelligence-control-without-ownership" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-08-27"
    season = "S3"; featured = "false"; sequence = 40
    editorialCluster = "Sovereignty Structure"
    primaryRoute = "/boardroom-brief"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-004-parallel-estate"
    innerCircleBridge = "Clarify where your institution carries risk without carrying the authority to govern the outcome."
  }

  "sovereign-intelligence-the-illusion-of-neutral-platforms" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-09-03"
    season = "S3"; featured = "false"; sequence = 41
    editorialCluster = "Strategic Exposure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-004-parallel-estate"
    innerCircleBridge = "Assess your infrastructure and platform dependencies for embedded governance risk."
  }

  "sovereign-intelligence-the-weakness-of-outsourced-judgment" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-09-10"
    season = "S3"; featured = "false"; sequence = 42
    editorialCluster = "Power and Influence"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Identify the judgment that has been outsourced and should be reclaimed."
  }

  "sovereign-intelligence-sovereignty-at-the-edge-of-regulation" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-09-17"
    season = "S3"; featured = "false"; sequence = 43
    editorialCluster = "Strategic Exposure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Define your institution's governing posture at the boundary where regulatory interpretation is contested."
  }

  "sovereign-intelligence-internal-empires-and-the-loss-of-common-rule" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-09-24"
    season = "S3"; featured = "false"; sequence = 44
    editorialCluster = "Power and Influence"
    primaryRoute = "/boardroom-brief"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-010-geometry-of-inner-circle"
    innerCircleBridge = "Map the internal power centres in your institution that operate outside common rule."
  }

  "sovereign-intelligence-the-false-safety-of-strategic-silence" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-10-01"
    season = "S3"; featured = "false"; sequence = 45
    editorialCluster = "Institutional Identity"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-007-covenantal-oath"
    innerCircleBridge = "Assess the truths your institution is withholding and the cost of that silence."
  }

  "sovereign-intelligence-the-price-of-letting-others-set-your-time-horizon" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-10-08"
    season = "S3"; featured = "false"; sequence = 46
    editorialCluster = "Strategic Exposure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-009-sovereignty-of-time"
    innerCircleBridge = "Reclaim your institution's time horizon from external stakeholders who are currently setting it."
  }

  "sovereign-intelligence-the-strategic-consequence-of-weak-exit-paths" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-10-15"
    season = "S3"; featured = "false"; sequence = 47
    editorialCluster = "Sovereignty Structure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-004-parallel-estate"
    innerCircleBridge = "Build viable exit paths into your current strategic relationships while conditions are still cordial."
  }

  "sovereign-intelligence-identity-drift-in-institutions-under-external-pressure" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-10-22"
    season = "S3"; featured = "false"; sequence = 48
    editorialCluster = "Institutional Identity"
    primaryRoute = "/strategy-room"; secondaryRoute = "/inner-circle"
    relatedCanon = "brief-007-covenantal-oath"
    innerCircleBridge = "Diagnose the identity adaptations your institution has made under pressure and assess which are degrading."
  }

  "sovereign-intelligence-strategic-ambition-without-sovereign-capacity" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-10-29"
    season = "S3"; featured = "false"; sequence = 49
    editorialCluster = "Strategic Exposure"
    primaryRoute = "/strategy-room"; secondaryRoute = "/boardroom-brief"
    relatedCanon = "brief-002-economic-fortress"
    innerCircleBridge = "Align your institution's ambition scale to its actual sovereign capacity before the next planning cycle."
  }

  "sovereign-intelligence-the-governance-cost-of-permanent-exception" = @{
    score = 4; publicationStatus = "scheduled"; scheduledFor = "2026-11-05"
    season = "S3"; featured = "false"; sequence = 50
    editorialCluster = "Strategic Exposure"
    primaryRoute = "/boardroom-brief"; secondaryRoute = "/strategy-room"
    relatedCanon = "brief-010-geometry-of-inner-circle"
    innerCircleBridge = "Audit the permanent exceptions operating in your governance structure and the authority they have quietly transferred."
  }
}

# ─── Apply metadata to MDX files ────────────────────────────────────────────

$applied = 0; $skipped = 0; $notFound = 0

foreach ($slug in $META.Keys) {
    $filePath = Join-Path $BRIEFS_DIR "$slug.mdx"
    if (-not (Test-Path $filePath)) { Write-Warning "NOT FOUND: $slug"; $notFound++; continue }

    $m = $META[$slug]
    $content = [System.IO.File]::ReadAllText($filePath, [System.Text.UTF8Encoding]::new($false))
    $fmMatch = [regex]::Match($content, '(?ms)^---\r?\n(.+?)\r?\n---')
    if (-not $fmMatch.Success) { Write-Warning "NO FRONTMATTER: $slug"; $skipped++; continue }

    $fmText = $fmMatch.Groups[1].Value
    $modified = $false

    $fieldsToAdd = [ordered]@{
        "editorialScore"     = $m.score
        "publicationStatus"  = $m.publicationStatus
        "season"             = $m.season
        "sequence"           = $m.sequence
        "featured"           = $m.featured
        "editorialCluster"   = "`"$($m.editorialCluster)`""
        "primaryRoute"       = "`"$($m.primaryRoute)`""
        "secondaryRoute"     = "`"$($m.secondaryRoute)`""
        "relatedCanon"       = "`"$($m.relatedCanon)`""
        "innerCircleBridge"  = "`"$($m.innerCircleBridge)`""
    }

    # Add publishedAt or scheduledFor
    if ($m.publicationStatus -eq "published" -and $m.publishedAt) {
        $fieldsToAdd["publishedAt"] = "`"$($m.publishedAt)`""
    }
    if ($m.publicationStatus -eq "scheduled" -and $m.scheduledFor) {
        $fieldsToAdd["scheduledFor"] = "`"$($m.scheduledFor)`""
    }

    foreach ($key in $fieldsToAdd.Keys) {
        if ($fmText -notmatch "(?m)^$key\s*:") {
            $fmText = $fmText.TrimEnd() + "`n${key}: $($fieldsToAdd[$key])"
            $modified = $true
        }
    }

    if ($modified) {
        $newContent = $content -replace '(?ms)^---\r?\n(.+?)\r?\n---', "---`n$fmText`n---"
        [System.IO.File]::WriteAllText($filePath, $newContent, [System.Text.UTF8Encoding]::new($false))
        $applied++
    } else {
        $skipped++
    }
}

Write-Host "Applied: $applied | Already had metadata: $skipped | Not found: $notFound"
