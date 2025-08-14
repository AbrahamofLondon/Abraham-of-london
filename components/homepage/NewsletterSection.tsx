// components/homepage/NewsletterSection.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (_error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <motion.div
        className="relative bg-[var(--color-primary)] text-[var(--color-on-primary)] py-16 px-8 rounded-2xl shadow-lg mb-12 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative text-center max-w-2xl mx-auto">
          <motion.h2
            className="font-serif text-3xl md:text-4xl font-bold mb-4 tracking-brand text-[var(--color-on-primary)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join the Journey
          </motion.h2>
          <motion.p
            className="text-lg mb-8 opacity-90 text-[var(--color-on-primary)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Get exclusive insights on fatherhood, leadership, and building lasting legacies.
          </motion.p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 px-5 py-3 rounded-full text-[var(--color-on-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-on-primary)] transition-all duration-300"
                required
                disabled={status === 'loading'}
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              />
              <motion.button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="px-8 py-3 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] font-bold rounded-full shadow-lg hover:bg-[var(--color-primary-hover)] hover:text-[var(--color-on-primary-hover)] hover:shadow-xl transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <AnimatePresence mode="wait">
                  {status === 'loading' ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        className="w-4 h-4 border-2 border-[var(--color-on-secondary)] border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Joining...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Join Now
                    </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            </motion.div>
            <AnimatePresence>
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={`mt-4 text-sm font-medium ${
                    status === 'success' ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-accent)]'
                  }`}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </div>
      </motion.div>
    </section>
  );
};

export default NewsletterSection;