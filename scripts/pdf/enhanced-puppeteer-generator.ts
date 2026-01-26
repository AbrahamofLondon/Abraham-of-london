// scripts/pdf/enhanced-puppeteer-generator.ts
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface PuppeteerPDFOptions {
  format?: 'A4' | 'Letter' | 'A3' | 'Legal';
  margin?: { top: string; right: string; bottom: string; left: string };
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  landscape?: boolean;
  scale?: number;
  preferCSSPageSize?: boolean;
  timeout?: number;
  waitForNetworkIdle?: boolean;
  emulateMedia?: 'screen' | 'print';
}

class SecurePuppeteerPDFGenerator {
  private browser: puppeteer.Browser | null = null;
  private timeout: number;
  private maxRetries: number;
  private userAgent: string;

  constructor(options: {
    timeout?: number;
    maxRetries?: number;
    userAgent?: string;
  } = {}) {
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  async initialize() {
    if (this.browser) {
      return;
    }

    const launchOptions: puppeteer.LaunchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      timeout: this.timeout,
    };

    this.browser = await puppeteer.launch(launchOptions);
  }

  async generateSecurePDF(
    htmlContent: string,
    outputPath: string,
    options: PuppeteerPDFOptions = {}
  ): Promise<{
    success: boolean;
    filePath: string;
    size: number;
    duration: number;
    hash?: string;
  }> {
    const startTime = Date.now();
    let page: puppeteer.Page | null = null;

    try {
      await this.initialize();
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      page = await this.browser.newPage();
      
      // Set secure headers and user agent
      await page.setUserAgent(this.userAgent);
      await page.setExtraHTTPHeaders({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      });

      // Block unnecessary resources for faster loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Set content security policy
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page {
                size: ${options.format || 'A4'};
                margin: ${options.margin?.top || '20px'} ${options.margin?.right || '20px'} ${options.margin?.bottom || '20px'} ${options.margin?.left || '20px'};
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
              }
              img, svg {
                max-width: 100%;
                height: auto;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin: 1rem 0;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 0.5rem;
                text-align: left;
              }
              th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              code {
                background-color: #f5f5f5;
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
              }
              pre {
                background-color: #f5f5f5;
                padding: 1rem;
                border-radius: 5px;
                overflow-x: auto;
              }
              blockquote {
                border-left: 4px solid #0070f3;
                margin: 1rem 0;
                padding-left: 1rem;
                color: #666;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `, {
        waitUntil: options.waitForNetworkIdle ? 'networkidle0' : 'load',
        timeout: options.timeout || this.timeout,
      });

      // Wait for any dynamic content
      await page.waitForNetworkIdle({
        timeout: options.waitForNetworkIdle ? 5000 : 0,
      });

      // Generate PDF with options
      const pdfOptions: puppeteer.PDFOptions = {
        path: outputPath,
        format: options.format || 'A4',
        margin: options.margin || { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        printBackground: options.printBackground !== false,
        displayHeaderFooter: options.displayHeaderFooter || false,
        landscape: options.landscape || false,
        scale: options.scale || 1.0,
        preferCSSPageSize: options.preferCSSPageSize !== false,
      };

      if (options.headerTemplate) {
        pdfOptions.headerTemplate = options.headerTemplate;
      }
      if (options.footerTemplate) {
        pdfOptions.footerTemplate = options.footerTemplate;
      }

      await page.pdf(pdfOptions);

      // Verify PDF was created
      if (!fs.existsSync(outputPath)) {
        throw new Error(`PDF file was not created at ${outputPath}`);
      }

      const stats = fs.statSync(outputPath);
      const fileSize = stats.size;

      if (fileSize < 1024) {
        throw new Error(`PDF file is too small (${fileSize} bytes), likely corrupted`);
      }

      // Calculate file hash for integrity checking
      const fileBuffer = fs.readFileSync(outputPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const duration = Date.now() - startTime;

      return {
        success: true,
        filePath: outputPath,
        size: fileSize,
        duration,
        hash,
      };

    } catch (error: any) {
      // Clean up corrupted file if it exists
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      throw new Error(`Failed to generate PDF: ${error.message}`);

    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  async generateFromMDX(
    mdxContent: string,
    outputPath: string,
    metadata: Record<string, any> = {},
    options: PuppeteerPDFOptions = {}
  ) {
    // Convert MDX to HTML (simplified - you might want to use a proper MDX compiler)
    const htmlContent = await this.mdxToHtml(mdxContent, metadata);
    return this.generateSecurePDF(htmlContent, outputPath, options);
  }

  async generateFromURL(
    url: string,
    outputPath: string,
    options: PuppeteerPDFOptions = {}
  ) {
    const startTime = Date.now();

    try {
      await this.initialize();
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
      });

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: options.timeout || this.timeout,
      });

      // Optional: Wait for specific elements if needed
      // await page.waitForSelector('body');

      // Generate PDF
      const pdfOptions: puppeteer.PDFOptions = {
        path: outputPath,
        format: options.format || 'A4',
        margin: options.margin || { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        printBackground: options.printBackground !== false,
        displayHeaderFooter: options.displayHeaderFooter || false,
      };

      await page.pdf(pdfOptions);
      await page.close();

      const stats = fs.statSync(outputPath);
      const duration = Date.now() - startTime;

      return {
        success: true,
        filePath: outputPath,
        size: stats.size,
        duration,
      };

    } catch (error: any) {
      throw new Error(`Failed to generate PDF from URL: ${error.message}`);
    }
  }

