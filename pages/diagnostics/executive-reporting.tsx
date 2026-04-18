// Canonical public Executive Reporting entry.
// The real instrument lives in the run module; this route intentionally renders
// that intake directly so /diagnostics/executive-reporting is not a teaser,
// admin launcher, or gated placeholder.

export { default, getServerSideProps } from "./executive-reporting/run";
