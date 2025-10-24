// scripts/print-manifest.mjs
/**
 * Manifest of print routes → target PDFs in /public/downloads.
 * Only include *real* premium docs derived from your print pages.
 *
 * format: A4 unless overridden; preferCSSPageSize allows @page rules in your TSX.
 */
export const docs = [
  // ——— A6 two-up cards on A4 ———
  {
    route: "/print/a6/leaders-cue-card-two-up",
    out: "leaders-cue-card-two-up.pdf",
    options: { format: "A4", landscape: false, margin: { top: "6mm", right: "6mm", bottom: "6mm", left: "6mm" } },
  },
  {
    route: "/print/a6/brotherhood-cue-card-two-up",
    out: "brotherhood-cue-card-two-up.pdf",
    options: { format: "A4", landscape: false, margin: { top: "6mm", right: "6mm", bottom: "6mm", left: "6mm" } },
  },

  // ——— Covenant & liturgy ———
  { route: "/print/brotherhood-covenant", out: "brotherhood-covenant.pdf" },
  { route: "/print/family-altar-liturgy", out: "family-altar-liturgy.pdf" },
  { route: "/print/scripture-track-john14", out: "scripture-track-john14.pdf" },

  // ——— Formation kits & playbooks ———
  { route: "/print/mentorship-starter-kit", out: "mentorship-starter-kit.pdf" },
  { route: "/print/leadership-playbook", out: "leadership-playbook.pdf" },
  { route: "/print/weekly-operating-rhythm", out: "weekly-operating-rhythm.pdf" },

  // ——— Fathering Without Fear teaser (A4 & Mobile) ———
  { route: "/print/fathering-without-fear-teaser", out: "fathering-without-fear-teaser-a4.pdf" },
  { route: "/print/fathering-without-fear-teaser-mobile", out: "fathering-without-fear-teaser-mobile.pdf" },

  // ——— Principles for My Son (sheet + cue card) ———
  { route: "/print/principles-for-my-son", out: "principles-for-my-son.pdf" },
  { route: "/print/principles-for-my-son-cue-card", out: "principles-for-my-son-cue-card.pdf" },

  // ——— Optional: add when route exists ———
  // { route: "/print/entrepreneur-operating-pack", out: "entrepreneur-operating-pack.pdf" },
];
