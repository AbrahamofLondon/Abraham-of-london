import React from 'react'; // Add this
import Image from 'next/image';
import Layout from '../components/Layout'; // Adjust path as needed (should be '../components/Layout')

export default function Brands() {
  return (
    <Layout> {/* <--- Add Layout wrapper here */}
      <div className="max-w-4xl mx-auto py-20">
        <h1 className="text-4xl font-bold mb-6">The Abraham of London Ecosystem</h1>
        <p className="text-lg text-gray-600 mb-6">
          Abraham of London is the superbrand—a vessel of philosophy, vision, and transformative expression across industries and societies.
          The brands and projects that emerge from it serve as dynamic platforms to communicate legacy, values, and purposeful creativity.
        </p>
        {/* ... rest of your brands content ... */}
      </div>
    </Layout> {/* <--- Close Layout here */}
  );
}