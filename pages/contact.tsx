// pages/contact.tsx

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto py-20">
      <h1 className="text-4xl font-bold mb-4">Contact Abraham of London</h1>
      <p className="text-lg text-gray-600 mb-6">
        For business inquiries, collaborations, or speaking engagements, reach out via:
      </p>
      <ul className="space-y-3">
        <li>Email: <a href="mailto:contact@abrahamoflondon.com" className="text-blue-600 hover:underline">contact@abrahamoflondon.com</a></li>
        <li>Phone: +44 20 7946 0991</li>
        <li>Location: London, United Kingdom</li>
      </ul>
    </div>
  );
}