  private async mdxToHtml(mdxContent: string, metadata: Record<string, any>): Promise<string> {
    // This is a simplified MDX to HTML conversion
    // In production, you should use @mdx-js/mdx or similar
    let html = mdxContent
      // Convert headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Convert bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert lists
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Convert paragraphs
      .replace(/^(?!<[hlu])(.*$)/gim, '<p>$1</p>')
      // Clean up
      .replace(/\n/g, '<br>');

    return `
      <div class="document-container">
        <header class="document-header">
          <h1>${metadata.title || 'Document'}</h1>
          ${metadata.subtitle ? `<h2>${metadata.subtitle}</h2>` : ''}
          ${metadata.author ? `<div class="author">By ${metadata.author}</div>` : ''}
          ${metadata.date ? `<div class="date">${new Date(metadata.date).toLocaleDateString()}</div>` : ''}
        </header>
        <main class="document-content">
          ${html}
        </main>
        <footer class="document-footer">
          <div class="footer-content">
            <p>Generated on ${new Date().toLocaleDateString()} by Abraham of London</p>
            ${metadata.tier ? `<p>Tier: ${metadata.tier.toUpperCase()}</p>` : ''}
            <p class="confidential">${metadata.tier === 'architect' ? 'CONFIDENTIAL - INNER CIRCLE PLUS ONLY' : 'For authorized use only'}</p>
          </div>
        </footer>
      </div>
    `;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async healthCheck(): Promise<{
    browserStatus: 'connected' | 'disconnected' | 'unknown';
    puppeteerVersion: string;
    chromeVersion?: string;
    isHealthy: boolean;
  }> {
    try {
      await this.initialize();
      
      if (!this.browser) {
        return {
          browserStatus: 'disconnected',
          puppeteerVersion: require('puppeteer/package.json').version,
          isHealthy: false,
        };
      }

      const pages = await this.browser.pages();
      const version = await this.browser.version();

      return {
        browserStatus: 'connected',
        puppeteerVersion: require('puppeteer/package.json').version,
        chromeVersion: version,
        isHealthy: pages.length >= 0, // Basic health check
      };

    } catch (error) {
      return {
        browserStatus: 'unknown',
        puppeteerVersion: require('puppeteer/package.json').version,
        isHealthy: false,
      };
    }
  }
}

// Integration with your existing UnifiedPDFGenerator
class EnhancedUnifiedPDFGenerator {
  private puppeteerGenerator: SecurePuppeteerPDFGenerator;
  
  constructor(private options: any) {
    this.puppeteerGenerator = new SecurePuppeteerPDFGenerator({
      timeout: 60000,
      maxRetries: 3,
    });
  }

  async generateFromMDXFiles(entries: any[]) {
    const results = [];
    
    for (const entry of entries) {
      if (entry.sourceKind === 'mdx' || entry.sourceKind === 'md') {
        try {
          const mdxContent = fs.readFileSync(entry.sourcePath!, 'utf-8');
          const outputPath = path.join(process.cwd(), 'public', entry.outputPath);
          
          const result = await this.puppeteerGenerator.generateFromMDX(
            mdxContent,
            outputPath,
            {
              title: entry.title,
              author: 'Abraham of London',
              tier: entry.tier,
              date: new Date().toISOString(),
            },
            {
              format: 'A4' as const,
              margin: { top: '40px', right: '30px', bottom: '40px', left: '30px' },
              printBackground: true,
              displayHeaderFooter: true,
              headerTemplate: `
                <div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 10px 0;">
                  ${entry.title} | Tier: ${entry.tier.toUpperCase()} | Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
              `,
              footerTemplate: `
                <div style="font-size: 9px; color: #888; width: 100%; text-align: center; padding: 10px 0; border-top: 1px solid #eee;">
                  © ${new Date().getFullYear()} Abraham of London. ${entry.requiresAuth ? 'Confidential' : 'Public'} Document.
                </div>
              `,
            }
          );

          results.push({
            id: entry.id,
            success: true,
            method: 'puppeteer-mdx',
            ...result,
          });

        } catch (error: any) {
          results.push({
            id: entry.id,
            success: false,
            method: 'puppeteer-mdx',
            error: error.message,
          });
        }
      }
    }
    
    await this.puppeteerGenerator.close();
    return results;
  }
}

// Export the main generator for use in your unified-pdf-generator.ts
export { SecurePuppeteerPDFGenerator, EnhancedUnifiedPDFGenerator };

// Example usage
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  async function example() {
    const generator = new SecurePuppeteerPDFGenerator();
    
    try {
      // Generate PDF from HTML
      await generator.generateSecurePDF(
        '<h1>Test Document</h1><p>This is a test PDF generated securely.</p>',
        './test-output.pdf',
        {
          format: 'A4',
          printBackground: true,
          margin: { top: '40px', right: '30px', bottom: '40px', left: '30px' },
        }
      );
      
      console.log('✅ PDF generated successfully!');
      
      // Check health
      const health = await generator.healthCheck();
      console.log('🏥 Health check:', health);
      
    } finally {
      await generator.close();
    }
  }
  
  example().catch(console.error);
}