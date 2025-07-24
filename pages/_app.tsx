 // pages/_app.tsx
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import '../styles/globals.css'; // Adjust if needed

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}