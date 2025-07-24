// pages/_app.js
import '../styles/global.css'; // Assuming your global styles are here
import Layout from '../components/Layout'; // Import your Layout component

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;