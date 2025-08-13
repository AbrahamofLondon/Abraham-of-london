// components/homepage/NewsletterSection.tsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Welcome to the family! 🎉');
        setEmail('');
      } else {
        throw new Error('Failed to subscribe');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setTimeout(() => setStatus('idle'), 5000);
    }
  }, [email]);

  return (
    <motion.section
      id="newsletter"
      className="relative bg-secondary text-on-secondary py-16 px-8 rounded-2xl shadow-lg my-20"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
    >
      <div className="relative text-center max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
          Join the Journey
        </h2>
        <p className="text-lg mb-8 opacity-90">
          Get exclusive insights on fatherhood, leadership, and building lasting legacies.
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 px-5 py-3 rounded-full text-primary bg-white/95 focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-300"
              required
              disabled={status === 'loading'}
            />
            <motion.button
              type="submit"
              disabled={status === 'loading' || !email.trim()}
              className="px-8 py-3 bg-accent text-on-accent font-bold rounded-full shadow-lg hover:bg-accent-hover transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {status === 'loading' ? (
                  <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 justify-center">
                    <motion.div className="w-4 h-4 border-2 border-on-accent border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Join Now
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
          
          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 text-sm font-medium ${status === 'success' ? 'text-on-secondary' : 'text-red-300'}`}
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </div>
    </motion.section>
  );
};

export default NewsletterSection;