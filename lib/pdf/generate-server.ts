'use server';

import fs from 'fs';
import path from 'path';
import { 
  generatePDFBatch, 
  DEFAULT_CONFIG, 
  PDFGenerationConfig,
  CommandRunner
} from './generate';

/**
 * TRIGGER: PDF GENERATION BATCH
 * This is the primary Server Action called by client-side buttons.
 * It leverages the unified engine in generate.ts to maintain a 
 * single source of truth for logic and optimization.
 */
export async function generatePDFsAction(config: PDFGenerationConfig = DEFAULT_CONFIG) {
  const loggerPrefix = '[SERVER-ACTION]';
  
  try {
    console.log(`${loggerPrefix} Initializing PDF generation request...`);
    
    // 1. Validate environment before execution
    const runner = new CommandRunner(config);
    await runner.checkDependencies();

    // 2. Execute the batch generation logic
    const result = await generatePDFBatch(config);

    // 3. Log results to server console for monitoring
    if (result.success) {
      console.log(`${loggerPrefix} Success: ${result.summary.successful} PDFs generated.`);
    } else {
      console.error(`${loggerPrefix} Partial Failure: ${result.summary.failed} assets failed.`);
    }

    // 4. Return serialized data to the Client Component
    return {
      success: result.success,
      summary: result.summary,
      details: result.results.map(r => ({
        name: r.name,
        success: r.success,
        duration: r.duration,
        error: r.error
      })),
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error(`${loggerPrefix} Critical Execution Error:`, error.message);
    
    return {
      success: false,
      error: error.message,
      summary: { total: 0, successful: 0, failed: 0, totalDuration: 0 },
      details: []
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
  
  if (!fs.existsSync(outputDir)) {
    return { exists: false, files: [] };
  }

  const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.pdf'))
    .map(f => {
      const stats = fs.statSync(path.join(outputDir, f));
      return {
        name: f,
        size: (stats.size / 1024).toFixed(1) + ' KB',
        modified: stats.mtime
      };
    });

  return {
    exists: files.length > 0,
    files
  };
}

/**
 * API COMPATIBILITY WRAPPER
 * Maintained for legacy API routes or external webhooks.
 */
export async function generatePDFsForAPI(config: PDFGenerationConfig = DEFAULT_CONFIG) {
  return await generatePDFsAction(config);
}