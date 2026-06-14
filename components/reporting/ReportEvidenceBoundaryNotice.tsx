import React from 'react';

export type BoundaryVariant = 'market_intelligence' | 'diagnostic' | 'assessment' | 'retainer' | 'board_facing_draft' | 'custom';

interface ReportEvidenceBoundaryNoticeProps {
  variant?: BoundaryVariant;
  className?: string;
}

const VARIANT_TEXT: Record<BoundaryVariant, string> = {
  market_intelligence: `This report is evidence-limited quarterly market intelligence. It is not investment advice, financial advice, or a prediction guarantee. It is designed to structure market judgement and maintain verification discipline through quarterly call review.`,

  diagnostic: `This diagnostic report is a decision-support artifact based on available evidence. It does not independently verify claims, does not certify correctness, and does not replace professional judgment. It is designed to expose evidence gaps and support decision-making under uncertainty.`,

  assessment: `This assessment report describes findings based on available evidence and methodology. It is not a certified assessment, externally validated analysis, or guarantee of outcomes. It is designed to structure evaluation and support decision-making.`,

  retainer: `This retainer oversight brief describes activities, sources, and findings. It is not an audit opinion, certified review, or guarantee of compliance. It is designed to support ongoing oversight and decision-making within defined scope.`,

  board_facing_draft: `This board discussion document is a draft prepared to support board review. It is not board-approved, board-certified, or externally verified authority proof. It is designed to structure board conversation and support decision-making.`,

  custom: `This custom report is a delivery artifact describing findings and analysis. It may reference evidence and sources, but it is not itself authority-granting evidence and does not validate, certify, or externally verify product claims.`,
};

const CORE_NOTICE = `This report is a delivery and interpretation artifact. It may describe evidence, source material, and findings, but it is not itself authority-granting evidence and does not validate, certify, or externally verify any product claim.`;

export default function ReportEvidenceBoundaryNotice({
  variant = 'custom',
  className = '',
}: ReportEvidenceBoundaryNoticeProps) {
  const variantText = VARIANT_TEXT[variant];

  return (
    <div className={`report-boundary-notice ${className}`}>
      <div className="boundary-header">
        <span className="boundary-icon">⚠️</span>
        <h3>Evidence Boundary</h3>
      </div>

      <div className="boundary-content">
        <p className="variant-text">{variantText}</p>

        <p className="core-notice">{CORE_NOTICE}</p>

        <div className="boundary-details">
          <h4>What This Report Is</h4>
          <ul>
            <li>A delivery and interpretation artifact</li>
            <li>A structured summary of findings</li>
            <li>A decision-support material</li>
            <li>An advisory document for professional review</li>
          </ul>

          <h4>What This Report Is NOT</h4>
          <ul>
            <li>Authority-granting evidence</li>
            <li>Certified or validated analysis</li>
            <li>Externally verified proof</li>
            <li>Investment advice or financial guidance</li>
            <li>Legal advice or compliance opinion</li>
            <li>Medical advice or clinical guidance</li>
            <li>A guarantee of outcomes or results</li>
          </ul>
        </div>
      </div>

      <style>{`
        .report-boundary-notice {
          background-color: #fef3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          padding: 20px;
          margin: 20px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .boundary-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .boundary-icon {
          font-size: 1.5rem;
        }

        .boundary-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #333;
        }

        .boundary-content {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #555;
        }

        .variant-text {
          font-weight: 500;
          margin: 0 0 10px 0;
          padding: 10px;
          background-color: #fff8dc;
          border-radius: 3px;
          border-left: 3px solid #ff9800;
        }

        .core-notice {
          margin: 15px 0;
          padding: 10px;
          background-color: #fff5f5;
          border-radius: 3px;
          border-left: 3px solid #d32f2f;
          font-weight: 500;
        }

        .boundary-details {
          margin-top: 15px;
        }

        .boundary-details h4 {
          margin: 12px 0 8px 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #333;
        }

        .boundary-details ul {
          margin: 0;
          padding-left: 20px;
          list-style-type: none;
        }

        .boundary-details li {
          margin-bottom: 6px;
          padding-left: 20px;
          position: relative;
        }

        .boundary-details li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #d32f2f;
          font-weight: bold;
        }

        .boundary-details h4:first-of-type + ul li::before {
          color: #4caf50;
          content: '✓';
        }
      `}</style>
    </div>
  );
}

export { VARIANT_TEXT, CORE_NOTICE };
