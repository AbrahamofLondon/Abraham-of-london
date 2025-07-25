import '../styles/globals.css';
import type { AppProps } from 'next/app'; // <--- Import AppProps
import Layout from '../components/Layout';

// Function component for your App
function MyApp({ Component, pageProps }: AppProps) { // <--- Add AppProps type here
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;