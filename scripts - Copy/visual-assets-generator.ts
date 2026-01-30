// scripts/visual-assets-generator.ts
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

interface VisualAssetConfig {
  id: string;
  title: string;
  type: 'social' | 'infographic' | 'diagram' | 'worksheet-preview';
  dimensions: { width: number; height: number };
  template: 'surrender-vs-submission' | '4d-framework' | 'love-orientation' | 'weekly-audit';
}

export class VisualAssetsGenerator {
  private assetsDir: string;

  constructor() {
    this.assetsDir = path.join(process.cwd(), 'public', 'assets', 'visuals');
    if (!fs.existsSync(this.assetsDir)) {
      fs.mkdirSync(this.assetsDir, { recursive: true });
    }
  }

  async generateAll(): Promise<void> {
    const assets: VisualAssetConfig[] = [
      {
        id: 'surrender-vs-submission-infographic',
        title: 'Surrender vs. Submission Infographic',
        type: 'infographic',
        dimensions: { width: 1200, height: 1600 },
        template: 'surrender-vs-submission'
      },
      {
        id: '4d-framework-diagram',
        title: '4D Surrender Framework Diagram',
        type: 'diagram',
        dimensions: { width: 1600, height: 900 },
        template: '4d-framework'
      },
      {
        id: 'love-orientation-map',
        title: 'Love Orientation Map',
        type: 'infographic',
        dimensions: { width: 1200, height: 1200 },
        template: 'love-orientation'
      },
      {
        id: 'weekly-audit-template-preview',
        title: 'Weekly Audit Template Preview',
        type: 'worksheet-preview',
        dimensions: { width: 1200, height: 800 },
        template: 'weekly-audit'
      },
      {
        id: 'social-surrender-vs-submission',
        title: 'Social Media: Surrender vs. Submission',
        type: 'social',
        dimensions: { width: 1200, height: 630 },
        template: 'surrender-vs-submission'
      },
      {
        id: 'social-4d-framework',
        title: 'Social Media: 4D Framework',
        type: 'social',
        dimensions: { width: 1080, height: 1080 },
        template: '4d-framework'
      }
    ];

    console.log('🎨 Generating visual assets...');

    for (const asset of assets) {
      try {
        await this.generateAsset(asset);
        console.log(`✅ Generated: ${asset.title}`);
      } catch (error) {
        console.error(`❌ Failed to generate ${asset.title}:`, error);
      }
    }

    console.log('🎨 Visual assets generation complete!');
  }

  private async generateAsset(config: VisualAssetConfig): Promise<void> {
    const canvas = createCanvas(config.dimensions.width, config.dimensions.height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#050609';
    ctx.fillRect(0, 0, config.dimensions.width, config.dimensions.height);

    // Template-specific rendering
    switch (config.template) {
      case 'surrender-vs-submission':
        await this.renderSurrenderVsSubmission(ctx, config);
        break;
      case '4d-framework':
        await this.render4DFramework(ctx, config);
        break;
      case 'love-orientation':
        await this.renderLoveOrientation(ctx, config);
        break;
      case 'weekly-audit':
        await this.renderWeeklyAudit(ctx, config);
        break;
    }

    // Branding
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Abraham of London', 50, config.dimensions.height - 50);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('Surrender Framework • www.abrahamoflondon.com', 
      50, config.dimensions.height - 25);

    // Save to file
    const buffer = canvas.toBuffer('image/png');
    const outputPath = path.join(this.assetsDir, `${config.id}.png`);
    fs.writeFileSync(outputPath, buffer);
  }

