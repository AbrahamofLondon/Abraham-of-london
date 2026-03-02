'use server';

import fs from 'fs';
import path from 'path';
import {
  generatePDFBatch,
  DEFAULT_CONFIG,
  type PDFGenerationConfig,
  CommandRunner,
} from './generate';

/**
 * TRIGGER: PDF GENERATION BATCH
 * Primary Server Action called by client-side buttons.
 * Uses unified engine in generate.ts as SSOT.
 */
export async function generatePDFsAction(config: PDFGenerationConfig = DEFAULT_CONFIG) {
  const loggerPrefix = '[SERVER-ACTION]';

  try {
    console.log(`${loggerPrefix} Initializing PDF generation request...`);

    // 1) Validate environment before execution
    const runner = new CommandRunner(config);
    await runner.checkDependencies();

    // 2) Execute the batch generation logic
    const result = await generatePDFBatch(config);

    // 3) Log results to server console for monitoring
    if (result.success) {
      console.log(`${loggerPrefix} Success: ${result.summary.successful} PDFs generated.`);
    } else {
      console.error(`${loggerPrefix} Partial Failure: ${result.summary.failed} assets failed.`);
    }

    // 4) Return serialized data to the Client Component (stable contract)
    const details = (result.results || []).map((r: any) => {
      // SSOT field is durationMs, but tolerate legacy "duration" just in case.
      const durationMs =
        typeof r?.durationMs === 'number'
          ? r.durationMs
          : typeof r?.duration === 'number'
            ? r.duration
            : 0;

      return {
        name: String(r?.name ?? ''),
        success: Boolean(r?.success),
        durationMs,
        error: r?.error ? String(r.error) : null,
      };
    });

    return {
      success: Boolean(result.success),
      summary: result.summary,
      details,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    const msg = error?.message ? String(error.message) : String(error);
    console.error(`${loggerPrefix} Critical Execution Error:`, msg);

    return {
      success: false,
      error: msg,
      summary: { total: 0, successful: 0, failed: 0, totalDuration: 0 },
      details: [],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * HELPER: VERIFY ASSET STATUS
 * Quick server-side check to see if downloads are available
 * without re-running the full generation engine.
 */
export async function getAssetStatus() {
  const outputDir = DEFAULT_CONFIG.outputDir!;

  if (!outputDir || !fs.existsSync(outputDir)) {
    return { exists: false, files: [] as Array<{ name: string; size: string; modified: Date }> };
  }

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .map((f) => {
      const stats = fs.statSync(path.join(outputDir, f));
      return {
        name: f,
        size: `${(stats.size / 1024).toFixed(1)} KB`,
        modified: stats.mtime,
      };
    });

  return {
    exists: files.length > 0,
    files,
  };
}

/**
 * API COMPATIBILITY WRAPPER
 * Maintained for legacy API routes or external webhooks.
 */
export async function generatePDFsForAPI(config: PDFGenerationConfig = DEFAULT_CONFIG) {
  return generatePDFsAction(config);
}