import Image from 'next/image';

export default function Brands() {
  return (
    <div className="max-w-4xl mx-auto py-20">
      <h1 className="text-4xl font-bold mb-6">The Abraham of London Ecosystem</h1>
      <p className="text-lg text-gray-600 mb-6">
        Abraham of London is the superbrand—a vessel of philosophy, vision, and transformative expression across industries and societies. 
        The brands and projects that emerge from it serve as dynamic platforms to communicate legacy, values, and purposeful creativity.
      </p>

      <div className="space-y-8">
        <div>
          <Image
            src="/assets/images/abraham-of-london-logo.svg"
            alt="Abraham of London Logo"
            width={150}
            height={150}
          />
          <h2 className="text-2xl font-semibold mt-4">Abraham of London</h2>
          <p className="text-gray-600">
            The personal brand and ideological core driving all other ventures. It represents the narrative of legacy, leadership, and cultural impact.
          </p>
        </div>

        <div>
          <Image
            src="/assets/images/fathering-without-fear.webp"
            alt="Fathering Without Fear"
            width={150}
            height={150}
          />
          <h2 className="text-2xl font-semibold mt-4">Fathering Without Fear</h2>
          <p className="text-gray-600">
            A platform for storytelling, healing, and leadership through the lens of fatherhood, legacy, and societal repair.
          </p>
        </div>

        <div>
          <Image
            src="/assets/images/alomarada.svg"
            alt="Alomarada Logo"
            width={150}
            height={150}
          />
          <h2 className="text-2xl font-semibold mt-4">Alomarada</h2>
          <p className="text-gray-600">
            The strategic advisory vehicle dedicated to transforming African governance, leadership, and market ecosystems.
          </p>
          <a href="https://alomarada.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Visit Alomarada
          </a>
        </div>

        <div>
          <Image
            src="/assets/images/endureluxe.svg"
            alt="Endureluxe Logo"
            width={150}
            height={150}
          />
          <h2 className="text-2xl font-semibold mt-4">Endureluxe</h2>
          <p className="text-gray-600">
            A lifestyle and fitness brand redefining personal excellence, resilience, and luxury for high performers.
          </p>
          <a href="https://endureluxe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Visit Endureluxe
          </a>
        </div>
      </div>

      <p className="text-lg text-gray-600 mt-10">
        Each initiative under the Abraham of London umbrella is a means of embodying and transmitting timeless values for future generations.
      </p>
    </div>
  );
}