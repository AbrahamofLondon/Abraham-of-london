import * as React from 'react';

interface NudgeEmailProps {
  participantName: string;
  organisationName: string;
  campaignTitle: string;
  inviteLink: string;
}

export const NudgeEmailTemplate = ({
  participantName,
  organisationName,
  campaignTitle,
  inviteLink,
}: NudgeEmailProps) => (
  <div style={{
    backgroundColor: '#FCFAF7',
    color: '#1C1C1C',
    fontFamily: 'Georgia, Times, serif',
    padding: '48px 24px',
  }}>
    <div style={{
      maxWidth: '560px',
      margin: '0 auto',
      border: '1px solid #E8E2D4',
      padding: '56px 48px',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    }}>
      {/* HEADER PROTOCOL */}
      <div style={{
        marginBottom: '48px',
        borderBottom: '1px solid #E8E2D4',
        paddingBottom: '24px',
      }}>
        <div style={{
          fontSize: '10px',
          fontFamily: 'Monaco, monospace',
          letterSpacing: '0.3em',
          color: '#9B8A6B',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          Institutional Alignment // Ref: {new Date().getFullYear()}
        </div>
        <div style={{
          fontSize: '24px',
          fontWeight: '400',
          letterSpacing: '-0.3px',
          color: '#2C2C2C',
        }}>
          Resonance Assessment
        </div>
      </div>

      {/* GREETING & CONTEXT */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{
          fontSize: '15px',
          lineHeight: '1.6',
          color: '#4A4A4A',
          marginBottom: '20px',
          fontFamily: 'Georgia, Times, serif',
        }}>
          Dear {participantName || 'Associate'},
        </p>
        <p style={{
          fontSize: '15px',
          lineHeight: '1.6',
          color: '#4A4A4A',
          marginBottom: '20px',
          fontFamily: 'Georgia, Times, serif',
        }}>
          Your participation in the <strong style={{ color: '#2C2C2C' }}>{campaignTitle}</strong> for <strong style={{ color: '#2C2C2C' }}>{organisationName}</strong> is currently flagged as incomplete. 
        </p>
        <p style={{
          fontSize: '15px',
          lineHeight: '1.6',
          color: '#4A4A4A',
          marginBottom: '24px',
          fontFamily: 'Georgia, Times, serif',
        }}>
          Your perspective is essential — not as a mere metric, but as a critical signal of institutional coherence. Without your input, the diagnostic mapping of the organization remains fragmented.
        </p>
      </div>

      {/* CALL TO ACTION */}
      <div style={{
        marginBottom: '48px',
        textAlign: 'center',
      }}>
        <a href={inviteLink} style={{
          display: 'inline-block',
          backgroundColor: '#1C1C1C',
          color: '#FFFFFF',
          padding: '16px 40px',
          fontSize: '11px',
          fontFamily: 'Monaco, monospace',
          fontWeight: '500',
          textDecoration: 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          border: 'none',
        }}>
          Resume Assessment
        </a>
      </div>

      {/* DISCRETIONARY GUARANTEE */}
      <div style={{
        backgroundColor: '#F9F9F7',
        borderLeft: '3px solid #8A6A2F',
        padding: '24px',
        marginBottom: '40px',
      }}>
        <p style={{
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#6B6B6B',
          fontFamily: 'Georgia, Times, serif',
          margin: 0,
          fontStyle: 'italic',
        }}>
          <strong>Protocol Note:</strong> This assessment is cryptographically detached. Your responses are aggregated via the Sovereign Scrubber; no individual data points are accessible by {organisationName} leadership.
        </p>
      </div>

      {/* FOOTER */}
      <div style={{
        borderTop: '1px solid #E8E2D4',
        paddingTop: '24px',
        fontSize: '9px',
        fontFamily: 'Monaco, monospace',
        color: '#B0B0B0',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        textAlign: 'center',
      }}>
        Sent via Sovereign OGR Diagnostic Protocol <br/>
        Ref: {campaignTitle.split(' ').join('-').toUpperCase()}
      </div>
    </div>
  </div>
);