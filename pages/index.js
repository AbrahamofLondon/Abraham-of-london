// pages/index.js
import Head from 'next/head';
import Layout from '../components/Layout.js';
import Link from 'next/link'; // Make sure Link is imported for internal navigation
import { useState } from 'react'; // Import useState hook for form management

export default function HomePage() {
  // State for form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // State for validation errors
  const [errors, setErrors] = useState({});

  // State for form submission status
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'idle', 'loading', 'success', 'error'
  const [responseMessage, setResponseMessage] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    // Clear error for the current field as user types
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  // Client-side validation function
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required.';
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid.';
      isValid = false;
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required.';
      isValid = false;
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus('loading');
    setResponseMessage('');

    if (!validateForm()) {
      setSubmissionStatus('error');
      setResponseMessage('Please correct the errors in the form.');
      return;
    }

    try {
      // Send data to our Next.js API route
      const response = await fetch('/api/contact', { // This is where we'll create the API route
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmissionStatus('success');
        setResponseMessage(data.message || 'Message sent successfully!');
        setFormData({ // Clear form fields on success
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setSubmissionStatus('error');
        setResponseMessage(data.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
      setResponseMessage('An unexpected error occurred. Please try again later.');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Abraham of London | Visionary Entrepreneur & Creative Force</title>
        {/* Potentially add more page-specific meta tags here if needed */}
      </Head>

      {/* About Section */}
      <section id="about" className="about-section section-padding">
        <div className="container">
          <h2 className="section-title">About Abraham of London</h2>
          <div className="about-content">
            <div className="about-text">
              <p>Abraham of London is a visionary entrepreneur, author, and creative force dedicated to transforming industries and inspiring lives. With a unique blend of strategic insight and innovative thinking, he has launched and nurtured ventures that address critical market needs and champion sustainable practices.</p>
              <p>His philosophy centers on building legacies through impactful ideas and fostering growth that benefits both individuals and society. Beyond business, Abraham is a thought leader whose creative works explore themes of personal development, resilience, and purposeful living.</p>
              <p>Driven by a passion for innovation and a commitment to excellence, Abraham of London continues to push boundaries, creating a significant imprint across diverse sectors.</p>
            </div>
            {/* Optional: Add an image here for the About section if desired */}
            {/* <div className="about-image">
              <img src="/assets/images/abraham-about.webp" alt="Abraham of London" />
            </div> */}
          </div>
        </div>
      </section>

      {/* Ventures Section */}
      <section id="ventures" className="ventures-section section-padding">
        <div className="container">
          <h2 className="section-title">Ventures & Impact</h2>
          <div className="ventures-grid">
            <div className="venture-card">
              <img src="/assets/images/alomarada-ltd.webp" alt="Alomarada Logo" className="venture-logo" />
              <h3>Alomarada</h3>
              <p>A pioneering venture in [brief description of Alomarada's industry/focus]. Alomarada is committed to [key value proposition or mission].</p>
              <a href="https://alomarada.com" target="_blank" rel="noopener noreferrer" className="btn btn-venture">Learn More</a>
            </div>
            <div className="venture-card">
              <img src="/assets/images/endureluxe-ltd.webp" alt="Endureluxe Logo" className="venture-logo" />
              <h3>Endureluxe</h3>
              <p>Redefining sustainable luxury in [brief description of Endureluxe's industry/focus]. Endureluxe blends elegance with environmental responsibility.</p>
              <a href="https://endureluxe.com" target="_blank" rel="noopener noreferrer" className="btn btn-venture">Learn More</a>
            </div>
            {/* Add more venture cards as needed */}
          </div>
        </div>
      </section>

      {/* Creative Works Section */}
      <section id="creative-works" className="creative-works-section section-padding">
        <div className="container">
          <h2 className="section-title">Creative Works</h2>
          <div className="creative-works-grid">
            <div className="work-card">
              <img src="/assets/images/fathering-without-fear-cover.webp" alt="Fathering Without Fear Book Cover" className="work-cover" />
              <h3>Fathering Without Fear</h3>
              <p>An impactful memoir offering profound insights into the challenges and triumphs of modern fatherhood.</p>
              <div className="download-links">
                <Link href="/downloads/fathering-without-fear.epub">
                  <a className="btn">Download .epub</a>
                </Link>
                <Link href="/downloads/fathering-without-fear.pdf">
                  <a className="btn btn-outline">Download .pdf</a>
                </Link>
              </div>
            </div>
            {/* Add more creative work cards as needed */}
            <div className="work-card">
              {/* Placeholder for future work */}
              <div className="work-placeholder">
                <i className="fas fa-lightbulb"></i>
                <h3>Future Projects</h3>
                <p>Stay tuned for more innovative ventures and compelling narratives.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section section-padding">
        <div className="container">
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-description">Have a project in mind, a collaboration idea, or just want to connect? Send a message and Abraham of London's team will get back to you promptly.</p>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="name">Name <span className="required">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error-input' : ''}
                aria-required="true"
                aria-describedby="name-error"
              />
              {errors.name && <p id="name-error" className="error-message" role="alert">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email <span className="required">*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error-input' : ''}
                aria-required="true"
                aria-describedby="email-error"
              />
              {errors.email && <p id="email-error" className="error-message" role="alert">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject <span className="required">*</span></label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={errors.subject ? 'error-input' : ''}
                aria-required="true"
                aria-describedby="subject-error"
              />
              {errors.subject && <p id="subject-error" className="error-message" role="alert">{errors.subject}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="message">Message <span className="required">*</span></label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={formData.message}
                onChange={handleChange}
                className={errors.message ? 'error-input' : ''}
                aria-required="true"
                aria-describedby="message-error"
              ></textarea>
              {errors.message && <p id="message-error" className="error-message" role="alert">{errors.message}</p>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={submissionStatus === 'loading'}>
              {submissionStatus === 'loading' ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>

            {submissionStatus && submissionStatus !== 'loading' && (
              <p className={`form-status-message ${submissionStatus === 'success' ? 'success' : 'error'}`} role="status">
                {responseMessage}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Downloads Section (ensure you have the memoir files in public/downloads/) */}
      <section id="downloads" className="downloads-section section-padding">
        <div className="container">
          <h2 className="section-title">Download My Memoir</h2>
          <div className="download-links">
            {/* Ensure these files exist in public/downloads/ */}
            <Link href="/downloads/fathering-without-fear.epub">
              <a className="btn" download>Download .epub</a>
            </Link>
            <Link href="/downloads/fathering-without-fear.pdf">
              <a className="btn btn-outline" download>Download .pdf</a>
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  );
}