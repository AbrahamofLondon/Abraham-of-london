// pages/_app.tsx
import type { AppProps } from 'next/app';
import { ThemeProvider } from '../lib/ThemeContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;