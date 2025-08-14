// components/Header.tsx
import React from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
Â  return (
Â  Â  <header className="site-header">
Â  Â  Â  <nav className="container mx-auto flex justify-between items-center py-4">
Â  Â  Â  Â  <Link href="/" className="text-2xl font-display font-bold text-[var(--color-primary)]">
Â  Â  Â  Â  Â  Abraham of London
Â  Â  Â  Â  </Link>
Â  Â  Â  Â  <ul className="flex items-center space-x-4">
Â  Â  Â  Â  Â  <li><Link href="/about" className="hover:text-[var(--color-accent)]">About</Link></li>
Â  Â  Â  Â  Â  <li><Link href="/blog" className="hover:text-[var(--color-accent)]">Blog</Link></li>
Â  Â  Â  Â  Â  <li><Link href="/books" className="hover:text-[var(--color-accent)]">Books</Link></li>
Â  Â  Â  Â  Â  <li><Link href="/brands" className="hover:text-[var(--color-accent)]">Brands</Link></li>
Â  Â  Â  Â  Â  <li><Link href="/contact" className="hover:text-[var(--color-accent)]">Contact</Link></li>
Â  Â  Â  Â  Â  <li><ThemeToggle /></li>
Â  Â  Â  Â  </ul>
Â  Â  Â  </nav>
Â  Â  </header>
Â  );
};

export default Header;
