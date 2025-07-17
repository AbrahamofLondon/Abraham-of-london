// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en"> {/* You can customize the 'lang' attribute here */}
      <Head>
        {/*
          Add any custom <meta>, <link>, or <script> tags here that you want
          to be present in the <head> of your server-rendered HTML.
          For example, a Google Fonts link:
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
        */}
      </Head>
      <body>
        <Main /> {/* This is where your Next.js application will be mounted */}
        <NextScript /> {/* This handles Next.js scripts for hydration and client-side navigation */}
        {/*
          Add any scripts here that you want to be at the end of the <body>,
          e.g., for analytics or other third-party integrations.
        */}
      </body>
    </Html>
  );
}