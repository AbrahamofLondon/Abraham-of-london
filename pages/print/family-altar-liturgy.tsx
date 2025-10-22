// pages/print/family-altar-liturgy.tsx
import Head from "next/head";
import React from "react";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";   

export default function Print_FamilyAltarLiturgy() {
 const currentYear = new Date().getFullYear();
 
 return (
  <>
   <Head><title>Family Altar Liturgy — 2-Page Print</title></Head>
   <main className="sheet">
    <header className="title relative">
     {/* --- Branding: Logo Top Left --- */}
     <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2">
       <EmbossedBrandMark
         src="/assets/images/abraham-logo.jpg"
         alt="Abraham of London Logo"
         width={35}
         height={35}
         effect="emboss"
       />
     </div>
     <h1>Family Altar Liturgy</h1>
     <p className="sub">Short. Kind. Repeatable. Suited for night or week's beginning.</p>
    </header>
    <section className="grid">
     <div className="block">
      <h2>Opening (Leader)</h2>
      <p><em>We gather to remember God's love, receive His peace, and commit to one good work.</em></p>
      <h3>Call & Response</h3>
      <ul>
       <li><strong>Leader:</strong> The Lord is near.</li>
       <li><strong>All:</strong> We are not afraid.</li>
       <li><strong>Leader:</strong> His truth is our path.</li>
       <li><strong>All:</strong> We will walk in it.</li>
      </ul>
      <h3>Scripture (1–3 verses)</h3>
      <p>Read slowly. Pause. Ask: "What word or phrase stands out?" One sentence each.</p>
      <h3>Thanksgiving</h3>
      <p>I thank God today for… (children first, then adults)</p>
     </div>
     <div className="block">
      <h2>Intercessions</h2>
      <ul>
       <li>Family: health, work, learning, relationships.</li>
       <li>Neighbors & friends: one name each; one practical help this week.</li>
       <li>Leaders & church: courage, wisdom, integrity.</li>
      </ul>
      <h3>The Lord's Prayer</h3>
      <p><em>Our Father in heaven…</em></p>
      <h2>Micro-Commitments</h2>
      <ul>
       <li><strong>Truth:</strong> One honest action I will take tomorrow is…</li>
       <li><strong>Service:</strong> One small burden I can lift is…</li>
       <li><strong>Presence:</strong> One device boundary I will keep is…</li>
      </ul>
      <h3>Blessing (Leader)</h3>
      <p><em>May the Lord bless you and keep you. Be strong and kind. Amen.</em></p>
     </div>
    </section>
    <footer className="footer-bar flex justify-between items-end">
      <div className="note-box">
        <p className="note-text">Keep under 12 minutes • Children go first • End with one concrete step.</p>
        <p className="copyright-text">© {currentYear} Abraham of London • abrahamoflondon.org</p>
      </div>
     
      {/* --- Branding: Signature Bottom Right --- */}
      <div className="flex flex-col items-end">
        <EmbossedSign
          src="/assets/images/signature/abraham-of-london-cursive.svg"
          alt="Abraham of London Signature"
          width={100}
          height={25}
          effect="deboss"
        />
        <span className="sign-label">A.o.L. Standards</span>
      </div>
    </footer>
   </main>
   <style jsx global>{`
    /* Defining CSS variables for color consistency */
    :root {
      --color-primary: #1a1a1a;
      --color-secondary: #004d40; /* Example forest green */
      --color-text-muted: #555;
      --font-serif: Georgia, Cambria, "Times New Roman", Times, serif;
    }
    @page { size: A4; margin: 12mm; }
    html, body { background: white; }
   
    .sheet {
      width: 210mm;
      min-height: 273mm;
      margin: 0 auto;
      font-family: var(--font-sans, ui-sans-serif);
      color: var(--color-primary);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10mm; /* Internal padding */
    }
   
    .title {
      text-align: center;
      margin-bottom: 6mm;
      padding-top: 5mm; /* Space for the top-left logo */
      position: relative;
    }
   
    h1 {
      font-family: var(--font-serif);
      font-weight: 700;
      font-size: 20pt;
      margin: 0 0 2mm;
    }
   
    .sub {
      color: var(--color-text-muted);
      font-size: 10pt;
      margin: 0;
    }
   
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7mm;
    }
   
    .block h2 {
      font-family: var(--font-serif);
      font-weight: 700;
      font-size: 12pt;
      color: var(--color-secondary);
      margin: 0 0 2mm;
    }
   
    .block h3 {
      font-family: var(--font-serif);
      font-weight: 600;
      font-size: 11pt;
      margin: 3mm 0 1.5mm;
    }
   
    .block p, .block ul { margin: 0 0 3mm; }
    .block ul { padding-left: 4mm; font-size: 10.5pt; line-height: 1.5; }
   
    /* Footer Styles */
    .footer-bar {
      border-top: 1px solid #ddd;
      padding-top: 5mm;
      margin-top: 8mm; /* Reduced margin since we have internal padding */
      align-items: flex-end;
    }
    .note-box {
      display: flex;
      flex-direction: column;
    }
    .note-text {
      color: #667;
      font-size: 9.5pt;
      margin: 0;
      text-align: left;
    }
    .copyright-text {
      color: #667;
      font-size: 8.5pt;
      margin: 2px 0 0 0;
    }
   
    .sign-label {
      font-size: 8.5pt;
      color: #667;
      margin-top: 2px;
    }
    @media screen {
      body { background: #f6f6f6; padding: 2rem; }
      .sheet {
        background: #fff;
        box-shadow: 0 10px 30px rgba(0,0,0,.08);
        padding: 15mm;
        min-height: auto;
      }
      /* Correcting logo placement in screen view */
      .title .absolute {
        top: 15mm;
        left: 15mm;
        transform: none;
      }
    }
   `}</style>
  </>
 );
}