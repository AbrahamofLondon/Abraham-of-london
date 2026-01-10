// lib/pdf/config.ts
export interface PDFGenerationConfig {
  apiKey: string;
  outputDir: string;
  tempDir: string;
  defaultOptions: {
    format: 'A4' | 'Letter' | 'Legal';
    margin: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
    printBackground: boolean;
    scale: number;
  };
  retention: {
    tempFiles: number; // hours
    generatedFiles: number; // days
  };
}

class PDFConfiguration {
  private static instance: PDFConfiguration;
  private config: PDFGenerationConfig;
  
  private constructor() {
    this.config = this.loadConfig();
  }
  
  static getInstance(): PDFConfiguration {
    if (!PDFConfiguration.instance) {
      PDFConfiguration.instance = new PDFConfiguration();
    }
    return PDFConfiguration.instance;
  }
  
  private loadConfig(): PDFGenerationConfig {
    return {
      apiKey: process.env.PDF_GENERATION_API_KEY || 'default-key-change-in-production',
      outputDir: process.env.PDF_OUTPUT_DIR || './public/assets/downloads',
      tempDir: process.env.PDF_TEMP_DIR || './tmp/pdf',
      defaultOptions: {
        format: (process.env.PDF_DEFAULT_FORMAT as 'A4') || 'A4',
        margin: {
          top: process.env.PDF_MARGIN_TOP || '1cm',
          right: process.env.PDF_MARGIN_RIGHT || '1cm',
          bottom: process.env.PDF_MARGIN_BOTTOM || '1cm',
          left: process.env.PDF_MARGIN_LEFT || '1cm',
        },
        printBackground: process.env.PDF_PRINT_BACKGROUND === 'true',
        scale: parseFloat(process.env.PDF_SCALE || '1.0'),
      },
      retention: {
        tempFiles: parseInt(process.env.PDF_TEMP_RETENTION_HOURS || '24'),
        generatedFiles: parseInt(process.env.PDF_GENERATED_RETENTION_DAYS || '30'),
      },
    };
  }
  
  getConfig(): PDFGenerationConfig {
    return this.config;
  }
  
  validate(): boolean {
    const errors: string[] = [];
    
    if (!this.config.apiKey || this.config.apiKey === 'default-key-change-in-production') {
      errors.push('PDF generation API key is not properly configured');
    }
    
    // Check if directories exist or can be created
    const dirs = [this.config.outputDir, this.config.tempDir];
    dirs.forEach(dir => {
      try {
        require('fs').mkdirSync(dir, { recursive: true });
      } catch (error) {
        errors.push(`Cannot access/create directory: ${dir}`);
      }
    });
    
    if (errors.length > 0) {
      console.error('❌ PDF configuration errors:', errors);
      return false;
    }
    
    return true;
  }
}

export default PDFConfiguration;

