import '@fontsource-variable/inter/index.css';
import '../styles/globals.css';
import Navbar from '../components/Navbar.tsx'; // match file extension

export default function MyApp({ Component, pageProps }) {
  return (
    <div>
      <Navbar />
      <main>
        <Component {...pageProps} />
      </main>
    </div>
  );
}