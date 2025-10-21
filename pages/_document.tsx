// pages/_document.tsx  (only the font part shown)
const USE_LOCAL_FONTS =
  process.env.PDF_ON_CI === "1" ||
  process.env.PDF_ON_CI === "true" ||
  process.env.NEXT_PUBLIC_PDF_ON_CI === "1" ||
  process.env.NEXT_PUBLIC_PDF_ON_CI === "true";

<Head>
  {/* ... your theme no-flash script & meta ... */}

  {!USE_LOCAL_FONTS ? (
    // Online fonts (dev/prod when not exporting PDFs in CI)
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap"
        rel="stylesheet"
      />
    </>
  ) : (
    // Local fonts for CI/PDF export (perfect match to print)
    <>
      <link
        rel="preload"
        href="/fonts/Inter-Variable.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/PlayfairDisplay-Variable.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </>
  )}
</Head>