  private async renderSurrenderVsSubmission(ctx: any, config: VisualAssetConfig): Promise<void> {
    const { width, height } = config.dimensions;
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('SURRENDER vs. SUBMISSION', width / 2 - 350, 80);

    // Surrender Column
    ctx.fillStyle = '#10B981';
    ctx.fillRect(100, 150, width / 2 - 150, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('SURRENDER', 120, 185);

    // Submission Column
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(width / 2 + 50, 150, width / 2 - 150, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('SUBMISSION', width / 2 + 70, 185);

    // Comparison points
    const points = [
      { label: 'Agency', surrender: 'Active choice', submission: 'Forced compliance' },
      { label: 'Focus', surrender: 'Internal shift', submission: 'External response' },
      { label: 'Outcome', surrender: 'Empowerment', submission: 'Obedience' },
      { label: 'Motivation', surrender: 'Harmony', submission: 'Fear/Duty' },
      { label: 'Application', surrender: 'Principles', submission: 'Rules' }
    ];

    let y = 250;
    ctx.font = '20px Arial';
    
    points.forEach(point => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(point.label, 120, y);
      ctx.fillStyle = '#10B981';
      ctx.fillText(point.surrender, 300, y);
      ctx.fillStyle = '#EF4444';
      ctx.fillText(point.submission, width / 2 + 100, y);
      y += 40;
    });

    // Key Insight
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'italic 22px Arial';
    ctx.fillText('"Surrender is chosen alignment; submission is compelled compliance"', 
      width / 2 - 400, height - 150);
  }

  private async render4DFramework(ctx: any, config: VisualAssetConfig): Promise<void> {
    const { width, height } = config.dimensions;
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('THE 4D SURRENDER FRAMEWORK', width / 2 - 400, 80);

    // Steps
    const steps = [
      { letter: 'D', title: 'DISCERN', desc: 'Rule or Principle?', color: '#3B82F6' },
      { letter: 'D', title: 'DETACH', desc: 'Release outcomes', color: '#8B5CF6' },
      { letter: 'D', title: 'DECIDE', desc: 'Conscious choice', color: '#10B981' },
      { letter: 'D', title: 'DEMONSTRATE', desc: 'Live the choice', color: '#F59E0B' }
    ];

    const circleRadius = 120;
    const centerX = width / 2;
    const centerY = height / 2;

    steps.forEach((step, index) => {
      const angle = (index * Math.PI * 2) / steps.length;
      const x = centerX + Math.cos(angle) * 200;
      const y = centerY + Math.sin(angle) * 200;

      // Circle
      ctx.fillStyle = step.color;
      ctx.beginPath();
      ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
      ctx.fill();

      // Letter
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 64px Arial';
      ctx.fillText(step.letter, x - 20, y + 20);

      // Title
      ctx.font = 'bold 24px Arial';
      ctx.fillText(step.title, x - 60, y + 80);

      // Description
      ctx.font = '18px Arial';
      ctx.fillText(step.desc, x - 50, y + 110);
    });

    // Center text
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('SURRENDER', centerX - 80, centerY - 10);
    ctx.font = '20px Arial';
    ctx.fillText('Not Submission', centerX - 60, centerY + 25);
  }

  private async renderLoveOrientation(ctx: any, config: VisualAssetConfig): Promise<void> {
    const { width, height } = config.dimensions;
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('LOVE ORIENTATION MAP', width / 2 - 200, 80);

    // Vertical Path
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('VERTICAL FIRST', width / 2 - 400, 200);
    
    // Arrow
    ctx.beginPath();
    ctx.moveTo(width / 2 - 300, 220);
    ctx.lineTo(width / 2 - 250, 240);
    ctx.lineTo(width / 2 - 300, 260);
    ctx.fill();

    // Steps for vertical path
    const verticalSteps = [
      'Surrender to Source',
      'Receive unconditional love',
      'Love from overflow',
      'Give without expectation',
      'True freedom & joy'
    ];

    let y = 280;
    ctx.font = '20px Arial';
    verticalSteps.forEach(step => {
      ctx.fillStyle = '#10B981';
      ctx.fillText('→ ' + step, width / 2 - 400, y);
      y += 40;
    });

    // Horizontal Only Path
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('HORIZONTAL ONLY', width / 2 + 200, 200);
    
    // Arrow
    ctx.beginPath();
    ctx.moveTo(width / 2 + 300, 220);
    ctx.lineTo(width / 2 + 350, 240);
    ctx.lineTo(width / 2 + 300, 260);
    ctx.fill();

    // Steps for horizontal path
    const horizontalSteps = [
      'Love self over others',
      'Seek pleasure/praise/power',
      'Give to get (transactional)',
      'Love from emptiness',
      'End in distraction/emptiness'
    ];

    y = 280;
    ctx.font = '20px Arial';
    horizontalSteps.forEach(step => {
      ctx.fillStyle = '#EF4444';
      ctx.fillText('→ ' + step, width / 2 + 200, y);
      y += 40;
    });

    // Divider
    ctx.strokeStyle = '#666666';
    ctx.beginPath();
    ctx.moveTo(width / 2, 180);
    ctx.lineTo(width / 2, height - 200);
    ctx.stroke();

    // Bottom text
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'italic 24px Arial';
    ctx.fillText('The critical distinction:', width / 2 - 150, height - 150);
    ctx.fillText('"Vertical first enables healthy horizontal"', width / 2 - 250, height - 100);
  }

  private async renderWeeklyAudit(ctx: any, config: VisualAssetConfig): Promise<void> {
    const { width, height } = config.dimensions;
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('WEEKLY SURRENDER AUDIT', width / 2 - 200, 80);

    // Days grid
    const days = [
      { day: 'MONDAY', focus: 'Principle Alignment', color: '#3B82F6' },
      { day: 'TUESDAY', focus: 'Submission Detection', color: '#8B5CF6' },
      { day: 'WEDNESDAY', focus: 'Control Release', color: '#10B981' },
      { day: 'THURSDAY', focus: 'Vertical Alignment', color: '#F59E0B' },
      { day: 'FRIDAY', focus: 'Evidence Collection', color: '#EF4444' },
      { day: 'WEEKEND', focus: 'Integration', color: '#EC4899' }
    ];

    const boxWidth = 250;
    const boxHeight = 150;
    const margin = 50;
    let x = margin;
    let y = 150;

    days.forEach((day, index) => {
      // Box
      ctx.fillStyle = day.color;
      ctx.fillRect(x, y, boxWidth, boxHeight);

      // Day
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(day.day, x + 20, y + 40);

      // Focus
      ctx.font = '18px Arial';
      const lines = this.wrapText(ctx, day.focus, boxWidth - 40);
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, x + 20, y + 80 + (lineIndex * 25));
      });

      // Move to next position
      x += boxWidth + margin;
      if (x + boxWidth > width - margin) {
        x = margin;
        y += boxHeight + margin;
      }
    });

    // Bottom text
    ctx.fillStyle = '#D4AF37';
    ctx.font = '20px Arial';
    ctx.fillText('Daily practice → Weekly transformation', 
      width / 2 - 180, height - 80);
  }

  private wrapText(ctx: any, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }
}

// CLI interface
if (require.main === module) {
  const generator = new VisualAssetsGenerator();
  generator.generateAll().catch(console.error);
}