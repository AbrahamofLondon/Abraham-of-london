// pages/print/scripture-track-john14.tsx

import Head from "next/head";
import React from "react";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark"; 
import EmbossedSign from "@/components/print/EmbossedSign";       

const Block = ({ title, items, isOrdered = false }: { title: string; items: string[]; isOrdered?: boolean }) => {
  const ListTag = isOrdered ? 'ol' : 'ul';
  return (
    <div className="block">
      <h2>{title}</h2>
      <ListTag>{items.map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}</ListTag>
    </div>
  );
};

export default function Print_ScriptureTrack_John14() {
  return (
    <>
      <Head><title>Scripture Track â€” John 14 (Print)</title></Head>
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
                  baseColor="transparent"
              />
          </div>
          
          <h1>Scripture Track â€” John 14</h1>
          <p className="sub">Assurance â€¢ Obedience â€¢ The Helper â€¢ Peace</p>
        </header>

        <section className="grid">
          <Block title="How to Run" items={[
            "<strong>Daily (10â€“15 min):</strong> Read the text; note one obedience step.",
            "<strong>Weekly (45 min):</strong> Share truth, one win, one next step. Pray names.",
            "<strong>Family:</strong> Read a verse aloud; one sentence prayer each.",
          ]} />

          <Block title="Week 1 â€” Assurance (Jn 14:1â€“6)" items={[
            "<strong>Memory:</strong> John 14:6",
            "<strong>Prompt:</strong> Where am I troubled? What would trust look like today?",
            "<strong>Practice:</strong> Name a fear; replace it with a promise.",
          ]} />

          <Block title="Week 2 â€” Obedience (Jn 14:15â€“21)" items={[
            "<strong>Memory:</strong> John 14:15",
            "<strong>Prompt:</strong> Which instruction have I delayed?",
            "<strong>Practice:</strong> Same-day obedience on one small step.",
          ]} />

          <Block title="Week 3 â€” The Helper (Jn 14:16â€“18,26)" items={[
            "<strong>Memory:</strong> John 14:26",
            "<strong>Prompt:</strong> Where do I need wise help beyond my strength?",
            "<strong>Practice:</strong> Ask the Spirit for counsel; seek godly advice.",
          ]} />

          <Block title="Week 4 â€” Peace Under Pressure (Jn 14:27,31)" items={[
            "<strong>Memory:</strong> John 14:27",
            "<strong>Prompt:</strong> What robs my peace? What boundary restores it?",
            "<strong>Practice:</strong> Phone off for one hour; pray for someone anxious.",
          ]} />

          <Block title="Family Reflection (10 min)" items={[
            "What did we hear? One sentence each.",
            "What will we do? One step each.",
            "Who will we serve this week? Name a person.",
          ]} isOrdered={true} />
        </section>

        <footer className="note flex justify-between items-end border-t border-lightGrey/60 pt-4 mt-8">
            <span>Cadence: daily read â€¢ weekly share â€¢ one concrete step.</span>
            
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
                <span className="text-[9.5pt] text-[color:var(--color-on-secondary)/0.6] mt-0.5">Abraham of London</span>
            </div>
        </footer>
      </main>

      <style jsx global>{`
        /* Defining CSS variables for color consistency */
        :root {
            --color-primary: #1a1a1a;
            --color-secondary: #004d40; /* Example forest green */
            --color-lightGrey: #dadada;
        }
        
        @page { size: A4; margin: 12mm; }
        html, body { background: white; }
        
        .sheet { 
            width: 210mm; 
            min-height: 273mm; 
            margin: 0 auto; 
            font-family: var(--font-sans, ui-sans-serif); 
            color: var(--color-primary); 
            padding: 10mm; /* Added padding for better content spacing */
        }
        
        .title { 
            text-align: center; 
            margin-bottom: 6mm; 
            padding-top: 10mm; /* Space for the top-left logo */
        }
        
        h1 { 
            font-family: var(--font-serif, Georgia); 
            font-weight: 700; 
            font-size: 20pt; 
            margin: 0 0 2mm; 
        }
        
        .sub { 
            color: #555; 
            font-size: 10pt; 
            margin: 0; 
        }
        
        .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 7mm; 
        }
        
        .block h2 { 
            font-family: var(--font-serif, Georgia); 
            font-weight: 700; 
            font-size: 12pt; 
            margin: 0 0 2mm; 
            color: var(--color-secondary, #004d40); /* Styling h2 with a color */
        }
        
        .block ul, .block ol { 
            margin: 0; 
            padding-left: 4mm; 
            font-size: 10.5pt; 
            line-height: 1.5; 
            list-style: disc; /* Ensure ul has disc bullets */
        }
        .block ol {
            list-style: decimal; /* Ensure ol has numbers */
        }
        
        /* Updated footer styles to use flexbox for better alignment */
        .note { 
            color: #667; 
            font-size: 9.5pt; 
        }
        .note > span {
            color: var(--color-primary);
        }
        
        @media screen { 
            body { 
                background: #f6f6f6; 
                padding: 2rem; 
            } 
            .sheet { 
                background: #fff; 
                box-shadow: 0 10px 30px rgba(0,0,0,.08); 
                padding: 15mm; 
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
