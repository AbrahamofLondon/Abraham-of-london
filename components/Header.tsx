// components/Header.tsx
import React from 'react';
import Link from 'next/link'; // Import Link for Next.js navigation

const Header: React.FC = () => {
  return (
    <header className="bg-primary text-cream py-4">
      <nav className="container flex justify-between items-center">
        <Link href="/" className="text-2xl font-display font-bold">
          Abraham of London
        </Link>
        <ul className="flex space-x-4">
          <li><Link href="/about" className="hover:text-gold">About</Link></li>
          <li><Link href="/blog" className="hover:text-gold">Blog</Link></li>
          <li><Link href="/books" className="hover:text-gold">Books</Link></li>
          <li><Link href="/brands" className="hover:text-gold">Brands</Link></li>
          <li><Link href="/contact" className="hover:text-gold">Contact</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header; // Export as default for consistency and correct import