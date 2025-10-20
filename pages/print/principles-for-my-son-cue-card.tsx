// pages/print/principles-for-my-son-cue-card.tsx

import * as React from "react";
import Head from "next/head";
import EmbossedBrandMark from "../../components/EmbossedBrandMark"; 
import EmbossedSign from "../../components/EmbossedSign";       

const BrandedCard = ({ isBack = false }) => {
  return (
    <div className="card relative">
      {/* --- Branding: Logo Top Left --- */}
      <div className="absolute top-4 left-4">
        <EmbossedBrandMark
          src="/assets/images/abraham-logo.jpg"
          alt="Abraham of London Logo"
          width={25}
          height={25}
          effect="emboss"
          baseColor="transparent"
        />
      </div>

      <div className="eyebrow">Standards • A6</div>
      <h1>Principles for My Son</h1>
      <ol className="list">
        <li><strong>Seek wisdom daily.</strong></li>
        <li><strong>Tell the truth.</strong></li>
        <li><strong>Own your decisions.</strong></li>
        <li><strong>Honour women.</strong></li>
        <li><strong>Guard your eyes.</strong></li>
        <li><strong>Work before reward.</strong></li>
        <li><strong>Stand with the weak.</strong></li>
        <li><strong>Keep small promises.</strong></li>
        <li><strong>Train the five.</strong></li>
        <li><strong>Steward money.</strong></li>
        <li><strong>Choose brotherhood.</strong></li>
        <li><strong>Think legacy, not likes.</strong></li>
      </ol>
      
      {/* --- Footer / Signature Area --- */}
      <div className="footer flex justify-between items-end">
        <span>abrahamoflondon.org</span>
        
        {/* Signature only on the 'back' card, or the right-hand card */}
        {isBack && (
          <div className="flex flex-col items-end">
            <EmbossedSign
              src="/assets/images/signature/abraham-of-london-cursive.svg"
              alt="Abraham of London Signature"
              width={70} 
              height={20} 
              effect="deboss"
              baseColor="transparent"
            />
            <span className="sign-label">A.o.L.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PrinciplesForMySonCueCard() {
  return (
    <>
      <Head>
        <title>Principles for My Son — Cue Card • Print</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="sheet">
        {/* Card 1 (Front) */}
        <div className="col"><BrandedCard isBack={false} /></div>
        {/* Card 2 (Back) - Includes Signature */}
        <div className="col"><BrandedCard isBack={true} /></div>

        {/* cut marks */}
        <div className="marks">
          <div className="v center" />
          <div className="h top" />
          <div className="h bottom" />
        </div>
      </main>

      <style jsx global>{`
        /* Defining CSS variables for color consistency */
        :root { 
            --ink:#111; 
            --muted:#666; 
            --rule:#dcdcdc; 
            --gold:#bfa364;
            --page-margin: 10mm;
            --a6-w: 148mm;
            --a6-h: 105mm; 
        }
        
        html, body { background:#f6f6f6; margin: 0; padding: 0; }
        
        .sheet {
          /* A4 Size */
          width:210mm; 
          height:297mm; 
          margin:var(--page-margin) auto; 
          background:#fff; 
          box-shadow:0 2mm 6mm rgba(0,0,0,.06);
          
          /* Layout for two A6 Landscape cards side-by-side */
          position:relative; 
          display:grid; 
          grid-template-columns: var(--a6-w) var(--a6-w); 
          gap: 0; /* Cards handle their own spacing within the columns */
          place-content: center; /* Center the grid on the A4 page */
        }
        
        .col { 
          display:flex; 
          align-items:center; 
          justify-content:center; 
          /* Ensure column width doesn't exceed 148mm */
          width: var(--a6-w); 
          height: 100%;
        }
        
        .card {
          width:var(--a6-w); 
          height:var(--a6-h); /* A6 landscape */
          border:0.6pt solid var(--rule); 
          border-radius:10px; 
          padding:7mm;
          
          display:flex; 
          flex-direction:column; 
          justify-content:flex-start; 
          gap:3mm;
          position: relative; /* Needed for absolute branding elements */
        }
        
        .eyebrow {
          align-self:flex-start; 
          display:inline-block; 
          font-size:8.5pt; 
          letter-spacing:.14em; 
          text-transform:uppercase;
          padding:1.5pt 7pt; 
          border:0.6pt solid var(--gold); 
          color:var(--gold); 
          border-radius:999px;
          margin-top: 10mm; /* Push down to clear space for the top-left logo */
          align-self: center;
        }
        
        h1 { 
            font:700 14pt/1.25 ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; 
            margin:1mm 0 0; 
            color:var(--ink); 
            text-align: center;
        }
        
        .list { 
            margin:3mm 0 0; 
            padding-left:4mm; 
            font:10.5pt/1.35 Georgia, ui-serif, Cambria, "Times New Roman", Times, serif; 
            color:#222; 
            display:grid; 
            gap:1.2mm; 
        }
        
        .footer { 
            margin-top:auto; 
            font:9pt/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; 
            color:var(--muted); 
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .footer span {
            /* Restore color for the URL */
            color: var(--muted);
        }

        .sign-label {
             font-size: 8pt; 
             color: var(--muted); 
             margin-top: 2px;
        }

        /* --- Cut Marks --- */
        .marks .v, .marks .h { position:absolute; background:#000; opacity:.5; }
        
        /* Vertical Mark (Center cut) */
        .marks .v.center { 
            width:0.5pt; 
            height:8mm; 
            top:calc(50% - 4mm); 
            left:calc(50% - 0.25pt); /* Exactly in the middle */
        }
        
        /* Horizontal Marks (Top and Bottom of the 2-up layout) */
        .marks .h { 
            height:0.5pt; 
            width:8mm; 
            left:calc(50% - 4mm); /* Center horizontally */
        }
        .marks .h.top { 
            /* Top edge of the A6 card area, centered vertically */
            top: calc(50% - 0.25pt - (var(--a6-h) / 2)); 
            transform: translateY(calc(-1 * var(--a6-h) / 2));
        }
        .marks .h.bottom { 
            /* Bottom edge of the A6 card area, centered vertically */
            bottom: calc(50% - 0.25pt - (var(--a6-h) / 2)); 
            transform: translateY(calc(var(--a6-h) / 2));
        }

        @media print {
          html, body { background:#fff; }
          .sheet { margin:0; box-shadow:none; }
          @page { size:A4; margin:6mm; }
        }
      `}</style>
    </>
  );
}