// pages/print/household-rhythm-starter.tsx

import Head from "next/head";
import React from "react";
import EmbossedBrandMark from "../../components/EmbossedBrandMark"; 
import EmbossedSign from "../../components/EmbossedSign";       

export default function HouseholdRhythmStarter() {
  const currentYear = new Date().getFullYear();
  return (
    <>
      <Head>
        <title>Household Rhythm Starter — Print</title>
      </Head>

      <main className="sheet relative">
        <header className="title-area relative">
          {/* --- Branding: Logo Top Left --- */}
          <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2">
              <EmbossedBrandMark
                  src="/assets/images/abraham-logo.jpg"
                  alt="Abraham of London Logo"
                  width={35}
                  height={35}
                  effect="emboss"
                  baseColor="transparent"
              />
          </div>

          <h1>Household Rhythm Starter</h1>
          <p className="lead">
            A simple weekly cadence for clarity, connection, and care.
          </p>
        </header>

        <section>
          <h2>Weekly Rhythm</h2>
          <ul>
            <li><strong>Sun PM:</strong> Family huddle — calendar, meals, highlights.</li>
            <li><strong>Mon–Fri:</strong> Morning blessing + shared table.</li>
            <li><strong>Wed:</strong> Mid-week reset — tidy + encouragement.</li>
            <li><strong>Fri PM:</strong> Gratitude + fun night.</li>
            <li><strong>Sat:</strong> Adventure / rest / errands.</li>
          </ul>
        </section>
        
        <section className="mt-6">
          <h2>30•60•90 Focus</h2>
          <ul>
            <li>30: One habit we’ll shape this month.</li>
            <li>60: One room or system we’ll improve.</li>
            <li>90: One shared goal we’ll celebrate.</li>
          </ul>
        </section>

        <footer className="footer-bar flex justify-between items-end">
            <p className="copyright">
                © {currentYear} Abraham of London • abrahamoflondon.org
            </p>
            
            {/* --- Branding: Signature Bottom Right --- */}
            <div className="flex flex-col items-end">
                <EmbossedSign
                    src="/assets/images/signature/abraham-of-london-cursive.svg"
                    alt="Abraham of London Signature"
                    width={100} 
                    height={25} 
                    effect="deboss"
                    baseColor="transparent"
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
        }

        @page { size: A4; margin: 15mm; }
        html, body { background: white; margin: 0; padding: 0; }

        .sheet { 
            width: 210mm; 
            min-height: 277mm; 
            margin: 0 auto; 
            font-family: var(--font-sans, ui-sans-serif); 
            color: var(--color-primary); 
            padding: 10mm; /* Internal padding */
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        .title-area { 
            text-align: center; 
            margin-bottom: 8mm; 
            padding-top: 10mm; /* Space for the top-left logo */
        }
        
        h1 { 
            font-family: var(--font-serif, Georgia); 
            font-weight: 700; 
            font-size: 20pt; 
            margin: 0 0 2mm; 
        }
        
        .lead { 
            color: var(--color-text-muted); 
            font-size: 11pt; 
            margin: 0; 
        }
        
        h2 { 
            font-family: var(--font-serif, Georgia); 
            font-weight: 700; 
            font-size: 14pt; 
            margin: 8mm 0 3mm; 
            color: var(--color-secondary, #004d40);
            border-bottom: 1px solid #eee;
            padding-bottom: 2px;
        }
        
        ul { 
            list-style: none; 
            padding-left: 0; 
            font-size: 11pt; 
            line-height: 1.6;
        }
        ul li {
            margin: 3mm 0;
        }

        .footer-bar {
            border-top: 1px solid #ddd;
            padding-top: 5mm;
            margin-top: 10mm;
            align-items: flex-end;
        }

        .copyright {
            font-size: 9.5pt;
            color: var(--color-text-muted);
            margin: 0;
        }
        
        .sign-label {
             font-size: 8.5pt; 
             color: var(--color-text-muted); 
             margin-top: 2px;
        }

        @media screen { 
            body { background: #f6f6f6; padding: 2rem; } 
            .sheet { 
                background: #fff; 
                box-shadow: 0 10px 30px rgba(0,0,0,.08); 
                padding: 15mm;
                min-height: auto;
                max-width: 210mm;
            } 
            /* Correcting logo placement in screen view */
            .title-area .absolute {
                top: 15mm; 
                left: 15mm;
                transform: none;
            }
        }
      `}</style>
    </>
  );
}