'use client'

import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className="bg-luxury-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-luxury-black via-primary-900 to-luxury-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        
        <div className="relative z-10 px-6 mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 py-24"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold text-sm font-medium"
            >
              ⭐ Visionary Entrepreneur, Brand Strategist & Father
            </motion.div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-tight">
              Abraham
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold to-luxury-platinum">
                of London
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Building world-class brands through strategic excellence and innovative leadership.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <button className="px-6 py-3 bg-gradient-to-r from-luxury-gold to-luxury-platinum text-black font-bold rounded-full hover:shadow-lg transition-all">
                Explore My Work →
              </button>
              
              <button className="px-6 py-3 border-2 border-luxury-gold text-luxury-gold font-bold rounded-full hover:bg-luxury-gold/10 transition-all">
                ⚡ Start a Project
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-16 max-w-4xl mx-auto">
              {[
                // Change these values:
const STATS = [
  { number: "3+", label: "Premium Companies" },
  { number: "20+", label: "Successful Projects" },
  { number: "10+", label: "Years Experience" }
]

const TAGLINE = "Building world-class brands through strategic excellence"
                             ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl font-bold text-luxury-gold">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider mt-2">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Abraham of London. All rights reserved 2025.
      </footer>
    </main>
  )
}