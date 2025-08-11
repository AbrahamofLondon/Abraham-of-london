import React, { useState, useEffect } from 'react';

const Footer: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-gray-800 text-white py-8 text-center">
      <div className="container mx-auto px-4">
        <p>&copy; {year} Abraham of London. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;