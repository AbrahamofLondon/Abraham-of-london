import React from 'react';
import Image from 'next/image';

const AboutSection: React.FC = () => {
  return (
    <section className="py-12 px-6 max-w-5xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-6">About Abraham of London</h2>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-full h-64 md:w-1/2">
          <Image
            src="/assets/images/profile-portrait.webp"
            alt="Abraham of London"
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-xl shadow-md"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="md:w-1/2 text-left">
          <p className="text-lg text-gray-700">
            I am Abraham of London-a storyteller, strategist, and student of life’s deep currents. My journey has been shaped by a relentless pursuit of truth, legacy, and personal mastery. Through every venture, book, or conversation, I am crafting not just businesses, but enduring narratives that challenge, inspire, and provoke thoughtful action.

My work stands at the intersection of philosophy, creative expression, and human development. Whether through writing, brand building, or advisory, I see every project as a canvas — a medium to explore what it means to live meaningfully, lead courageously, and leave behind a legacy of substance.

I’m less interested in transient trends and more invested in timeless truths. Family, faith, character, and creativity are the compass points that steer my endeavours. Every blog post, strategy session, or artistic project is my way of translating these convictions into tangible impact.

This is not just a brand; it’s an unfolding life project. As seasons change, so do the mediums I employ — from thought leadership to immersive storytelling, from business ventures to deeply personal writings like Fathering Without Fear. It’s all connected, because I am the connection.

Welcome to my world — where ideas are sharpened, values are lived, and every expression is an invitation to grow, reflect, and build a life of consequence.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
