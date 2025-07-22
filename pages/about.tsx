// pages/about.tsx
import React from 'react';
import Layout from '../components/Layout'; // Correct path from pages/about.tsx

export default function About() {
  return ( // <--- THIS OPENING PARENTHESIS IS VITAL
    <Layout>
      <div className="max-w-4xl mx-auto py-20">
        <h1 className="text-4xl font-bold mb-6">About Abraham of London</h1>
        <p className="text-lg text-gray-600 mb-6">
          I am Abraham of London — a storyteller, strategist, and student of life’s deep currents. My journey has been shaped by a relentless pursuit of truth, legacy, and personal mastery. Through every venture, book, or conversation, I am crafting not just businesses, but enduring narratives that challenge, inspire, and provoke thoughtful action.
        </p>

        <p className="text-lg text-gray-600 mb-6">
          My work stands at the intersection of philosophy, creative expression, and human development. Whether through writing, brand building, or advisory, I see every project as a canvas — a medium to explore what it means to live meaningfully, lead courageously, and leave behind a legacy of substance.
        </p>

        <p className="text-lg text-gray-600 mb-6">
          I’m less interested in transient trends and more invested in timeless truths. Family, faith, character, and creativity are the compass points that steer my endeavours. Every blog post, strategy session, or artistic project is my way of translating these convictions into tangible impact.
        </p>

        <p className="text-lg text-gray-600 mb-6">
          This is not just a brand; it’s an unfolding life project. As seasons change, so do the mediums I employ — from thought leadership to immersive storytelling, from business ventures to deeply personal writings like <em>Fathering Without Fear</em>. It’s all connected, because I am the connection.
        </p>

        <p className="text-lg text-gray-600">
          Welcome to my world — where ideas are sharpened, values are lived, and every expression is an invitation to grow, reflect, and build a life of consequence.
        </p>
      </div>
    </Layout>
  ); // <--- THIS CLOSING PARENTHESIS AND SEMICOLON IS VITAL
}