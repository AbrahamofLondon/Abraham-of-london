// pages/contact.tsx

import React from 'react'; // Make sure React is imported
import Layout from '../components/Layout'; // Adjust path if needed
import Head from 'next/head';
import Link from 'next/link'; // If you use Link components

// ... any other imports or data fetching functions you have for this page ...

export default function ContactPage() { // Or whatever your component name is
  return ( // <--- *** THIS OPENING PARENTHESIS IS CRUCIAL ***
    <Layout>
      <Head>
        <title>Contact Abraham of London</title>
        <meta name="description" content="Get in touch with Abraham of London for inquiries, collaborations, or support." />
      </Head>

      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <h1 className="text-4xl font-bold mb-6">Get in Touch</h1>
        <p className="text-lg text-gray-700 mb-8">
          I'm always open to new ideas, collaborations, and conversations. Feel free to reach out through the following channels:
        </p>

        <ul className="space-y-4 text-lg">
          <li className="flex items-center justify-center">
            <i className="fas fa-envelope text-blue-600 mr-3"></i>
            <span>Email: </span><a href="mailto:contact@abrahamoflondon.org" className="text-blue-600 hover:underline ml-2">contact@abrahamoflondon.org</a>
          </li>
          <li className="flex items-center justify-center">
            <i className="fab fa-twitter text-blue-400 mr-3"></i>
            <span>Twitter: </span><Link href="https://twitter.com/abraham_london" passHref><a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">@abraham_london</a></Link>
          </li>
          <li className="flex items-center justify-center">
            <i className="fab fa-linkedin-in text-blue-700 mr-3"></i>
            <span>LinkedIn: </span><Link href="https://linkedin.com/in/abrahamoflondon" passHref><a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">/in/abrahamoflondon</a></Link>
          </li>
          {/* Add more contact methods as needed */}
        </ul>
      </div>
    </Layout>
  ); // <--- *** THIS CLOSING PARENTHESIS AND SEMICOLON ARE CRUCIAL ***
}