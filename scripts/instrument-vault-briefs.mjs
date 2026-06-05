import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const VAULT_DIR = path.join(ROOT, "content", "vault", "briefs");
const PUBLIC_ROUTE = "/vault/briefs";

const KEYS = [
  "riseDecayScore",
  "riseDecayTarget",
  "severityScore",
  "resilienceTarget",
  "primaryFracture",
  "failureMode",
  "prerequisites",
  "nextBrief",
  "relatedBriefs",
  "relatedTool",
  "implementationHorizon",
  "kpis",
  "innerCircleCompanion",
];

const COMPANIONS = {
  riseDecay: "Rise-Decay Scorecard",
  decisionRights: "Decision Rights Charter",
  frontierStress: "Frontier Resilience Stress Test",
  keyPerson: "Key-Person Risk Scorecard",
  signal: "Signal Discipline Standards",
  cadence: "Cadence Health Checklist",
  crisis: "Crisis Loop Interruption Protocol",
  ledger: "Legacy Ledger Template",
  council: "Inner Circle Council Charter",
  oath: "Covenantal Oath Template",
};

const files = fs
  .readdirSync(VAULT_DIR)
  .filter((file) => file.endsWith(".mdx"))
  .sort();

const canonFiles = files.filter((file) => /^brief-\d{3}-/.test(file));
const frontierFiles = files.filter((file) => file.startsWith("frontier-resilience-"));
const allSlugs = files.map((file) => file.replace(/\.mdx$/i, ""));

function read(file) {
  return fs.readFileSync(path.join(VAULT_DIR, file), "utf8");
}

function write(file, content) {
  fs.writeFileSync(path.join(VAULT_DIR, file), content, "utf8");
}

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`Missing frontmatter`);
  return {
    raw: match[1],
    body: content.slice(match[0].length),
  };
}

function frontmatterValue(raw, key) {
  const match = raw.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}

function quote(value) {
  return JSON.stringify(String(value));
}

function yamlList(key, values) {
  return [ `${key}:`, ...values.map((value) => `  - ${quote(value)}`) ].join("\n");
}

