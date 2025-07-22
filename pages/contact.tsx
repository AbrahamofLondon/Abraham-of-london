// pages/contact.tsx
import React from 'react'; // Add this
import Layout from '../components/Layout'; // Adjust path as needed (should be '../components/Layout')

export default function Contact() {
  return (
    <Layout> {/* <--- Add Layout wrapper here */}
      <div className="max-w-4xl mx-auto py-20">
        <h1 className="text-4xl font-bold mb-4">Contact Abraham of London</h1>
        <p className="text-lg text-gray-600 mb-6">
          For business inquiries, collaborations, or speaking engagements, reach out via:
        </p>
        <ul className="space-y-3">
          <li>Email: <a href="mailto:contact@abrahamoflondon.org" className="text-blue-600 hover:underline">contact@abrahamoflondon.com</a></li>
          <li>Phone: +44 20 86225909</li>
          <li>Location: London, United Kingdom</li>
        </ul>
      </div>
    </Layout> {/* <--- Close Layout here */}
  );
}