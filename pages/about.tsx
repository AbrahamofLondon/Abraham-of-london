import Image from 'next/image';
import { motion } from 'framer-motion';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const AboutSection: React.FC = () => {
  return (
    <section
      className="py-12 px-6 max-w-5xl mx-auto text-center"
      aria-labelledby="about-heading"
    >
      <h2 id="about-heading" className="text-3xl font-bold mb-6">
        About Abraham of London
      </h2>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <motion.div
          className="relative w-full h-64 md:w-1/2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUpVariant}
        >
          <Image
            src="/assets/images/profile-portrait.webp"
            alt="Portrait of Abraham of London"
            fill
            style={{ objectFit: 'cover' }}
            className="rounded-xl shadow-md"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </motion.div>

        <motion.div
          className="md:w-1/2 text-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUpVariant}
          transition={{ delay: 0.3 }}
        >
          <p className="text-lg text-gray-700 mb-4">
            I am Abraham of London—a storyteller, strategist, and student of life’s deep currents. My journey has been shaped by a relentless pursuit of truth, legacy, and personal mastery. Through every venture, book, or conversation, I am crafting not just businesses, but enduring narratives that challenge, inspire, and provoke thoughtful action.
          </p>
          <p className="text-lg text-gray-700 mb-4">
            My work stands at the intersection of philosophy, creative expression, and human development. Whether through writing, brand building, or advisory, I see every project as a canvas — a medium to explore what it means to live meaningfully, lead courageously, and leave behind a legacy of substance.
          </p>
          <p className="text-lg text-gray-700 mb-4">
            I’m less interested in transient trends and more invested in timeless truths. Family, faith, character, and creativity are the compass points that steer my endeavours. Every blog post, strategy session, or artistic project is my way of translating these convictions into tangible impact.
          </p>
          <p className="text-lg text-gray-700">
            This is not just a brand; it’s an unfolding life project. As seasons change, so do the mediums I employ — from thought leadership to immersive storytelling, from business ventures to deeply personal writings like Fathering Without Fear. It’s all connected, because I am the connection.
            <br />
            <strong>Welcome to my world — where ideas are sharpened, values are lived, and every expression is an invitation to grow, reflect, and build a life of consequence.</strong>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
