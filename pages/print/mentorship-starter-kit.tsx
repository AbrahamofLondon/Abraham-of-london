/* eslint-disable react/no-unescaped-entities */
// pages/print/mentorship-starter-kit.tsx

import Head from "next/head";
import React from "react";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";

---
title: "Mentorship-Starter-Kit"
slug: "mentorship-stater-kit"
date: "2024-10-22"
author: "AbrahamofLondon"
readTime: "10 min"
category: "Operations"
type: "Download"
---

export default function MentorshipStarterKitPrint() {
  return (
    <main className="print-wrap">
      <Head>
        <title>Mentorship Starter Kit</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* --- COVER (Page 1) --- */}
      <section className="page cover-page relative">
        {/* Branding: Large Logo on Cover */}
        <div className="cover-logo">
          <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={120}
              height={120}
              effect="emboss"/>
        </div>

        <h1 className="title">Mentorship Starter Kit</h1>
        <p className="lead">Presence over performance. Craft over clout.</p>

        {/* Branding: Standard Sigline */}
        <div className="sigline">
            <span className="font-serif">Abraham of London</span> • abrahamoflondon.org
        </div>
      </section>

      {/* --- COVENANT (Page 2) --- */}
      <section className="page relative">
        {/* Branding: Small Brand Mark Top Left for internal pages */}
        <div className="page-mark">
          <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={30}
              height={30}
              effect="deboss"/>
        </div>

        <h2>Covenant</h2>
        <ul className="list">
          <li><strong>We commit</strong> to show up, tell the truth, and do the work.</li>
          <li><strong>Confidentiality:</strong> Chatham rules.</li>
          <li><strong>Cadence:</strong> Weekly/bi-weekly, 60–75 minutes.</li>
          <li><strong>Ends:</strong> When the mandate is met or either party withdraws with thanks.</li>
        </ul>

        {/* Signature Section */}
        <div className="sign-area mt-10 grid grid-cols-2 gap-8">
            {["Mentor", "Mentee"].map((role) => (
                <div key={role} className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-lg font-serif">{role}</span>
                        {role === "Mentor" && (
                             <EmbossedSign
                                src="/assets/images/signature/abraham-of-london-cursive.svg"
                                alt="Abraham of London Signature"
                                width={100}
                                height={25}
                                effect="deboss"/>
                        )}
                    </div>
                    <div className="sig-line mb-4 border-b border-gray-400" />
                    <div className="flex justify-between text-sm">
                        <span>Name: ________________________</span>
                        <span>Date: __________</span>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* --- 12-WEEK ARC (Page 3) --- */}
      <section className="page relative">
        <div className="page-mark">
          <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={30}
              height={30}
              effect="deboss"/>
        </div>
        <h2>12-Week Arc</h2>
        <ol className="list">
          <li><strong>Weeks 1–3 — Clarity</strong>: mandate, constraints, standards.</li>
          <li><strong>Weeks 4–6 — Craft</strong>: habits, reps, review loop.</li>
          <li><strong>Weeks 7–9 — Proof</strong>: ship artifacts, gather evidence.</li>
          <li><strong>Weeks 10–12 — Endurance</strong>: systems, hand-off, next horizon.</li>
        </ol>
      </section>

      {/* --- MEETING SCRIPT (Page 4) --- */}
      <section className="page relative">
        <div className="page-mark">
          <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={30}
              height={30}
              effect="deboss"/>
        </div>
        <h2>Meeting Script</h2>
        <ol className="list">
          <li><strong>Report (10m):</strong> what you did, what moved, blockers.</li>
          <li><strong>Review (20m):</strong> inspect artifacts (not promises).</li>
          <li><strong>Teach (20m):</strong> one pattern/tool, pressure-tested.</li>
          <li><strong>Assign (10m):</strong> one clear deliverable + deadline.</li>
          <li><strong>Record (5m):</strong> log in evidence tracker.</li>
        </ol>
      </section>

      {/* --- FIRST 3 SESSIONS (Page 5) --- */}
      <section className="page relative">
        <div className="page-mark">
          <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={30}
              height={30}
              effect="deboss"/>
        </div>
        <h2>First Three Sessions</h2>
        <h3>Week 1</h3>
        <p>Mandate, standards, constraints. Deliverable: one-page Mandate.</p>
        <h3>Week 2</h3>
        <p>Time budget & operating rhythm. Deliverable: Weekly Rhythm with hard edges.</p>
        <h3>Week 3</h3>
        <p>First artifact shipped. Deliverable: one finished micro-asset + review criteria.</p>
      </section>

      {/* --- EVIDENCE LOG (FORM) (Page 6) --- */}
      <section className="page relative">
        <div className="page-mark">
          <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={30}
              height={30}
              effect="deboss"/>
        </div>
        <h2>Evidence Log</h2>
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Artifact/Action</th><th>Standard Tested</th><th>Outcome/Evidence</th><th>Next Step</th></tr>
          </thead>
          <tbody>
            {Array.from({ length: 14 }).map((_, i) => (
              <tr key={i}><td><div className="table-line-fill"></div></td><td><div className="table-line-fill"></div></td><td><div className="table-line-fill"></div></td><td><div className="table-line-fill"></div></td><td><div className="table-line-fill"></div></td></tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* --- QUESTION BANK (Page 7) --- */}
      <section className="page relative">
        <div className="page-mark">
          <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={30}
              height={30}
              effect="deboss"/>
        </div>
        <h2>Question Bank</h2>
        <ul className="list">
          <li>"If it were gone tomorrow, what would remain true?"</li>
          <li>"What is the smallest proof that this works?"</li>
          <li>"What constraint—if honoured—would raise quality?"</li>
        </ul>
      </section>

      {/* --- A6 HANDOUTS (Page 8) --- */}
      <section className="page relative">
        <div className="page-mark">
          <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={30}
              height={30}
              effect="deboss"/>
        </div>
        <h2>A6 Handouts — Two-Up</h2>
        <p><strong>Mentor Card:</strong> cadence, red-flag list, "say no" script.</p>
        <p><strong>Mentee Card:</strong> weekly checklist, submission format, review criteria.</p>
      </section>

      <style jsx global>{`
        /* Define colors for reuse */
        :root {
          --color-primary: #0B2E1F; /* Dark Green */
          --color-secondary: #D4AF37; /* Gold/Brass accent */
        }

        @page { size: A4; margin: 18mm; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        .print-wrap {
          font: 11.5pt/1.55 var(--font-sans, Inter, system-ui);
          color: #333;
        }

        .page {
          break-after: page;
          padding: 0 0 10mm 0; /* Ensures content isn't flush with the bottom of the print margin */
          position: relative;
        }

        /* --- Cover Page Styles --- */
        .cover-page {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 250mm; /* Effectively centers content on the A4 page height */
        }
        .cover-logo {
            margin-bottom: 25mm;
        }
        .title {
          font: 700 28pt var(--font-serif, Georgia);
          color: var(--color-primary);
          margin: 0 0 4mm;
          text-align: center;
        }
        .lead {
          font: 400 12.5pt/1.7 var(--font-sans, Inter);
          max-width: 70ch;
          text-align: center;
        }
        .sigline {
          position: absolute;
          bottom: 18mm;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9pt;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 4px;
        }

        /* --- Internal Page Styles --- */
        .page-mark {
            position: absolute;
            top: 0;
            left: 0;
        }
        h2 {
          font: 700 16pt var(--font-serif, Georgia);
          color: var(--color-primary);
          margin: 0 0 6mm;
          padding-top: 10mm; /* Space for logo */
        }
        h3 {
          font: 600 12pt var(--font-serif, Georgia);
          margin: 5mm 0 3mm;
          color: var(--color-primary);
        }
        .list { padding-left: 4.5mm; }
        .list li { margin: 2.5mm 0; }

        /* --- Covenant Signature Styles --- */
        .sign-area {
            max-width: 80%;
        }
        .sign-area .sig-line {
            height: 1px;
            margin-bottom: 2mm;
        }
        .sign-area .text-sm {
            font-size: 10pt;
            color: #555;
        }

        /* --- Table Styles --- */
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10pt;
        }
        .table th, .table td {
          border: 0.4pt solid #e5e5e5;
          padding: 3mm;
          height: 10mm; /* Enforce row height for the log */
        }
        .table th {
          text-align: left;
          background: #fafaf5;
          color: var(--color-primary);
        }
        .table-line-fill { height: 100%; } /* Placeholder for content */
      `}</style>
    </main>
  );
}

