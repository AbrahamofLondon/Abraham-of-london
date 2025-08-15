// components/homepage/NewsletterSection.tsx
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  title?: string;
  subtitle?: string;
  className?: string;
};

const NewsletterSection: React.FC<Props> = ({
  title = "Join the Journey",
  subtitle = "Get exclusive insights on fatherhood, leadership, and building lasting legacies.",
  className,
}) => {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      setStatus("success");
      setMessage("Welcome to the family! ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬ ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setTimeout(() => setStatus("idle"), 5000);
    }
  }

  return (
    <section className="container mx-auto max-w-6xl px-4 py-16">
      <motion.div
        className={`relative bg-forest text-cream py-16 px-8 rounded-2xl shadow-lg mb-12 overflow-hidden ${className || ""}`}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative text-center max-w-2xl mx-auto">
          <motion.h2
            className="font-serif text-3xl md:text-4xl font-bold mb-4 tracking-brand"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {title}
          </motion.h2>

          {subtitle && (
            <motion.p
              className="text-lg mb-8 opacity-90"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {subtitle}
            </motion.p>
          )}

          <form
            onSubmit={handleSubmit}
            className="max-w-md mx-auto"
            aria-label="Newsletter subscription form"
          >
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
                className="flex-1 px-5 py-3 rounded-full text-deepCharcoal focus:outline-none focus:ring-2 focus:ring-cream transition-all duration-300"
                required
                disabled={status === "loading"}
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                aria-label="Enter your email address"
              />
              <motion.button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="px-8 py-3 bg-cream text-forest font-bold rounded-full shadow-lg hover:bg-white hover:text-emerald-700 hover:shadow-xl transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                aria-label="Subscribe to newsletter"
              >
                <AnimatePresence mode="wait">
                  {status === "loading" ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
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
                  className={`mt-4 text-sm font-medium ${status === "success" ? "text-cream" : "text-red-400"}`}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  role={status === "error" ? "alert" : undefined}
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







