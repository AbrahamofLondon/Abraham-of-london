// components/Footer.tsx
import React, { useState, useEffect } from 'react';

const Footer: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="site-footer">
      <div className="container mx-auto px-4">
        <p>&copy; {year} Abraham of London. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;