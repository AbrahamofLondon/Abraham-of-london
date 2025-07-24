// pages/_app.js
import '../styles/globals.css';
import Layout from '../components/Layout'; // This will now definitively resolve to Layout.tsx

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;