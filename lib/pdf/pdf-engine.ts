// lib/pdf/pdf-engine.ts
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { safeString, nowIso } from '@/lib/utils/safe';

/**
 * INSTITUTIONAL PDF ENGINE
 * Designed for high-fidelity intelligence digests and board memos.
 */
export async function generateInstitutionalPDF(data: any, reportType: string): Promise<Buffer> {
  const doc = new jsPDF();
  const timestamp = nowIso();

  // --- HEADER SECTION ---
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('ABRAHAM OF LONDON', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`CLASSIFICATION: INSTITUTIONAL BRIEF | TYPE: ${reportType}`, 14, 28);
  doc.text(`GENERATED: ${timestamp}`, 14, 33);
  doc.line(14, 35, 196, 35); // Horizontal divider

  // --- CONTENT GENERATION ---
  if (reportType === 'WEEKLY_INTEL_DIGEST') {
    let yPos = 45;

    data.dossiers.forEach((dossier: any, index: number) => {
      // Title
      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102); // Institutional Blue
      doc.text(`${index + 1}. ${dossier.title}`, 14, yPos);
      
      // Operating Logic
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const logicText = doc.splitTextToSize(`Logic: ${dossier.logic || 'N/A'}`, 180);
      doc.text(logicText, 14, yPos + 7);

      yPos += (logicText.length * 5) + 15;

      // Risks Table
      (doc as any).autoTable({
        startY: yPos - 5,
        head: [['Critical Risk Factor', 'Engagement Score']],
        body: dossier.criticalRisks.map((risk: any) => [
          risk.title || risk, 
          dossier.engagementScore
        ]),
        theme: 'striped',
        headStyles: { fillStyle: [0, 51, 102] },
        margin: { left: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Page Break logic
      if (yPos > 250 && index < data.dossiers.length - 1) {
        doc.addPage();
        yPos = 20;
      }
    });
  }

  // --- FOOTER ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Abraham of London - Proprietary Intelligence | Page ${i} of ${pageCount}`, 14, 285);
  }

  // Return as Buffer for server-side processing/mailing
  return Buffer.from(doc.output('arraybuffer'));
}