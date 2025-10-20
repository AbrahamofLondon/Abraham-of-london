import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import Link from 'next/link'; // ✅ ADD THIS LINE
import './globals.css';
import Navbar from '../components/Navbar';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fathering Without Fear',
  description:
    'The official website for Abraham of London and Fathering Without Fear: The Story They Thought They Knew. Courage. Truth. Redemption.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();

  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body>
        <Navbar />
        <div className="pt-[76px]">
          {children}
        </div>

        <footer className="py-12 bg-neutral-dark text-gray-400">
          <div className="container-custom flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-8 md:space-y-0">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              <Link href="/" className="hover:text-warm-gold transition-colors duration-200">Home</Link>
              <Link href="/about" className="hover:text-warm-gold transition-colors duration-200">About</Link>
              <Link href="/books" className="hover:text-warm-gold transition-colors duration-200">Books</Link>
              <Link href="/blog" className="hover:text-warm-gold transition-colors duration-200">Blog</Link>
              <Link href="/contact" className="hover:text-warm-gold transition-colors duration-200">Contact</Link>
            </div>
            <div className="flex gap-6 text-2xl">
              <Link href="#" aria-label="Facebook" className="hover:text-warm-gold transition-colors duration-200">FB</Link>
              <Link href="#" aria-label="Twitter" className="hover:text-warm-gold transition-colors duration-200">TW</Link>
              <Link href="#" aria-label="Instagram" className="hover:text-warm-gold transition-colors duration-200">IG</Link>
              <Link href="#" aria-label="LinkedIn" className="hover:text-warm-gold transition-colors duration-200">LI</Link>
            </div>
            <div className="text-sm">
              © {year} Fathering Without Fear. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
