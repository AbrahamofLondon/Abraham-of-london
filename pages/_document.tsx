import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* CORRECTED: Favicon paths matching your actual file structure */}
        <link rel="icon" href="/favicon/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon/icon0.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/icon1.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-icon.png" />
        <link rel="manifest" href="/favicon/manifest.json" />

        {/* Additional meta tags for better browser support */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}