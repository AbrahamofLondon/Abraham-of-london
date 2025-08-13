// components/Header.tsx
import React from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  return (
    <header className="site-header">
      <nav className="container mx-auto flex justify-between items-center py-4">
        <Link href="/" className="text-2xl font-display font-bold text-[var(--color-primary)]">
          Abraham of London
        </Link>
        <ul className="flex items-center space-x-4">
          <li><Link href="/about" className="hover:text-[var(--color-accent)]">About</Link></li>
          <li><Link href="/blog" className="hover:text-[var(--color-accent)]">Blog</Link></li>
          <li><Link href="/books" className="hover:text-[var(--color-accent)]">Books</Link></li>
          <li><Link href="/brands" className="hover:text-[var(--color-accent)]">Brands</Link></li>
          <li><Link href="/contact" className="hover:text-[var(--color-accent)]">Contact</Link></li>
          <li><ThemeToggle /></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;