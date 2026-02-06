import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { getPDFRegistrySource } from "./pdf-registry.source";

/**
 * CONFIGURATION
 * Threshold: 20KB. Anything smaller is a failed render or a placeholder.
 */
const PLACEHOLDER_THRESHOLD = 20 * 1024; 
const BASE_URL = "http://localhost:3000/render/pdf"; 

console.log('🚀 PDF Assets Generator - High Fidelity Production');

/**
 * PRODUCTION GENERATOR ENGINE
 */
async function runGenerationEngine(browser: puppeteer.Browser, pdfId: string, fullPath: string) {
    console.log(`🛠️  GENERATING HIGH-FIDELITY ASSET: ${pdfId}...`);
    
    const page = await browser.newPage();
    const url = `${BASE_URL}/${pdfId}`;

    try {
        // 1. Set High-Density Viewport for crisp typography
        await page.setViewport({ 
            width: 1240, 
            height: 1754, 
            deviceScaleFactor: 2 
        });

        // 2. Navigate with Extended Timeout
        // 'networkidle0' ensures all fonts and CSS are fully loaded
        await page.goto(url, { 
            waitUntil: 'networkidle0', 
            timeout: 60000 
        });

        // 3. Strategic Sync: Wait for the CSS-injected container
        // This prevents the "0.9KB" empty file issue
        await page.waitForSelector('.pdf-canvas', { timeout: 10000 });

        // 4. Print to PDF
        await page.pdf({
            path: fullPath,
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: false,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
            preferCSSPageSize: true
        });

        const finalStats = fs.statSync(fullPath);

        // 5. Post-Generation Integrity Check
        if (finalStats.size < 5000) {
            throw new Error(`Integrity Failure: Asset ${pdfId} is too small (${finalStats.size} bytes).`);
        }

        console.log(`✅ SUCCESS: ${pdfId} (${(finalStats.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
        console.error(`❌ FAILED ${pdfId}:`, error instanceof Error ? error.message : error);
        
        // Cleanup: Don't leave corrupted 0KB files in the repository
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
        throw error; // Re-throw to count the error in the summary
    } finally {
        await page.close();
    }
}

async function buildPDFAssets() {
    console.log('📊 PDF Assets Build Process');
    console.log('='.repeat(60));
    
    const root = process.cwd();
    const allPDFs = getPDFRegistrySource();
    let purged = 0;
    let created = 0;
    let errors = 0;

    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'] 
    });

    try {
        for (const pdf of allPDFs) {
            const relativePath = pdf.outputPath.startsWith('/') ? pdf.outputPath.slice(1) : pdf.outputPath;
            const fullPath = path.join(root, 'public', relativePath);
            const dir = path.dirname(fullPath);

            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            let shouldGenerate = false;

            if (!fs.existsSync(fullPath)) {
                console.log(`❌ MISSING: ${pdf.id}`);
                shouldGenerate = true;
                created++;
            } else {
                const stats = fs.statSync(fullPath);
                if (stats.size < PLACEHOLDER_THRESHOLD) {
                    console.log(`⚠️  RECALIBRATING (${stats.size} bytes): ${pdf.id}`);
                    shouldGenerate = true;
                    purged++;
                }
            }

            if (shouldGenerate) {
                try {
                    await runGenerationEngine(browser, pdf.id, fullPath);
                } catch (e) {
                    errors++;
                }
            }
        }
    } finally {
        await browser.close();
    }

    const healthyCount = allPDFs.filter(p => {
        const pPath = path.join(root, 'public', p.outputPath.startsWith('/') ? p.outputPath.slice(1) : p.outputPath);
        return fs.existsSync(pPath) && fs.statSync(pPath).size >= PLACEHOLDER_THRESHOLD;
    }).length;

    console.log('\n' + '='.repeat(60));
    console.log('📈 GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Recalibrated/Purged: ${purged}`);
    console.log(`🆕 New Assets Created:  ${created}`);
    console.log(`❌ Current Errors:      ${errors}`);
    console.log(`🎯 Validated Assets:    ${healthyCount} / ${allPDFs.length}`);
    
    return { success: errors === 0 && healthyCount === allPDFs.length };
}

buildPDFAssets().then(result => {
    if (result.success) {
        console.log('🎉 BUILD COMPLETE: Institutional Portfolio Secure.');
        process.exit(0);
    } else {
        console.log('⚠️ BUILD COMPLETED WITH ERRORS: Check server logs.');
        process.exit(1);
    }
}).catch(err => {
    console.error("💥 Fatal Engine Failure:", err);
    process.exit(1);
});