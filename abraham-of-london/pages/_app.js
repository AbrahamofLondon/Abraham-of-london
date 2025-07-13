// pages/_app.js

import { geistSans, geistMono } from '../lib/fonts'; // Keep this import for now

function MyApp({ Component, pageProps }) {
  return (
    // Temporarily remove or comment out the className prop
    <main> {/* NO className here */}
      <Component {...pageProps} />
    </main>
  );
}

export default MyApp;