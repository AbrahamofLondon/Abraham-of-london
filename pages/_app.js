// pages/_app.js

// Import Inter variable font from the dedicated variable font package
import '@fontsource-variable/inter/index.css';

// Import Geist Sans ONLY from its dedicated path
import { GeistSans } from 'geist/font/sans';
// Import Geist Mono ONLY from its dedicated path
import { GeistMono } from 'geist/font/mono'; // <--- Ensure this is 'geist/font/mono'

// Import your global CSS file, which includes Tailwind directives and custom styles.
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <main className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}