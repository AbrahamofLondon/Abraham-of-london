// components/FontLoader.js or similar
import { useEffect, useState } from 'react';

export default function FontLoader() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Check if fonts are already loaded
    if (document.fonts) {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
        document.documentElement.classList.add('fonts-loaded');
      });
    } else {
      // Fallback
      setTimeout(() => {
        setFontsLoaded(true);
        document.documentElement.classList.add('fonts-loaded');
      }, 1000);
    }
  }, []);

  return null; // This component doesn't render anything
}