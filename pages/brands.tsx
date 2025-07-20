// Placeholder React Components for Next.js pages

// brands.tsx
export function Brands() {
  return (
    <div className="max-w-4xl mx-auto py-20">
      <h1 className="text-4xl font-bold mb-4">Our Ventures</h1>
      <p className="text-lg text-gray-600 mb-6">Explore the brands driven by the vision of Abraham of London.</p>
      <ul className="space-y-4">
        <li><a href="https://alomarada.com" target="_blank" className="text-blue-600 hover:underline">Alomarada - Strategic Advisory for Africa</a></li>
        <li><a href="https://endureluxe.com" target="_blank" className="text-blue-600 hover:underline">Endureluxe - Performance & Luxury Lifestyle</a></li>
      </ul>
    </div>
  );
}

// books.tsx
export function Books() {
  return (
    <div className="max-w-4xl mx-auto py-20">
      <h1 className="text-4xl font-bold mb-4">Books by Abraham of London</h1>
      <p className="text-lg text-gray-600 mb-6">Discover publications that explore leadership, legacy, and personal growth.</p>
      <ul className="space-y-4">
        <li><strong>Fathering Without Fear</strong> - Memoir & Life Lessons</li>
        <li><strong>Fathering Without Fear</strong> - The Fictional Novel</li>
      </ul>
    </div>
  );
}

// about.tsx
export function About() {
  return (
    <div className="max-w-4xl mx-auto py-20">
      <h1 className="text-4xl font-bold mb-4">About Abraham of London</h1>
      <p className="text-lg text-gray-600 mb-6">
        Abraham of London is a visionary entrepreneur, strategist, and cultural influencer. 
        With a focus on transforming industries and inspiring movements, he bridges London's innovation with Africa's potential.
      </p>
      <p className="text-lg text-gray-600">Driven by a mission to reposition Nigeria and Africa on the global stage, his work spans business strategy, thought leadership, and nation-building initiatives.</p>
    </div>
  );
}

// contact.tsx
export function Contact() {
  return (
    <div className="max-w-4xl mx-auto py-20">
      <h1 className="text-4xl font-bold mb-4">Contact Abraham of London</h1>
      <p className="text-lg text-gray-600 mb-6">For business inquiries, collaborations, or speaking engagements, reach out via:</p>
      <ul className="space-y-3">
        <li>Email: <a href="mailto:contact@abrahamoflondon.com" className="text-blue-600 hover:underline">contact@abrahamoflondon.com</a></li>
        <li>Phone: +44 20 7946 0991</li>
        <li>Location: London, United Kingdom</li>
      </ul>
    </div>
  );
}