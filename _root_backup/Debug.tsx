'use client';

import { useEffect } from 'react';

export default function Debug() {
  useEffect(() => {
    console.group('ℹ️ Debug Information');
    console.log('Mobile Menu Button:', document.querySelector('.mobile-menu-button'));
    console.log('Accordion Items:', document.querySelectorAll('.accordion-question').length);
    console.log('Current Breakpoint:', window.getComputedStyle(document.body, ':after').content);
    console.groupEnd();

    return () => {
      console.log('Debug component unmounted');
    };
  }, []);

  return null;
}