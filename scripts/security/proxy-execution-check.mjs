#!/usr/bin/env node

const targetUrl = (process.env.TARGET_URL || "http://localhost:3199").replace(/\/$/, "");

async function main() {
  const pdfUrl = `${targetUrl}/assets/downloads/decision-exposure-instrument.pdf`;
  const res = await fetch(pdfUrl, { redirect: "manual" });

  console.log(`status=${res.status}`);
  console.log(`location=${res.headers.get("location") || ""}`);
  console.log(`x-frame-options=${res.headers.get("x-frame-options") || ""}`);
  console.log(`x-content-type-options=${res.headers.get("x-content-type-options") || ""}`);

  const redirectedToCanonical =
    res.status === 307 &&
    (res.headers.get("location") || "").includes("/api/downloads/decision-exposure-instrument");

  if (!redirectedToCanonical) {
    console.error("Proxy execution proof failed");
    process.exit(1);
  }

  console.log("Proxy execution proof passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
