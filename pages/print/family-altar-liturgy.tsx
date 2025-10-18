// pages/print/family-altar-liturgy.tsx
import * as React from "react";
import Head from "next/head";

/**
 * Family Altar Liturgy — 2 pages (A4 portrait)
 * - Gentle, simple call/response; formation-forward; print-safe.
 * - Page 1: Opening, Scripture, Confession & Assurance, Household Creed.
 * - Page 2: Intercessions (weekly cycle), The Lord’s Prayer (ecumenical form),
 *           micro-commitments + signatures, closing blessing.
 */
export default function FamilyAltarLiturgy() {
  return (
    <main>
      <Head>
        <title>Family Altar Liturgy — Print</title>
        <meta name="robots" content="noindex" />
        <style>{PRINT_CSS}</style>
      </Head>

      {/* PAGE 1 */}
      <section className="page">
        <header className="page-hdr">
          <div className="brand">Abraham of London</div>
          <h1 className="title">Family Altar Liturgy</h1>
          <p className="sub">A simple, gentle rhythm for households and small groups</p>
        </header>

        {/* Opening */}
        <div className="block">
          <h2 className="h2">Opening</h2>
          <div className="lit">
            <p><span className="role">Leader</span> Grace and peace to this house.</p>
            <p><span className="role">All</span> We welcome God’s presence and keep His ways.</p>
            <p><span className="role">Leader</span> We show up with honest hearts and steady hands.</p>
            <p><span className="role">All</span> We choose truth, courage, and love.</p>
          </div>
        </div>

        {/* Scripture — choose one short verse / passage */}
        <div className="block">
          <h2 className="h2">Scripture</h2>
          <p className="muted small">
            (Option: a short psalm or gospel line; one example is provided below. Use any faithful translation.)
          </p>
          <div className="card">
            <p className="scripture">
              “The Lord is my shepherd; I shall not want.” — Psalm 23:1
            </p>
            <ol className="qs">
              <li>What word or line stood out to you today?</li>
              <li>Where is God inviting us to trust or act?</li>
            </ol>
          </div>
        </div>

        {/* Confession & Assurance */}
        <div className="block grid2">
          <div>
            <h2 className="h2">Confession</h2>
            <div className="lit">
              <p><span className="role">All</span> Father, we confess our distractions and delay.</p>
              <p><span className="role">All</span> Forgive our harsh words and hurried hearts.</p>
              <p><span className="role">All</span> Renew our minds; steady our steps.</p>
            </div>
          </div>
          <div>
            <h2 className="h2">Assurance</h2>
            <div className="lit">
              <p><span className="role">Leader</span> In Christ we are forgiven and set free to love.</p>
              <p><span className="role">All</span> Thanks be to God.</p>
            </div>
          </div>
        </div>

        {/* Household Creed */}
        <div className="block">
          <h2 className="h2">Household Creed</h2>
          <ul className="ticks">
            <li>We keep a steady presence and speak the truth in love.</li>
            <li>We protect dignity, resist gossip, and repair quickly.</li>
            <li>We practice small faithful steps—work, prayer, and service.</li>
            <li>We honour one another; we bless our neighbours.</li>
          </ul>
        </div>

        <footer className="page-ftr">
          <div className="note">Page 1 of 2</div>
          <div className="rule" />
        </footer>
      </section>

      {/* PAGE 2 */}
      <section className="page">
        {/* Intercessions */}
        <div className="block">
          <h2 className="h2">Intercessions (Weekly Cycle)</h2>
          <p className="muted small">Name specific people and needs; keep notes for follow-up.</p>
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Focus</th>
                <th>Names / Needs</th>
                <th>One Next Step</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mon</td>
                <td>Household &amp; Marriage</td>
                <td />
                <td />
              </tr>
              <tr>
                <td>Tue</td>
                <td>Children &amp; Formation</td>
                <td />
                <td />
              </tr>
              <tr>
                <td>Wed</td>
                <td>Work &amp; Provision</td>
                <td />
                <td />
              </tr>
              <tr>
                <td>Thu</td>
                <td>Church &amp; Community</td>
                <td />
                <td />
              </tr>
              <tr>
                <td>Fri</td>
                <td>City, Nation &amp; Justice</td>
                <td />
                <td />
              </tr>
              <tr>
                <td>Weekend</td>
                <td>Friends, Elderly &amp; Lonely</td>
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        {/* The Lord's Prayer (ecumenical) */}
        <div className="block">
          <h2 className="h2">The Lord’s Prayer</h2>
          <div className="lit prayer">
            <p>Our Father in heaven,</p>
            <p>hallowed be your Name,</p>
            <p>your kingdom come, your will be done, on earth as in heaven.</p>
            <p>Give us today our daily bread.</p>
            <p>Forgive us our sins as we forgive those who sin against us.</p>
            <p>Lead us not into temptation but deliver us from evil.</p>
            <p>For the kingdom, the power, and the glory are yours, now and for ever. Amen.</p>
          </div>
        </div>

        {/* Commitments + Signatures */}
        <div className="block">
          <h2 className="h2">Micro-Commitments (This Week)</h2>
          <p className="muted small">Each person: one small, concrete step. Keepable > grand.</p>
          <div className="commit-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="commit" key={i}>
                <div className="row"><span className="lbl">Name</span><span className="line" /></div>
                <div className="row"><span className="lbl">Step</span><span className="line wide" /></div>
                <div className="row"><span className="lbl">By</span><span className="line" /></div>
                <div className="row"><span className="lbl">Witness</span><span className="line" /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div className="block">
          <h2 className="h2">Closing Blessing</h2>
          <div className="lit">
            <p><span className="role">Leader</span> Go in peace; keep the code: presence, truth, courage, protection, and production.</p>
            <p><span className="role">All</span> We will show up in love and serve with steady hands.</p>
          </div>
        </div>

        <footer className="page-ftr">
          <div className="rule" />
          <div className="brandline">
            <span>abrahamoflondon.org</span>
            <span>•</span>
            <span>Family Altar Liturgy</span>
          </div>
          <div className="note">Page 2 of 2</div>
        </footer>
      </section>
    </main>
  );
}

