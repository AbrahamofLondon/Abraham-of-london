'use client'; // Required for interactivity in static export

import { useEffect } from 'react';

export default function MobileMenu() {
  useEffect(() => {
    // Mobile menu toggle logic
    const toggleMenu = () => {
      document.querySelector('.mobile-menu')?.classList.toggle('hidden');
    };

    document.querySelector('.mobile-menu-button')?.addEventListener('click', toggleMenu);

    return () => {
      // Cleanup
      document.querySelector('.mobile-menu-button')?.removeEventListener('click', toggleMenu);
    };
  }, []);

  return null; // Or your JSX
}