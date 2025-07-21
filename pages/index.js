// pages/index.js (or HomePage.js, depending on your actual file name for the root page)

import Layout from '../components/Layout'; // Assuming you have a Layout component
import { useState } from 'react'; // Example if you use state, adjust as needed

export default function HomePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here (e.g., send data to an API)
    console.log('Form data submitted:', formData);
    alert('Message sent successfully!');
    setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
  };

  return (
    <Layout>
      <section id="hero" className="hero-section section-padding">
        <div className="container text-center">
          <img src="/assets/images/logo/abraham-of-london-logo.svg" alt="Abraham of London Logo" className="hero-logo" />
          <h1>Abraham of London</h1>
          <p className="tagline">Visionary Entrepreneur, Author, and Creative Force</p>
        </div>
      </section>

      <section id="about" className="about-section section-padding">
        <div className="container">
          <h2>About Abraham of London</h2>
          <p>Abraham of London is a visionary entrepreneur, author, and creative force dedicated to transforming industries and inspiring lives. With a unique blend of strategic insight and innovative thinking, he has launched and nurtured ventures that address critical market needs and champion sustainable practices.</p>
          <p>His philosophy centers on building legacies through impactful ideas and fostering growth that benefits both individuals and society. Beyond business, Abraham is a thought leader whose creative works explore themes of personal development, resilience, and purposeful living.</p>
          <p>Driven by a passion for innovation and a commitment to excellence, Abraham of London continues to push boundaries, creating a significant imprint across diverse sectors.</p>
        </div>
      </section>

      <section id="ventures" className="ventures-section section-padding">
        <div className="container">
          <h2>Ventures & Impact</h2>
          <div className="venture-item">
            <img src="/assets/images/logo/alomarada.svg" alt="Alomarada Logo" className="venture-logo" />
            <h3>Alomarada</h3>
            <p>A pioneering venture in [brief description of Alomarada's industry/focus]. Alomarada is committed to [key value proposition or mission].</p>
            <a href="#" className="btn-outline">Learn More</a>
          </div>
          <div className="venture-item">
            <img src="/assets/images/logo/endureluxe.svg" alt="Endureluxe Logo" className="venture-logo" />
            <h3>Endureluxe</h3>
            <p>Redefining sustainable luxury in [brief description of Endureluxe's industry/focus]. Endureluxe blends elegance with environmental responsibility.</p>
            <a href="#" className="btn-outline">Learn More</a>
          </div>
        </div>
      </section>

      <section id="creative-works" className="creative-works-section section-padding">
        <div className="container">
          <h2>Creative Works</h2>
          <div className="book-item">
            {/* CORRECTED PATH FOR THE BOOK COVER IMAGE */}
            <img src="/assets/images/fathering-without-fear.webp" alt="Fathering Without Fear Book Cover" className="book-cover" />
            <h3>Fathering Without Fear</h3>
            <p>An impactful memoir offering profound insights into the challenges and triumphs of modern fatherhood.</p>
            <a href="/downloads/fathering-without-fear.epub" className="btn-outline download">Download .epub</a>
            <a href="/downloads/fathering-without-fear-teaser-with-reflection.pdf" className="btn-outline download">Download .pdf</a>
          </div>
        </div>
      </section>

      <section id="future-projects" className="future-projects-section section-padding">
        <div className="container">
          <h2>Future Projects</h2>
          <p>Stay tuned for more innovative ventures and compelling narratives.</p>
        </div>
      </section>

      <section id="contact" className="contact-section section-padding">
        <div className="container">
          <h2>Get In Touch</h2>
          <p>Have a project in mind, a collaboration idea, or just want to connect? Send a message and Abraham of London's team will get back to you promptly.</p>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea id="message" name="message" rows="5" value={formData.message} onChange={handleChange} required></textarea>
            </div>
            <button type="submit" className="btn-primary">Send Message</button>
          </form>
        </div>
      </section>
    </Layout>
  );
}