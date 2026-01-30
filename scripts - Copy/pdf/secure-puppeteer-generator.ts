// scripts/pdf/secure-puppeteer-generator.ts - UPDATED WITH BETTER ERROR HANDLING
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface PuppeteerPDFOptions {
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

export interface GenerationResult {
  success: boolean;
  filePath: string;
  size: number;
  duration: number;
  hash?: string;
}

export interface HealthCheckResult {
  browserStatus: 'connected' | 'disconnected' | 'unknown';
  puppeteerVersion: string;
  chromeVersion?: string;
  isHealthy: boolean;
}

export class SecurePuppeteerPDFGenerator {
  private browser: puppeteer.Browser | null = null;
  private timeout: number;
  private maxRetries: number;
  private userAgent: string;
  private isInitializing: boolean = false;
  private launchAttempts: number = 0;
  private maxLaunchAttempts: number = 3;

  constructor(options: {
    timeout?: number;
    maxRetries?: number;
    userAgent?: string;
  } = {}) {
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.initialize();
    }

    this.isInitializing = true;
    this.launchAttempts++;

    try {
      // Try different launch strategies for Windows
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
          '--single-process',
          '--no-zygote',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
        timeout: this.timeout,
        protocolTimeout: this.timeout * 2,
      };

      // Try with executable path if default fails
      if (this.launchAttempts > 1) {
        try {
          // Try to find Chrome/Chromium
          const possiblePaths = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
            process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
            process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
          ].filter(Boolean) as string[];

          for (const exePath of possiblePaths) {
            if (fs.existsSync(exePath)) {
              launchOptions.executablePath = exePath;
              console.log(`\x1b[36m🔧 Using Chrome at: ${exePath}\x1b[0m`);
              break;
            }
          }
        } catch (error) {
          // Ignore path errors
        }
      }

      // Additional args for Windows stability
      if (process.platform === 'win32') {
        launchOptions.args.push(
          '--disable-component-update',
          '--disable-blink-features=AutomationControlled'
        );
      }

      this.browser = await puppeteer.launch(launchOptions);
      
      // Set up browser error handling
      this.browser.on('disconnected', () => {
        console.warn('\x1b[33m⚠️ Puppeteer browser disconnected\x1b[0m');
        this.browser = null;
        this.launchAttempts = 0;
      });

      console.log(`\x1b[32m✅ Puppeteer initialized successfully (attempt ${this.launchAttempts})\x1b[0m`);
      this.launchAttempts = 0; // Reset on success

    } catch (error: any) {
      console.error(`\x1b[31m❌ Failed to initialize Puppeteer (attempt ${this.launchAttempts}):\x1b[0m`, error.message);
      
      if (this.launchAttempts < this.maxLaunchAttempts) {
        console.log(`\x1b[33m🔄 Retrying Puppeteer initialization in 2 seconds...\x1b[0m`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.isInitializing = false;
        return this.initialize();
      } else {
        throw new Error(`Failed to initialize Puppeteer after ${this.maxLaunchAttempts} attempts: ${error.message}`);
      }
    } finally {
      this.isInitializing = false;
    }
  }

  async generateSecurePDF(
    htmlContent: string,
    outputPath: string,
    options: PuppeteerPDFOptions = {},
    retryCount: number = 0
  ): Promise<GenerationResult> {
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

      // Remove existing file if it exists and we're retrying
      if (retryCount > 0 && fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      page = await this.browser.newPage();
      
      // Set secure headers and user agent
      await page.setUserAgent(this.userAgent);
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      });

      // Set page error handling
      page.on('error', (error) => {
        console.warn(`\x1b[33m⚠️ Page error: ${error.message}\x1b[0m`);
      });

      page.on('pageerror', (error) => {
        console.warn(`\x1b[33m⚠️ Page JS error: ${error.message}\x1b[0m`);
      });

      // Set content with enhanced HTML structure
      const enhancedHTML = this.enhanceHTML(htmlContent, options);
      
      await page.setContent(enhancedHTML, {
        waitUntil: options.waitForNetworkIdle ? 'networkidle0' : 'domcontentloaded',
        timeout: options.timeout || this.timeout,
      });

      // Wait for any dynamic content
      if (options.waitForNetworkIdle) {
        try {
          await page.waitForNetworkIdle({ timeout: 5000 });
        } catch {
          console.warn('\x1b[33m⚠️ Network idle timeout, continuing...\x1b[0m');
        }
      }

      // Ensure fonts are loaded
      try {
        await page.evaluate(() => document.fonts.ready);
      } catch {
        // Font loading failed, continue anyway
      }

      // Generate PDF with options
      const pdfOptions: puppeteer.PDFOptions = {
        path: outputPath,
        format: options.format || 'A4',
        margin: options.margin || { 
          top: '40px', 
          right: '30px', 
          bottom: '40px', 
          left: '30px' 
        },
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
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for file write
      
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

      if (retryCount > 0) {
        console.log(`\x1b[32m✅ PDF generated successfully after ${retryCount} retry(s)\x1b[0m`);
      }

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

      // Clean up page if it exists
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore page close errors during retry
        }
      }

      // Retry logic
      if (retryCount < this.maxRetries) {
        const delay = 1000 * (retryCount + 1);
        console.warn(`\x1b[33m⚠️ Retrying PDF generation in ${delay}ms (${retryCount + 1}/${this.maxRetries}): ${error.message}\x1b[0m`);
        
        // Reset browser if it's in a bad state
        if (error.message.includes('Protocol error') || error.message.includes('Session closed')) {
          console.warn('\x1b[33m⚠️ Browser in bad state, closing and retrying...\x1b[0m');
          await this.close();
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.generateSecurePDF(htmlContent, outputPath, options, retryCount + 1);
      }

      throw new Error(`Failed to generate PDF after ${this.maxRetries} attempts: ${error.message}`);

    } finally {
      if (page) {
        try {
          await page.close();
        } catch (error) {
          console.warn('\x1b[33m⚠️ Failed to close page:\x1b[0m', error.message);
        }
      }
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
  try {
    // Try to initialize but don't throw if it fails
    try {
      await this.initialize();
    } catch {
      // Initialization failed, continue with health check
    }
    
    if (!this.browser) {
      return {
        browserStatus: 'disconnected',
        puppeteerVersion: 'unknown',
        isHealthy: false,
      };
    }

    // Try to create a page to verify browser is working
    const page = await this.browser.newPage();
    await page.goto('about:blank', { waitUntil: 'domcontentloaded', timeout: 5000 });
    const version = await this.browser.version();
    await page.close();

    return {
      browserStatus: 'connected',
      puppeteerVersion: 'unknown', // We'll get this differently
      chromeVersion: version,
      isHealthy: true,
    };

  } catch (error: any) {
    console.warn(`\x1b[33m⚠️ Health check failed: ${error.message}\x1b[0m`);
    return {
      browserStatus: 'unknown',
      puppeteerVersion: 'unknown',
      isHealthy: false,
    };
  }
}

  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error: any) {
        console.warn(`\x1b[33m⚠️ Failed to close browser gracefully: ${error.message}\x1b[0m`);
      } finally {
        this.browser = null;
        this.launchAttempts = 0;
      }
    }
  }

  private enhanceHTML(htmlContent: string, options: PuppeteerPDFOptions): string {
    const format = options.format || 'A4';
    const margin = options.margin || { top: '40px', right: '30px', bottom: '40px', left: '30px' };
    
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <title>Generated PDF Document</title>
          <style>
            @page {
              size: ${format};
              margin: ${margin.top} ${margin.right} ${margin.bottom} ${margin.left};
            }
            
            /* CSS Reset */
            *, *::before, *::after {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              font-size: 12pt;
            }
            
            /* Typography */
            h1, h2, h3, h4, h5, h6 {
              color: #1a1a1a;
              font-weight: 600;
              line-height: 1.2;
              margin-bottom: 0.5em;
            }
            
            h1 { font-size: 24pt; margin-top: 0; }
            h2 { font-size: 20pt; margin-top: 1.5em; }
            h3 { font-size: 16pt; margin-top: 1.2em; }
            h4 { font-size: 14pt; }
            h5 { font-size: 12pt; }
            h6 { font-size: 11pt; }
            
            p {
              margin-bottom: 1em;
              text-align: justify;
            }
            
            /* Lists */
            ul, ol {
              margin-left: 2em;
              margin-bottom: 1em;
            }
            
            li {
              margin-bottom: 0.5em;
            }
            
            /* Code */
            code {
              font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
              font-size: 11pt;
              background-color: #f5f5f5;
              padding: 2px 6px;
              border-radius: 3px;
            }
            
            pre {
              font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
              font-size: 11pt;
              background-color: #f5f5f5;
              padding: 1em;
              border-radius: 5px;
              overflow-x: auto;
              margin: 1em 0;
            }
            
            pre code {
              background-color: transparent;
              padding: 0;
            }
            
            /* Blockquotes */
            blockquote {
              border-left: 4px solid #0070f3;
              padding-left: 1em;
              margin: 1.5em 0;
              color: #666;
              font-style: italic;
            }
            
            /* Tables */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1.5em 0;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              vertical-align: top;
            }
            
            th {
              background-color: #f8f9fa;
              font-weight: 600;
            }
            
            /* Images */
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 1em auto;
            }
            
            /* Print specific styles */
            @media print {
              body {
                font-size: 11pt;
              }
              
              a {
                color: #333;
              }
            }
            
            /* Document container */
            .document-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            ${htmlContent}
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const pdfGenerator = new SecurePuppeteerPDFGenerator();

// Example usage
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  async function example() {
    const generator = new SecurePuppeteerPDFGenerator();
    
    try {
      // Check health
      const health = await generator.healthCheck();
      console.log('🏥 Health check:', health);
      
      if (health.isHealthy) {
        // Generate a test PDF
        const result = await generator.generateSecurePDF(
          `
            <h1>Test Document</h1>
            <p>This is a test PDF generated with enhanced security and formatting.</p>
          `,
          './test-output.pdf',
          {
            format: 'A4',
            printBackground: true,
            margin: { top: '40px', right: '30px', bottom: '40px', left: '30px' },
          }
        );
        
        console.log('\n\x1b[32m✅ PDF generated successfully!\x1b[0m');
        console.log(`📄 File: ${result.filePath}`);
        console.log(`💾 Size: ${(result.size / 1024).toFixed(1)} KB`);
        console.log(`⏱️  Duration: ${result.duration}ms`);
      } else {
        console.log('\x1b[31m❌ Puppeteer is not healthy\x1b[0m');
      }
      
    } catch (error: any) {
      console.error('\x1b[31m❌ Error:\x1b[0m', error.message);
    } finally {
      await generator.close();
    }
  }
  
  example().catch(console.error);
}