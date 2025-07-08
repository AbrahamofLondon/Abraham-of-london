// src/app/layout.tsx
import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css'; // Your global styles
import Navbar from '../components/Navbar'; // Import the Navbar component

// Configure your fonts
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

// Metadata for the entire site
export const metadata: Metadata = {
  title: 'Fathering Without Fear',
  description: 'The official website for Abraham of London and Fathering Without Fear: The Story They Thought They Knew. Courage. Truth. Redemption.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body>
        <Navbar /> {/* Render the Navbar at the top of every page */}
        <div className="pt-[76px]"> {/* Add padding-top equal to navbar height to prevent content from going under it */}
          {children} {/* This prop renders the content of the current page (e.g., page.tsx, about/page.tsx, etc.) */}
        </div>

        {/* Global Footer (Moved here for consistency) */}
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
              {/* Social Media Icons (re-using placeholders from footer) */}
              <Link href="#" aria-label="Facebook" className="hover:text-warm-gold transition-colors duration-200">FB</Link>
              <Link href="#" aria-label="Twitter" className="hover:text-warm-gold transition-colors duration-200">TW</Link>
              <Link href="#" aria-label="Instagram" className="hover:text-warm-gold transition-colors duration-200">IG</Link>
              <Link href="#" aria-label="LinkedIn" className="hover:text-warm-gold transition-colors duration-200">LI</Link>
            </div>
            <div className="text-sm">
              © {new Date().getFullYear()} Fathering Without Fear. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}