function removeKeyBlocks(raw) {
  const lines = raw.split(/\r?\n/);
  const output = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const key = line.match(/^([A-Za-z][\w-]*):/)?.[1];
    if (!key || !KEYS.includes(key)) {
      output.push(line);
      continue;
    }

    while (index + 1 < lines.length && !/^[A-Za-z][\w-]*:/.test(lines[index + 1])) {
      index++;
    }
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

function cleanTitle(title) {
  return title
    .replace(/^Brief #\d+:\s*/i, "")
    .replace(/^Frontier Resilience\s+\d+\s+[—-]\s+/i, "")
    .replace(/^Frontier Resilience\s+[—-]\s+/i, "")
    .trim();
}

function route(slug) {
  return `${PUBLIC_ROUTE}/${slug}`;
}

function nextRoute(file, groupFiles) {
  const index = groupFiles.indexOf(file);
  if (index >= 0 && index < groupFiles.length - 1) {
    return route(groupFiles[index + 1].replace(/\.mdx$/i, ""));
  }
  if (groupFiles === canonFiles) {
    return route("frontier-resilience-surviving-volatility-without-losing-governing-order");
  }
  return route("brief-001-modern-household");
}

function relatedRoutes(file, groupFiles) {
  const slug = file.replace(/\.mdx$/i, "");
  const index = groupFiles.indexOf(file);
  const related = [];
  if (index > 0) related.push(route(groupFiles[index - 1].replace(/\.mdx$/i, "")));
  if (index < groupFiles.length - 1) related.push(route(groupFiles[index + 1].replace(/\.mdx$/i, "")));
  if (related.length === 0) {
    related.push(route(groupFiles.find((entry) => entry !== file)?.replace(/\.mdx$/i, "") || allSlugs[0]));
  }

  if (/brief-012/.test(file)) related.push(route("brief-006-sisterhood-and-hearth"));
  if (/brief-010/.test(file)) related.push(route("frontier-resilience-founder-endurance-is-not-a-plan"));
  if (/brief-002/.test(file)) related.push(route("frontier-resilience-surviving-volatility-without-losing-governing-order"));
  if (/stress-reveals/.test(file)) related.push(route("brief-012-aesthetics-of-order"));
  if (/founder-endurance/.test(file)) related.push(route("brief-010-geometry-of-inner-circle"));
  if (/surviving-volatility/.test(file)) related.push(route("brief-002-economic-fortress"));

  return [...new Set(related.filter((entry) => !entry.endsWith(`/${slug}`)))].slice(0, 3);
}

function toolFor(file) {
  if (/brief-007/.test(file)) return COMPANIONS.oath;
  if (/brief-008|brief-009|legacy|ledger/.test(file)) return COMPANIONS.ledger;
  if (/brief-010|brotherhood|inner-circle|council/.test(file)) return COMPANIONS.council;
  if (/brief-012|stress-reveals|surviving-bad-information|clarity/.test(file)) return COMPANIONS.signal;
  if (/founder|key-person|heroic/.test(file)) return COMPANIONS.keyPerson;
  if (/cadence|fatigue|busy|latency|delay/.test(file)) return COMPANIONS.cadence;
  if (/crisis|recovery|urgency|escalation|reaction/.test(file)) return COMPANIONS.crisis;
  if (file.startsWith("frontier-resilience-")) return COMPANIONS.frontierStress;
  if (/brief-002|economic|fortress/.test(file)) return COMPANIONS.riseDecay;
  return COMPANIONS.riseDecay;
}

function specialFrame(slug) {
  const map = {
    "brief-012-aesthetics-of-order": {
      failureMode: "Environmental disorder lengthens decisions, weakens memory, and teaches heirs that standards are optional.",
      primaryFracture: "The estate's visible order no longer transmits governance, signal discipline, institutional memory, and standard-bearing authority.",
      indicators: [
        "Rooms require repeated interpretation before work or family rhythm can begin.",
        "Objects, media, and layouts reward distraction rather than command.",
        "Standards are explained verbally because the environment no longer carries them.",
      ],
      horizon: "30 days to remove contradiction from the primary room; 90 days to assign standards and custody; 12 months to make environmental order a transmission system.",
      innerCircle: "Inner Circle application converts aesthetics into a governed signal system: room standards, custody owners, decision-latency checks, memory anchors, and heirloom policy.",
    },
    "brief-010-geometry-of-inner-circle": {
      failureMode: "Counsel exists, but no one carries enough mandate, visibility, or courage to correct the leader before drift hardens.",
      primaryFracture: "Advice is fragmented across vendors, subordinates, and friends without a governed circle of truth-bearing authority.",
      indicators: [
        "The leader receives technical input but avoids whole-life correction.",
        "No advisor can challenge capital, conduct, counsel, and timing in the same room.",
        "Decisions are delayed because no one owns escalation outside the founder.",
      ],
      horizon: "14 days to map existing counsel; 60 days to define circle roles and decision rights; 6 months to test whether the circle can hold truth under commercial pressure.",
      innerCircle: "Inner Circle application defines the council charter, disclosure covenant, escalation protocol, and decision-right boundaries for the live leader.",
    },
    "brief-002-economic-fortress": {
      failureMode: "Capital exists, but the institution cannot say no when funding, debt, liquidity, or counterparties apply pressure.",
      primaryFracture: "Financial assets are managed as portfolio performance rather than governed as mission-bearing capacity.",
      indicators: [
        "Runway is measured, but decision freedom is not.",
        "Debt, platform dependency, or fee complexity quietly controls strategic timing.",
        "Capital has no written rule for sacrifice, reserve, and transmission.",
      ],
      horizon: "30 days to identify permission-based exposure; 90 days to establish reserve and debt rules; 12 months to align capital custody with mission continuity.",
      innerCircle: "Inner Circle application converts the brief into a capital command review: exposure register, reserve doctrine, debt mandate, and mission-aligned allocation rules.",
    },
    "frontier-resilience-surviving-volatility-without-losing-governing-order": {
      failureMode: "Volatility reaches the institution faster than authority, liquidity, and memory can respond.",
      primaryFracture: "The operating model was built for calm conditions and cannot preserve governing order when assumptions fail.",
      indicators: [
        "Escalations depend on personality rather than thresholds.",
        "Liquidity is counted as cash only, not room to move.",
        "One local disruption can paralyse the whole system.",
      ],
      horizon: "30 days to map brittle nodes; 90 days to assign authority thresholds and liquidity reserves; 6 months to test shock absorption without surrendering command.",
      innerCircle: "Inner Circle application becomes a Frontier Resilience Stress Test: authority map, liquidity ladder, latency audit, memory review, and shock simulation.",
    },
    "frontier-resilience-stress-reveals-the-real-culture": {
      failureMode: "Stated values remain attractive while operating habits reveal a different rule under pressure.",
      primaryFracture: "Culture has been narrated, not governed; stress exposes who is protected, what is excused, and where truth is slowed.",
      indicators: [
        "Standards soften for high-status performers.",
        "Bad news changes shape before it reaches authority.",
        "Fatigue becomes an excuse for disorder rather than a signal for correction.",
      ],
      horizon: "14 days to record pressure behaviours; 60 days to name contradictions between language and conduct; 6 months to rebuild incentives, correction rituals, and leadership consequences.",
      innerCircle: "Inner Circle application converts stress into a culture audit: behaviour log, protected-exception review, truth-flow map, and leadership correction sequence.",
    },
    "frontier-resilience-founder-endurance-is-not-a-plan": {
      failureMode: "The founder is treated as escalation layer, memory store, shock absorber, and final quality control.",
      primaryFracture: "Authority has not been distributed into governed second-line capability.",
      indicators: [
        "Critical decisions slow when the founder is unavailable.",
        "Team confidence depends on founder presence rather than clear operating law.",
        "Recovery after strain requires personal rescue, not system correction.",
      ],
      horizon: "14 days to list founder-dependent functions; 60 days to assign second-line decision owners; 6 months to test absence, escalation, and documented judgement under pressure.",
      innerCircle: "Inner Circle application becomes a Decision Rights Charter: founder dependency map, escalation rights, second-line authority, absence drills, and cadence correction.",
    },
  };
  return map[slug] || null;
}

function genericFrame({ title, isFrontier, tool }) {
  const clean = cleanTitle(title);
  if (isFrontier) {
    return {
      failureMode: `${clean} becomes a recurring pressure pattern rather than an exception requiring command attention.`,
      primaryFracture: "The institution lacks a governed response before pressure changes behaviour, sequencing, and truth flow.",
      indicators: [
        "Pressure changes who owns the decision.",
        "Signals arrive late or lose force before reaching authority.",
        "Recovery depends on effort rather than designed cadence.",
      ],
      horizon: "14 days to name the pattern; 60 days to assign authority and cadence; 6 months to test whether the correction holds under renewed pressure.",
      innerCircle: `Inner Circle application connects this brief to the ${tool}, using live evidence to sequence repair without exposing private worksheets publicly.`,
    };
  }

  return {
    failureMode: `${clean} remains a stated standard but does not govern behaviour, custody, or transmission.`,
    primaryFracture: "The doctrine has not been converted into visible order, named responsibility, and repeatable household or institutional practice.",
    indicators: [
      "The standard requires explanation because the system does not carry it.",
      "Responsibility is present in language but absent from custody.",
      "Decay is tolerated until it becomes normal.",
    ],
    horizon: "30 days to identify visible decay; 90 days to assign custody and cadence; 12 months to make the standard transferable without the founder's constant intervention.",
    innerCircle: `Inner Circle application connects this brief to the ${tool}, turning public doctrine into a governed private instrument.`,
  };
}

function stripOldApplicationFrame(body) {
  return body
    .replace(/\n---\n\n### Governance Application Frame\n\n[\s\S]*?(?=\n<Note|\n<DocumentFooter>)/g, "\n")
    .replace(/\n## [IVX]+\. Application Frame\n\n[\s\S]*?(?=\n<DocumentFooter>)/g, "\n")
    .replace(/\n## What Failure Looks Like\n\n[\s\S]*?(?=\n<Note|\n<DocumentFooter>)/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n");
}

function normalizeEscapedNewlines(body) {
  return body
    .replace(/`r`n/g, "\n")
    .replace(/`n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n");
}

function buildPublicModule({ frame, related, tool, isFrontier }) {
  const indicatorHeading = isFrontier ? "Pressure Indicators" : "Rise-Decay Indicators";
  return [
    "## What Failure Looks Like",
    "",
    frame.failureMode,
    "",
    "## Primary Fracture",
    "",
    frame.primaryFracture,
    "",
    `## ${indicatorHeading}`,
    "",
    ...frame.indicators.map((item) => `- ${item}`),
    "",
    "## Implementation Horizon",
    "",
    frame.horizon,
    "",
    "## Related Briefs",
    "",
    related.map((href) => `[${href.split("/").pop()}](${href})`).join(" · "),
    "",
    "## Inner Circle Application",
    "",
    `${frame.innerCircle} Related gated companion: **${tool}**.`,
    "",
  ].join("\n");
}

function insertPublicModule(body, module) {
  const target = body.includes("\n<Note")
    ? "\n<Note"
    : body.includes("\n<DocumentFooter>")
      ? "\n<DocumentFooter>"
      : "";

  if (!target) return `${body.trimEnd()}\n\n${module}`;
  return body.replace(target, `\n${module}${target}`);
}

function scoreFor(file, isFrontier) {
  const slug = file.replace(/\.mdx$/i, "");
  if (slug === "brief-012-aesthetics-of-order") return 8;
  if (slug === "brief-010-geometry-of-inner-circle") return 9;
  if (slug === "brief-002-economic-fortress") return 9;
  if (isFrontier && /crisis|recovery|urgency|stress|founder|volatility|key-person/.test(slug)) return 8;
  if (isFrontier) return 7;
  return 7;
}

for (const file of files) {
  const isFrontier = file.startsWith("frontier-resilience-");
  const groupFiles = isFrontier ? frontierFiles : canonFiles;
  const slug = file.replace(/\.mdx$/i, "");
  const content = read(file);
  const { raw, body } = extractFrontmatter(content);
  const title = frontmatterValue(raw, "title") || slug;
  const tool = toolFor(file);
  const related = relatedRoutes(file, groupFiles);
  const next = nextRoute(file, groupFiles);
  const frame = specialFrame(slug) || genericFrame({ title, isFrontier, tool });
  const score = scoreFor(file, isFrontier);

  const additions = [];
  if (isFrontier) {
    additions.push(`severityScore: ${score}`);
    additions.push(`resilienceTarget: ${quote("Governing order preserved under pressure with named authority, cadence, and recovery path.")}`);
  } else {
    additions.push(`riseDecayScore: ${score}`);
    additions.push(`riseDecayTarget: ${quote("Observable movement from decay pattern to governed canonical standard.")}`);
  }

  additions.push(`primaryFracture: ${quote(frame.primaryFracture)}`);
  additions.push(`failureMode: ${quote(frame.failureMode)}`);
  additions.push(yamlList("prerequisites", isFrontier ? [
    "Read the relevant Canon dependency before applying the pressure frame.",
    "Do not run a private instrument without live evidence and accountable authority.",
  ] : [
    "Read Brief #01 before applying Canon sequence material.",
    "Treat the public brief as doctrine, not as the full private instrument.",
  ]));
  additions.push(`nextBrief: ${quote(next)}`);
  additions.push(yamlList("relatedBriefs", related));
  additions.push(`relatedTool: ${quote(tool)}`);
  additions.push(`implementationHorizon: ${quote(frame.horizon)}`);
  additions.push(yamlList("kpis", frame.indicators));
  additions.push(`innerCircleCompanion: ${quote(`${tool} - gated companion`)}`);

  const newFrontmatter = `${removeKeyBlocks(raw)}\n${additions.join("\n")}`.trimEnd();
  const publicModule = buildPublicModule({ frame, related, tool, isFrontier });
  const strippedBody = normalizeEscapedNewlines(stripOldApplicationFrame(body));
  const newBody = insertPublicModule(strippedBody, publicModule);

  write(file, `---\n${newFrontmatter}\n---\n\n${newBody.trimStart()}`);
}

console.log(`Instrumented ${files.length} VaultBrief files (${canonFiles.length} Canon, ${frontierFiles.length} Frontier Resilience).`);