const PRINT_CSS = `
@page { size: A4 portrait; margin: 12mm; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }

:root{
  --ink:#121417; --muted:#5f6570; --rule:#E7EAEE; --soft:#FAFAFB; --accent:#2C6E49;
}

*{ box-sizing: border-box; }
html,body{ margin:0; color:var(--ink); font: 10.75pt/1.5 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif; }

.page{
  display:flex; flex-direction:column; gap:10mm;
  min-height: calc(297mm - 24mm); /* A4 minus margins */
  page-break-after: always;
}

.page-hdr{ text-align:center; }
.page-hdr .brand{ font-size:9pt; color:var(--muted); letter-spacing:.12em; text-transform:uppercase; }
.page-hdr .title{ margin:.8mm 0 0; font-size:18pt; font-weight:800; }
.page-hdr .sub{ margin:.6mm 0 0; color:var(--muted); }

.block{ border-top:1px solid var(--rule); padding-top:4.5mm; }
.h2{ font-size:12pt; font-weight:700; margin:0 0 2.5mm; }
.muted{ color:var(--muted); }
.small{ font-size:9pt; }

.lit p{ margin:1.6mm 0; }
.lit .role{
  display:inline-block; min-width:22mm; font-weight:700; color:var(--accent);
}
.card{
  background:var(--soft); border:1px solid var(--rule); border-radius:6px;
  padding:4mm 5mm; margin-top:1mm;
}
.scripture{ margin:0; font-style:italic; }
.qs{ margin:3mm 0 0; padding-left:4.5mm; }
.qs li{ margin:1mm 0; }

.grid2{ display:grid; grid-template-columns:1fr 1fr; gap:6mm; }

.ticks{ margin:0; padding-left:4.5mm; }
.ticks li{ margin:1.6mm 0; }

.table{ width:100%; border-collapse:collapse; }
.table th, .table td{
  border:1px solid var(--rule); padding:2.2mm 2.8mm; vertical-align:top;
}
.table thead th{ background:#fbfbfc; text-align:left; }

.prayer p{ margin:1.2mm 0; }

.commit-grid{
  display:grid; grid-template-columns:1fr 1fr; gap:4mm;
}
.commit{
  border:1px dashed var(--rule); border-radius:6px; padding:3mm 3.5mm;
}
.commit .row{
  display:grid; grid-template-columns:18mm 1fr; align-items:center; gap:3mm; margin:2.2mm 0;
}
.commit .lbl{ font-size:9pt; color:var(--muted); }
.commit .line{
  display:block; border-bottom:1px solid #cfd5df; height:7mm;
}
.commit .line.wide{ height:12mm; }

.page-ftr{ margin-top:auto; display:flex; align-items:center; gap:4mm; }
.page-ftr .rule{ height:1px; background:var(--rule); flex:1; }
.brandline{ display:flex; gap:3mm; color:var(--muted); font-size:9pt; }
.note{ color:var(--muted); font-size:9pt; }

@media screen{
  body{ background:#f4f5f7; }
  .page{ background:#fff; max-width:210mm; margin:12mm auto; padding:0 0 2mm; box-shadow:0 8px 24px rgba(0,0,0,.06); }
}
`;
