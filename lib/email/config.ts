// lib/email/config.ts
import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  replyTo?: string;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  html: string;
  text: string;
}

class EmailConfiguration {
  private static instance: EmailConfiguration;
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;
  
  private constructor() {
    this.config = this.loadConfig();
  }
  
  static getInstance(): EmailConfiguration {
    if (!EmailConfiguration.instance) {
      EmailConfiguration.instance = new EmailConfiguration();
    }
    return EmailConfiguration.instance;
  }
  
  private loadConfig(): EmailConfig {
    return {
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER || '',
        pass: process.env.EMAIL_SERVER_PASSWORD || '',
      },
      from: process.env.EMAIL_FROM || 'noreply@abrahamoflondon.com',
      replyTo: process.env.EMAIL_REPLY_TO,
    };
  }
  
  getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport(this.config);
      
      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          console.error('❌ Email transporter verification failed:', error);
        } else {
          console.log('✅ Email transporter ready');
        }
      });
    }
    return this.transporter;
  }
  
  getConfig(): EmailConfig {
    return this.config;
  }
  
  // Template management
  private templates: Record<string, EmailTemplate> = {
    'welcome': {
      id: 'welcome',
      subject: 'Welcome to Abraham of London',
      html: `<div>Welcome content here</div>`,
      text: 'Welcome text here',
    },
    'password-reset': {
      id: 'password-reset',
      subject: 'Reset Your Password',
      html: `<div>Password reset content</div>`,
      text: 'Password reset text',
    },
    'surrender-challenge': {
      id: 'surrender-challenge',
      subject: 'Your Surrender Challenge Begins',
      html: `<div>Surrender challenge content</div>`,
      text: 'Surrender challenge text',
    },
  };
  
  getTemplate(templateId: string): EmailTemplate | null {
    return this.templates[templateId] || null;
  }
  
  registerTemplate(template: EmailTemplate): void {
    this.templates[template.id] = template;
  }
}

export default EmailConfiguration;