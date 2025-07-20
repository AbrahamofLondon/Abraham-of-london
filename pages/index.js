// pages/index.js
import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <Layout>
      <Head>
        <title>Abraham of London | Visionary Entrepreneur & Creative Force</title>
      </Head>

      {/* Logo Section */}
      <section className="py-6 text-center">
        <Image
          src="/images/abraham-logo.jpg"
          alt="Abraham of London Logo"
          width={120}
          height={120}
          className="mx-auto rounded-full shadow-md"
        />
      </section>

      {/* About Section */}
      <section className="py-12 px-4 md:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">About Abraham of London</h2>
          <p className="text-gray-700 mb-4">Abraham of London is a visionary entrepreneur, author, and creative force dedicated to transforming industries and inspiring lives. With a unique blend of strategic insight and innovative thinking, he has launched and nurtured ventures that address critical market needs and champion sustainable practices.</p>
          <p className="text-gray-700 mb-4">His philosophy centers on building legacies through impactful ideas and fostering growth that benefits both individuals and society.</p>
          <p className="text-gray-700">Driven by a passion for innovation and a commitment to excellence, Abraham continues to push boundaries, creating a significant imprint across diverse sectors.</p>
        </div>
      </section>

      {/* Ventures Section */}
      <section className="py-12 px-4 md:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ventures & Impact</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white p-6 rounded-2xl shadow">
              <Image
                src="/assets/images/alomarada-ltd.webp"
                alt="Alomarada"
                width={200}
                height={120}
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Alomarada</h3>
              <p className="text-gray-600 mb-4">A pioneering venture in [brief description].</p>
              <a href="https://alomarada.com" target="_blank" className="text-blue-600 hover:underline">Learn More</a>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <Image
                src="/assets/images/endureluxe-ltd.webp"
                alt="Endureluxe"
                width={200}
                height={120}
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Endureluxe</h3>
              <p className="text-gray-600 mb-4">Redefining sustainable luxury in [brief description].</p>
              <a href="https://endureluxe.com" target="_blank" className="text-blue-600 hover:underline">Learn More</a>
            </div>
          </div>
        </div>
      </section>

      {/* Creative Works Section */}
      <section className="py-12 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6">Creative Works</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-6 bg-gray-50 rounded-lg shadow text-center">
              <Image
                src="/assets/images/fathering-without-fear.jpg"
                alt="Fathering Without Fear Book"
                width={200}
                height={300}
                className="mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Fathering Without Fear</h3>
              <p className="text-gray-600 mb-4">A memoir exploring the challenges and triumphs of fatherhood.</p>
              <div className="flex justify-center gap-4">
                <Link href="/downloads/fathering-without-fear.epub">
                  <a className="btn">Download .epub</a>
                </Link>
                <Link href="/downloads/fathering-without-fear-teaser-with-reflection.pdf">
                  <a className="btn btn-outline">Download .pdf</a>
                </Link>
              </div>
            </div>

            <div className="p-6 bg-gray-100 rounded-lg shadow text-center">
              <div className="text-6xl text-yellow-400 mb-4">
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Future Projects</h3>
              <p className="text-gray-600">Stay tuned for more ventures and compelling narratives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Downloads Section */}
      <section className="py-12 px-4 md:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Download My Memoir</h2>
          <div className="flex justify-center gap-4">
            <Link href="/downloads/fathering-without-fear.epub">
              <a className="btn">Download .epub</a>
            </Link>
            <Link href="/downloads/fathering-without-fear-teaser-with-reflection.pdf">
              <a className="btn btn-outline">Download .pdf</a>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}