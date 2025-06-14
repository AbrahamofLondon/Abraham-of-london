'use client'

import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-luxury-black/80 backdrop-blur" aria-label="Main Navigation">
        <nav className="container-custom flex items-center justify-between py-4 text-sm">
          <a href="#hero" className="font-serif font-bold text-luxury-gold">Abraham</a>
          <ul className="flex gap-6">
            <li><a href="#companies" className="hover:text-luxury-gold">Companies</a></li>
            <li><a href="#contact" className="hover:text-luxury-gold">Contact</a></li>
          </ul>
        </nav>
      </header>
      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-luxury-black via-primary-900 to-luxury-black pt-20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative z-10 text-center container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold text-sm font-medium">
              ⭐ Visionary Entrepreneur & Brand Strategist
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-tight">
              Abraham
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold to-luxury-platinum">
                of London
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Building world-class brands and transforming businesses through 
              <span className="text-luxury-gold font-semibold"> strategic excellence</span>, 
              <span className="text-luxury-platinum font-semibold"> innovative leadership</span>, and 
              <span className="text-luxury-gold font-semibold"> luxury market expertise</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <button className="btn-primary">
                Explore My Work →
              </button>
              
              <button className="btn-secondary">
                ⚡ Start a Project
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 max-w-4xl mx-auto">
              {[
                { number: "3", label: "Premium Companies", suffix: "+" },
                { number: "50", label: "Successful Projects", suffix: "+" },
                { number: "10", label: "Years Experience", suffix: "+" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-luxury-gold mb-2">
                    {stat.number}{stat.suffix}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Companies Section */}
      <section id="companies" className="section-padding bg-gradient-to-b from-luxury-black to-primary-900">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
              Building the
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold to-luxury-platinum">
                {' '}Future
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Three revolutionary companies, one unified vision: transforming industries 
              through excellence, innovation, and strategic leadership.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Alomarada Ltd',
                description: 'Premium consulting and strategic advisory',
                focus: 'Luxury market positioning and business transformation',
                color: 'from-blue-500 to-blue-900'
              },
              {
                name: 'EndureLuxe',
                description: 'Luxury lifestyle and premium experiences',
                focus: 'High-end consumer products and services',
                color: 'from-purple-500 to-purple-900'
              },
              {
                name: 'Fathering Without Fear',
                description: 'Empowering modern fathers through confident parenting',
                focus: 'Leadership development for fathers and family men',
                color: 'from-green-500 to-green-900'
              }
            ].map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group"
              >
                <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-full hover:border-luxury-gold/30 transition-all duration-300">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${company.color} flex items-center justify-center mb-6`}>
                    <span role="img" aria-label={`${company.name} logo`} className="block w-8 h-8 bg-white rounded" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-luxury-gold transition-colors">
                    {company.name}
                  </h3>
                  
                  <p className="text-gray-300 mb-4">
                    {company.description}
                  </p>
                  
                  <p className="text-sm text-gray-400 mb-6">
                    {company.focus}
                  </p>
                  
                  <button className="text-luxury-gold hover:text-luxury-platinum transition-colors">
                    Learn More →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-padding bg-primary-900">
        <div className="container-custom text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Ready to Transform
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold to-luxury-platinum">
              {' '}Your Business?
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Let's discuss how we can elevate your brand and achieve extraordinary results together.
          </p>
          <button className="btn-primary text-lg px-8 py-4">
            Start the Conversation
          </button>
        </div>
      </section>
    </main>
  )
}