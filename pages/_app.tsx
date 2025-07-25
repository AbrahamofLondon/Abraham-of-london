// pages/_app.tsx
import type { AppProps } from 'next/app';
import '../styles/globals.css'; // Your global styles

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />; // Renders the specific page component
}

export default MyApp;