#!/usr/bin/env node

/**
 * Wave 2B: Live Capture for executive_reporting V2 Validation
 *
 * Purpose: Execute frozen scenarios against live product and capture rendered output
 * Status: Preparation mode - ready for live execution
 *
 * Requirements:
 * - pnpm dev running (localhost:3000)
 * - Frozen scenarios in reports/validation/executive-reporting/scenarios.json
 *
 * Usage:
 *   node scripts/capture-executive-reporting-output.mjs --scenarios reports/validation/executive-reporting/scenarios.json
 *   node scripts/capture-executive-reporting-output.mjs --scenarios reports/validation/executive-reporting/scenarios.json --output rendered-output.json
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const APP_HOST = process.env.APP_HOST || 'localhost:3000';
const APP_URL_BASE = `http://${APP_HOST}`;
const API_ENDPOINT = `${APP_URL_BASE}/api/diagnostics/executive-reporting`;
const ROUTE_ENDPOINT = `${APP_URL_BASE}/diagnostics/executive-reporting/run`;

// Parse arguments
const args = process.argv.slice(2);
let scenariosPath = 'reports/validation/executive-reporting/scenarios.json';
let outputPath = 'reports/validation/executive-reporting/rendered-output.json';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--scenarios' && i + 1 < args.length) {
    scenariosPath = args[i + 1];
  }
  if (args[i] === '--output' && i + 1 < args.length) {
    outputPath = args[i + 1];
  }
}

const scenariosFullPath = path.resolve(projectRoot, scenariosPath);
const outputFullPath = path.resolve(projectRoot, outputPath);
const outputDir = path.dirname(outputFullPath);

// Helper functions
function log(msg) {
  console.log(`[CAPTURE] ${msg}`);
}

function error(msg) {
  console.error(`[ERROR] ${msg}`);
}

function success(msg) {
  console.log(`[SUCCESS] ${msg}`);
}

function hashContent(content) {
  return createHash('sha256')
    .update(typeof content === 'string' ? content : JSON.stringify(content))
    .digest('hex');
}

async function checkAppRunning() {
  log(`Checking if app is running at ${ROUTE_ENDPOINT}`);
  try {
    const response = await fetch(ROUTE_ENDPOINT, {
      method: 'HEAD',
      redirect: 'follow'
    });
    if (response.ok) {
      success(`App is running`);
      return true;
    }
  } catch (err) {
    // Expected if app not running
  }
  error(`App is not running at ${ROUTE_ENDPOINT}`);
  error(`Start the app with: pnpm dev`);
  return false;
}

async function loadScenarios() {
  log(`Loading scenarios from ${scenariosFullPath}`);
  try {
    const content = fs.readFileSync(scenariosFullPath, 'utf8');
    const data = JSON.parse(content);

    if (!data.scenarios || data.scenarios.length === 0) {
      error('No scenarios found in scenarios.json');
      return null;
    }

    success(`Loaded ${data.scenarios.length} scenarios`);
    return data;
  } catch (err) {
    error(`Failed to load scenarios: ${err.message}`);
    return null;
  }
}

async function captureScenarioOutput(scenario) {
  log(`Capturing output for scenario: ${scenario.scenarioId} - ${scenario.name}`);

  // Build intake form data based on scenario context
  const intake = {
    decisionContext: scenario.decisionContext.decision,
    decision: scenario.decisionContext.decision,
    audience: scenario.audience.join(', '),
    availableEvidence: scenario.availableEvidence,
    missingEvidence: scenario.missingEvidence,
    pressure: scenario.reportingPressure,
    timeframe: scenario.decisionContext.timeframe,
    stakes: scenario.decisionContext.stakes
  };

  try {
    log(`POSTing to ${API_ENDPOINT}`);
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(intake)
    });

    if (!response.ok) {
      error(`API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const renderedOutput = await response.text();

    if (!renderedOutput || renderedOutput.trim().length === 0) {
      error(`Rendered output is empty for scenario ${scenario.scenarioId}`);
      return null;
    }

    // Parse response if JSON, otherwise treat as HTML
    let output;
    try {
      output = JSON.parse(renderedOutput);
    } catch {
      output = { html: renderedOutput };
    }

    // Validate required elements
    const issues = validateScenarioOutput(output, scenario);
    if (issues.length > 0) {
      error(`Validation issues for ${scenario.scenarioId}:`);
      issues.forEach(issue => error(`  - ${issue}`));
      return null;
    }

    success(`Captured output for ${scenario.scenarioId}`);
    return {
      scenarioId: scenario.scenarioId,
      scenarioName: scenario.name,
      capturedAt: new Date().toISOString(),
      output: output,
      outputHash: hashContent(output)
    };
  } catch (err) {
    error(`Failed to capture scenario ${scenario.scenarioId}: ${err.message}`);
    return null;
  }
}

function validateScenarioOutput(output, scenario) {
  const issues = [];
  const outputStr = JSON.stringify(output).toLowerCase();

  // Check for required elements
  const requiredPatterns = [
    { pattern: 'authority', reason: 'Authority state block missing' },
    { pattern: 'evidence', reason: 'Evidence section missing' },
    { pattern: 'limitation', reason: 'Limitations section missing' },
    { pattern: 'next', reason: 'Next evidence action missing' }
  ];

  requiredPatterns.forEach(({ pattern, reason }) => {
    if (!outputStr.includes(pattern)) {
      issues.push(reason);
    }
  });

  // Check output is not empty placeholder
  if (outputStr.includes('placeholder') || outputStr.includes('mock') || outputStr.includes('todo')) {
    issues.push('Output appears to be placeholder/mock (contains placeholder, mock, or todo keywords)');
  }

  // Check for manual-write indicators
  if (outputStr.includes('manually written') || outputStr.includes('not generated')) {
    issues.push('Output appears to be manually written');
  }

  return issues;
}

async function main() {
  log('='.repeat(60));
  log('Wave 2B: executive_reporting Live Capture');
  log('='.repeat(60));

  // Check app is running
  if (!await checkAppRunning()) {
    process.exit(1);
  }

  // Load scenarios
  const scenariosData = await loadScenarios();
  if (!scenariosData) {
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    log(`Creating output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Capture each scenario
  const results = [];
  for (const scenario of scenariosData.scenarios) {
    const result = await captureScenarioOutput(scenario);
    if (result) {
      results.push(result);
    } else {
      error(`FATAL: Failed to capture scenario ${scenario.scenarioId}`);
      process.exit(1);
    }
  }

  // Generate hashes
  log('Generating hashes...');
  const scenarioSetHash = hashContent(scenariosData);
  const renderedOutputHash = hashContent(results);
  const validationRunHash = hashContent({
    timestamp: new Date().toISOString(),
    scenarioSetHash,
    renderedOutputHash
  });

  success(`Generated hashes:`);
  log(`  scenarioSetHash: ${scenarioSetHash}`);
  log(`  renderedOutputHash: ${renderedOutputHash}`);
  log(`  validationRunHash: ${validationRunHash}`);

  // Write results
  const outputData = {
    validationProduct: 'executive_reporting',
    capturedAt: new Date().toISOString(),
    appHost: APP_HOST,
    scenarioCount: results.length,
    scenarioResults: results,
    hashes: {
      scenarioSetHash,
      renderedOutputHash,
      validationRunHash
    },
    validationNotes: [
      'All scenarios captured from live product execution',
      'No placeholder outputs used',
      'No manual outputs used',
      'Hashes generated from actual rendered output',
      'Ready for Evidence Ledger v2 generation'
    ]
  };

  log(`Writing output to ${outputFullPath}`);
  fs.writeFileSync(outputFullPath, JSON.stringify(outputData, null, 2));
  success(`Rendered output saved`);

  // Write human-readable summary
  const summaryPath = path.resolve(outputDir, 'rendered-output.md');
  let summary = `# Executive Reporting V2 Validation - Live Capture Results\n\n`;
  summary += `**Captured:** ${new Date().toISOString()}\n`;
  summary += `**Product:** executive_reporting\n`;
  summary += `**Scenarios Captured:** ${results.length}\n\n`;

  results.forEach(result => {
    summary += `## ${result.scenarioId}\n`;
    summary += `**Name:** ${result.scenarioName}\n`;
    summary += `**Captured:** ${result.capturedAt}\n`;
    summary += `**Output Hash:** ${result.outputHash}\n\n`;
  });

  summary += `## Hashes\n\n`;
  summary += `- **scenarioSetHash:** ${scenarioSetHash}\n`;
  summary += `- **renderedOutputHash:** ${renderedOutputHash}\n`;
  summary += `- **validationRunHash:** ${validationRunHash}\n\n`;

  summary += `## Next Steps\n\n`;
  summary += `1. Run Evidence Ledger v2 generator:\n`;
  summary += `   \`\`\`bash\n`;
  summary += `   node scripts/generate-v2-evidence-ledger.mjs --product executive_reporting\n`;
  summary += `   \`\`\`\n\n`;
  summary += `2. Run quality tests:\n`;
  summary += `   \`\`\`bash\n`;
  summary += `   pnpm test --testPathPattern="executive-reporting-v2"\n`;
  summary += `   \`\`\`\n\n`;
  summary += `3. Run validation:\n`;
  summary += `   \`\`\`bash\n`;
  summary += `   node scripts/validate-executive-reporting-v2.mjs --full\n`;
  summary += `   \`\`\`\n`;

  fs.writeFileSync(summaryPath, summary);
  success(`Summary written to ${summaryPath}`);

  log('='.repeat(60));
  success('Capture complete');
  log(`Output saved to ${outputFullPath}`);
  log('='.repeat(60));
}

main().catch(err => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
