/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */ // <-- Added to silence the Next.js image warning
// pages/print/fathering-without-fear-teaser.tsx
import Head from "next/head";

const COVER = "/assets/images/books/fathering-without-fear-cover.jpg";
const BRAND_LINE = "© 2025 Abraham of London • abrahamoflondon.org";

export default function FatheringWithoutFearTeaserA4() {
  return (
    <>
      <Head>
        <title>Fathering Without Fear — Teaser (A4)</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="print-root">
        {/* COVER (full-bleed) */}
        <section className="page cover-page relative isolate text-cream">
          <div className="absolute inset-0 -z-10">
            {/* The <img> that was triggering the warning */}
            <img src={COVER} alt="" className="h-full w-full object-cover opacity-90" />
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(55% 55% at 50% 60%, rgba(212,175,55,.55), transparent 60%)",
                mixBlendMode: "soft-light",
              }}
            />
            <div className="absolute inset-0 bg-[rgba(0,0,0,.35)]" />
          </div>

          <div className="flex h-full flex-col justify-between p-[20mm]">
            <div />
            <header>
              <p className="mb-3 text-[12pt] tracking-[.18em] text-[color:var(--color-accent)]">FATHERING&nbsp;WITHOUT&nbsp;FEAR</p>
              <h1 className="font-serif leading-[1.04] text-[42pt] tracking-[-.01em]">A Memoir That Defies Every Boundary</h1>
              <p className="mt-4 max-w-[150mm] text-[12pt] italic text-[color:var(--color-on-primary)/0.9]">
                “They thought they knew the story. He chose to stay.”
              </p>
            </header>
            <footer className="flex items-end justify-between text-[10pt] text-[color:var(--color-on-primary)/0.85]">
              <span />
              <span>{BRAND_LINE}</span>
            </footer>
          </div>
        </section>

        {/* PAGE 1 — Title page */}
        <section className="page">
          <h2 className="eyebrow">FATHERING WITHOUT FEAR — TEASER PACK</h2>
          <hr className="rule" />
          <p className="lead mt-6">A Memoir That Defies Every Boundary</p>
          <div className="foot smallprint">{BRAND_LINE}</div>
        </section>

        {/* PAGE 2 — Author’s Reflection / Dedication */}
        <section className="page">
          <h3 className="section">AUTHOR’S REFLECTION</h3>
          <p className="dropcap">
            I may not know your pain. I may not have walked your roads. But I have walked a path many cannot imagine. I have one
            message: God always has a purpose and a plan—for all people, in all places. If we dare to trust His love, power, and
            wisdom, He is able to do exceedingly, abundantly above all we ask or even imagine. That is why… something always
            happens.
          </p>

          <h3 className="section mt-8">DEDICATION</h3>
          <p>
            To the memory of my father, David Akindele Adaramola—a teacher in Ayetoro who welcomed the gift of triplets and never
            scorned the battle. From day one, he fought for us and gave his life to help others.
          </p>
          <p>
            To David Olaleye Adaramola, Olajumoke Adaramola, Foluke Akinlabi, and every friend and family member who became a
            blessing of love and hope. You left not when I was ready, but when God was.
          </p>
          <p>
            I wish I had heeded my father’s call sooner—to tend my own soul. I do so now, through self-examination and by doing what
            he loved: helping those who seem to have nothing to give back, but who are worth every labour of love. May we make the
            world better, one person at a time, by making something happen for one another.
          </p>
          <div className="foot smallprint">{BRAND_LINE}</div>
        </section>

        {/* PAGE 3 — Back cover / Landing hero */}
        <section className="page">
          <h3 className="section">BACK COVER / LANDING HERO</h3>
          <p className="pull">“If You give me my life back, I’ll serve You until I’m seventy-five.”</p>
          <p>The prayer of an eight-year-old who died… and came back. Some promises cost more than you know.</p>

          <ul className="bullets">
            <li>
              <strong>THEY CALLED US THE MIRACLE TRIPLETS.</strong> Born at 27 weeks in 1977 Lagos. Too early. Too poor. Too
              impossible. Three became two. Two became legend. But legends have a price.
            </li>
            <li>
              <strong>LAGOS. AKURE. LONDON.</strong> Three cities. Three fires. Three chances to disappear. He survived them all. Not
              everyone did.
            </li>
            <li>
              “Something always happens.” David said it when hope felt like a lie—until 2003, when he could not say it anymore. A
              brother’s voice became a ghost he could not stop hearing; the words became prophecy.
            </li>
          </ul>

          <h4 className="subhead mt-5">What they don’t tell you about miracles:</h4>
          <ul className="bullets">
            <li>They attract darkness like light attracts moths.</li>
            <li>They make you a target for things you cannot see.</li>
            <li>They cost people you cannot afford to lose.</li>
          </ul>
          <ul className="dashes">
            <li>A grandmother who spoke to spirits.</li>
            <li>A sister’s death that opened visions.</li>
            <li>A romance that nearly killed him.</li>
            <li>A marriage that tried to erase him.</li>
            <li>A son he still fights to father.</li>
            <li>A brother whose last words echo in the silence.</li>
          </ul>
          <div className="foot smallprint">{BRAND_LINE}</div>
        </section>

        {/* PAGE 4 — Hook */}
        <section className="page">
          <p className="lead">
            “Where was God when David died?” The question that broke his faith, forged his purpose, and led him to a London
            courtroom—fighting for a son who carries the name of kings, against a system designed to make fathers disappear.
          </p>
          <p>
            Some stories choose you. This one chose him at birth, marked him at eight, nearly destroyed him at thirty—and will not
            let him go. This isn’t survival. It’s resurrection. Because when the world says “finished,” grace says, “Something always
            happens.”
          </p>

          <div className="id-card mt-6">
            <p className="id-head">ABRAHAM OF LONDON</p>
            <p>Miracle child. Marked man. Devoted father. The brother who remembers. The father who refuses to disappear.</p>
          </div>
          <div className="foot smallprint">{BRAND_LINE}</div>
        </section>

        {/* PAGE 5 — Retailer description */}
        <section className="page">
          <h3 className="section">RETAILER DESCRIPTION</h3>
          <p>
            Fathering Without Fear is the true story of a miracle child from 1977 Lagos who grows into a father fighting for his
            British son in London’s legal labyrinth. Abraham’s life unfolds in three cities—Lagos, Akure, London—through loss and
            unexplainable mercy: triplet birth at 27 weeks, siblings and friends buried, visions that won’t let him sleep, and rooms
            where decisions are made without him.
          </p>
          <p>
            When a marriage turns battleground and immigration rules strip his right to work, he faces a system that prefers quiet
            fathers. Instead of folding, he fights—with strategy and Scripture. In these pages you’ll find spiritual warfare and
            paperwork, grief and grit, a father’s love and a blueprint for men under pressure. This is a memoir for the
            underestimated and the faithful; a field guide for anyone who needs language and structure when life hits too hard.
          </p>
          <p>
            At the center is a question that won’t leave him alone: “Where was God when David died?” The answer is not an argument but
            a life—documenting facts, governing emotions, keeping boundaries, refusing online rage, and building legacy over
            litigation.
          </p>
          <p>
            If you’ve ever been misread, delayed, or told to disappear, this book is your brother at the door. It won’t flatter you.
            It will steady you. Because fear is loud, but grace is louder. And when fear says “stop,” grace answers: “Something always
            happens.”
          </p>
          <div className="foot smallprint">{BRAND_LINE}</div>
        </section>

        {/* PAGE 6 — One-page synopsis */}
        <section className="page">
          <h3 className="section">ONE-PAGE SYNOPSIS</h3>
          <p>
            Fathering Without Fear is the spiritually grounded memoir of Abraham of London—a miracle child turned kingdom-minded
            strategist and father navigating the overlap of spiritual warfare, systemic injustice, and private heartbreak.
          </p>
          <p>
            From a celebrated triplet birth in 1977 Lagos to formative awakenings in Akure, Abraham’s story is shaped by early losses,
            a grandmother’s prophetic influence, and a stubborn faith that will not be bullied. University politics sharpen his voice;
            a ruinous romance and a complex marriage test his soul. Moving to the UK, he enters a long season of constraint—denied
            work, barred from public funds, and dragged into a legal maze while fighting to father his son.
          </p>
          <p>
            The memoir threads court corridors and prayer closets into one line: a man who refuses to disappear. Instead of spectacle,
            he chooses structure: documentation over detonation, boundaries over bitterness, presence over performance. The book closes
            not with a victory lap but with a strategy for legacy—how fathers can build altars at home under hostile weather, and how
            men can walk with God when the question “Where was God when David died?” will not let them sleep.
          </p>
          <p>
            This is a father’s letter, a spiritual blueprint, and a defiant hope. He did not stay by luck. He stayed by grace. And
            because something always happens—so does he.
          </p>
          <div className="foot smallprint">{BRAND_LINE}</div>
        </section>

        {/* PAGE 7 — Excerpt + Reader Promise / CTA */}
        <section className="page">
          <h3 className="section">EXCERPT — CH. 18 “THE COST OF BEING NICE”</h3>
          <p>
            The strange thing about suffering is that it doesn’t always announce itself with noise. Sometimes, it arrives
            quietly—through policies, delays, bureaucratic silence.
          </p>
          <p>
            After the marriage ended and fatherhood began, I faced a new kind of enemy: the state’s indifference. My immigration
            status, once stable, suddenly became a trapdoor. I was in the UK legally—but barely. The ability to work, to provide, to
            breathe financially—stripped away.
          </p>
          <p>
            I had made a desperate, procedural mistake: a fee-waiver placeholder turned to void. And I was stuck. For nearly two
            years, I waited for a decision. Two years unable to work. Two years without access to public funds. Two years watching
            bills pile up while holding back tears.
          </p>
          <p>
            I wrote to MPs. I gathered evidence. I made applications. I received silence—until I received requests for the same
            evidence I had already provided. Prove the address. Prove the contact. Prove the court order. So I complied. Again.
          </p>
          <p>
            Emails. Court rulings. Contact reports. Hospital records. Photos. Timelines. All to satisfy a process that felt built to
            delay, confuse, and break. Meanwhile, I watched my son grow through the narrowest of lenses—prayer, restraint, and a faith
            that refused to crack.
          </p>
          <p>People say the system is broken. I say: the system works exactly as designed—for men like me, it delays until you disappear.</p>
          <p>
            But I did not disappear. I wrote. I prayed. I fought. I drafted letters. Learned judicial review. Turned frustration into
            fuel. Because being a good man—especially a Black father, a foreigner, a truth-teller—will cost you. But it must not
            destroy you. That’s why I keep standing. Because good men must stop disappearing—even when systems want them to.
          </p>

          <hr className="rule my-6" />
          <h3 className="section">READER PROMISE (WHY THIS BOOK MATTERS NOW)</h3>
          <ul className="bullets">
            <li>Language for pain. Words that hold when life hits too hard.</li>
            <li>A father’s blueprint. Prayer and paperwork; courage and cadence.</li>
            <li>A stubborn hope. Not naïve—earned. Not loud—enduring.</li>
          </ul>
          <p className="callout">
            You are not a case number. You are a father, a son, a steward. When fear says “stop,” grace says, “Something always
            happens.”
          </p>
          <p className="smallprint mt-2">
            Read the opening chapters free • Share this teaser with one father under pressure • Join the launch list. Prefer offline?
            Get the print-ready teaser at <strong>abrahamoflondon.org/downloads</strong>
          </p>
          <div className="foot smallprint">{BRAND_LINE}</div>
        </section>
      </main>

      {/* Page styles for A4 */}
      <style jsx global>{`
        @page { size: A4; margin: 14mm; }
        html, body { background: #fff; }
        .print-root { font: 11pt/1.65 var(--font-serif, Georgia, Cambria, "Times New Roman", Times, serif); color: var(--color-on-secondary); }
        .page { page-break-after: always; min-height: calc(297mm - 28mm); display: flex; flex-direction: column; gap: 6mm; }
        .page > * { max-width: 72ch; margin-inline: auto; }
        .cover-page { min-height: calc(297mm - 28mm); }
        .eyebrow { letter-spacing: .18em; text-transform: uppercase; color: var(--color-accent); font: 600 11pt/1.2 var(--font-sans, system-ui); }
        .rule { border: none; height: 2px; background: linear-gradient(to right, color-mix(in oklab, var(--color-accent) 90%, #fff), transparent 65%); }
        .lead { font-size: 14pt; line-height: 1.8; }
        .dropcap::first-letter { float: left; font: 700 44pt/0.9 var(--font-serif, Georgia); color: var(--color-primary); padding-right: 6mm; margin-top: 3mm; }
        .section { font: 700 16pt/1.2 var(--font-serif, Georgia); color: var(--color-primary); margin: 0; }
        .subhead { font: 700 12.5pt/1.3 var(--font-serif, Georgia); color: var(--color-primary); }
        .bullets { margin: 2mm 0; padding-left: 5mm; }
        .bullets > li { margin: 1.5mm 0; }
        .dashes { margin: 2mm 0; padding-left: 6mm; list-style: "— "; }
        .pull { border-left: 2px solid var(--color-accent); padding-left: 4mm; font-style: italic; color: var(--color-primary); }
        .id-card { border: 1px solid var(--color-lightGrey); background: var(--color-warmWhite); border-radius: 6px; padding: 6mm; }
        .id-head { font-weight: 700; color: var(--color-primary); margin-bottom: 2mm; letter-spacing: .02em; }
        .callout { border: 1px solid var(--color-accent); background: color-mix(in oklab, var(--color-accent) 8%, white); border-radius: 6px; padding: 4mm; }
        .smallprint { font: 9.5pt/1.5 var(--font-sans, system-ui); opacity: .9; }
        .foot { margin-top: auto; }
      `}</style>
    </>
  );
}