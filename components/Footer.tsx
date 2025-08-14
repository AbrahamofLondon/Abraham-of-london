// components/Footer.tsx
import React, { useState, useEffect } from 'react';

const Footer: React.FC = () => {
Â  const [year, setYear] = useState(new Date().getFullYear());

Â  useEffect(() => {
Â  Â  setYear(new Date().getFullYear());
Â  }, []);

Â  return (
Â  Â  <footer className="site-footer">
Â  Â  Â  <div className="container mx-auto px-4">
Â  Â  Â  Â  <p>&copy; {year} Abraham of London. All rights reserved.</p>
Â  Â  Â  </div>
Â  Â  </footer>
Â  );
};

export default Footer;
