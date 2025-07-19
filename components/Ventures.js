// components/Ventures.js
import Image from 'next/image';

export default function Ventures() {
  return (
    <section className="bg-gray-50 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/images/abraham-logo.jpg" // Ensure this file exists in /public/images/
            alt="Abraham of London Logo"
            width={80}
            height={80}
            className="rounded-full"
          />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Abraham of London Ventures
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          From legacy-building fatherhood initiatives to community reform and digital platforms,
          Abraham of London is forging ventures that empower, inspire, and disrupt with purpose.
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 shadow rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Fathering Without Fear</h3>
            <p className="text-gray-600 text-sm">
              A movement empowering fathers through legacy, law, and spiritual leadership.
            </p>
          </div>
          <div className="bg-white p-6 shadow rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Codex Archive</h3>
            <p className="text-gray-600 text-sm">
              A digital memorial and manifesto chronicling resistance, injustice, and the new masculinity.
            </p>
          </div>
          <div className="bg-white p-6 shadow rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Legacy Media Studio</h3>
            <p className="text-gray-600 text-sm">
              Telling fatherhood stories through sound, image, and powerful modern publishing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
