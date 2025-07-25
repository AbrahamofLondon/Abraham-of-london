// components/Ventures.js
import Image from 'next/image';

export default function Ventures() {
  return (
    <section id="ventures" className="bg-gray-50 py-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto text-center">
        {/* Abraham of London Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/assets/images/logo/abraham-of-london-logo.svg" // Confirmed SVG path
            alt="Abraham of London Logo"
            width={100}
            height={100}
            className="rounded-full shadow-lg"
          />
        </div>
        {/* ... (rest of the Ventures component code, including Alomarada and Endureluxe Image components) ... */}
        {/* Alomarada Ltd Venture */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <div className="mb-4">
            <Image
              src="/assets/images/logo/alomarada.svg" // Confirmed SVG path
              alt="Alomarada Ltd Logo"
              width={70}
              height={70}
            />
          </div>
          {/* ... */}
        </div>
        {/* Endureluxe Venture */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
          <div className="mb-4">
            <Image
              src="/assets/images/logo/endureluxe.svg" // Confirmed SVG path
              alt="Endureluxe Logo"
              width={70}
              height={70}
            />
          </div>
          {/* ... */}
        </div>
      </div>
    </section>
  );
}