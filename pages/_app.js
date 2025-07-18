// pages/_app.js

import '@fontsource-variable/inter/index.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

// Your global CSS file - this is where Tailwind's output will come from
import '../styles/globals.css';

// Import your Navbar component
import Navbar from '../components/Navbar';

export default function MyApp({ Component, pageProps }) {
  return (
    <div className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <Navbar /> {/* This will now correctly render your Navbar */}
      <main>
        <Component {...pageProps} />
      </main>
    </div>
  );
}