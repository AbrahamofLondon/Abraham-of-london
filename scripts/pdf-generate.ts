/* scripts/pdf-generate.ts */
import fs from 'fs';
import path from 'path';
import { mdToPdf } from 'md-to-pdf';
import chalk from 'chalk';
import matter from 'gray-matter';

const SOURCE_DIR = path.join(process.cwd(), 'content/downloads');
const TARGET_DIR = path.join(process.cwd(), 'public/assets/downloads');

// Mapping MDX source to the expected PDF filename from your audit warnings
const CONVERSION_MAP = {
    'board-investor-onepager.mdx': 'board-investor-onepager.pdf',
    'decision-log-template.mdx': 'decision-log-template.pdf',
    'decision-matrix-scorecard.mdx': 'decision-matrix-scorecard-fillable.pdf',
    'leadership-playbook.mdx': 'leadership-playbook.pdf',
    'mentorship-starter-kit.mdx': 'mentorship-starter-kit.pdf',
    'principles-for-my-son.mdx': 'principles-for-my-son.pdf',
    'purpose-pyramid-worksheet.mdx': 'purpose-pyramid-worksheet-fillable.pdf',
    'scripture-track-john14.mdx': 'scripture-track-john14.pdf',
    'standards-brief.mdx': 'standards-brief.pdf',
    'ultimate-purpose-of-man-editorial.mdx': 'ultimate-purpose-of-man-editorial.pdf',
    'download-legacy-architecture-canvas.mdx': 'content-downloads/download-legacy-architecture-canvas.fillable.pdf'
};

async function generatePdfs() {
    console.log(chalk.blue.bold("🏗️  GENERATING INSTITUTIONAL PDF ASSETS..."));
    
    for (const [srcFile, targetFile] of Object.entries(CONVERSION_MAP)) {
        const srcPath = path.join(SOURCE_DIR, srcFile);
        const destPath = path.join(TARGET_DIR, targetFile);

        if (fs.existsSync(srcPath)) {
            try {
                // Ensure subdirectories (like content-downloads/) exist
                fs.mkdirSync(path.dirname(destPath), { recursive: true });

                const fileContent = fs.readFileSync(srcPath, 'utf8');
                const { content } = matter(fileContent);

                // Convert MDX to Professional PDF
                const pdf = await mdToPdf({ content }, { 
                    launch_options: { args: ['--no-sandbox'] },
                    pdf_options: { format: 'A4', margin: '20mm' } 
                });

                if (pdf) {
                    fs.writeFileSync(destPath, pdf.content);
                    console.log(chalk.green(`  ✅ Generated: ${targetFile}`));
                }
            } catch (err) {
                console.error(chalk.red(`  ❌ Failed to generate ${targetFile}:`), err);
            }
        } else {
            console.log(chalk.yellow(`  ⚠️  Source MDX missing for: ${srcFile}`));
        }
    }
    console.log(chalk.blue.bold("============================================================"));
}

generatePdfs();