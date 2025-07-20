import Image from 'next/image';

export default function Ventures() {
  return (
    <section id="ventures" className="bg-gray-50 py-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/abraham-logo.jpg"
            alt="Abraham of London Logo"
            width={100}
            height={100}
            className="rounded-full shadow-lg"
          />
        </div>

        {/* Title and Intro */}
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Abraham of London Ventures
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-12">
          From legacy-building fatherhood initiatives to community reform and digital platforms,
          Abraham of London is forging ventures that empower, inspire, and disrupt with purpose.
        </p>

        {/* Venture Cards */}
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Venture 1 */}
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Fathering Without Fear</h3>
            <p className="text-gray-600 text-sm">
              A movement empowering fathers through legacy, law, and spiritual leadership.
            </p>
          </div>

          {/* Venture 2 */}
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Codex Archive</h3>
            <p className="text-gray-600 text-sm">
              A digital memorial and manifesto chronicling resistance, injustice, and the new masculinity.
            </p>
          </div>

          {/* Venture 3 */}
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Legacy Media Studio</h3>
            <p className="text-gray-600 text-sm">
              Telling fatherhood stories through sound, image, and powerful modern publishing.
            </p>
          </div>

          {/* Additional Ventures - Optional */}
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Alomarada Ltd</h3>
            <p className="text-gray-600 text-sm">
              A pioneering venture driving sustainable innovation across creative industries.
            </p>
            <a
              href="https://alomarada.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-blue-600 hover:underline font-medium"
            >
              Visit Alomarada →
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Endureluxe</h3>
            <p className="text-gray-600 text-sm">
              A sustainable luxury brand redefining elegance with environmental integrity.
            </p>
            <a
              href="https://endureluxe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-blue-600 hover:underline font-medium"
            >
              Visit Endureluxe →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
