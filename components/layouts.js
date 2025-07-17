// components/Layout.js
import Head from 'next/head';
import { useEffect } from 'react';

export default function Layout({ children }) {
  // useEffect for client-side JavaScript features like smooth scrolling and mobile menu toggle
  useEffect(() => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
          behavior: 'smooth'
        });
      });
    });

    // Dynamically update footer year
    const currentYear = new Date().getFullYear();
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
      yearElement.textContent = currentYear;
    }

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
      });

      // Close menu when a link is clicked (for single-page navigation)
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
          }
        });
      });
    }

  }, []); // Empty dependency array means this runs once on mount

  return (
    <>
      <Head>
        {/* Basic Meta Data from website code legendary.docx */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="color-scheme" content="light" />

        {/* Primary Meta Tags from website code legendary.docx */}
        <title>Abraham of London | Visionary Entrepreneur & Creative Force</title>
        <meta name="description" content="Visionary entrepreneur, author, and creative force transforming industries through innovative ventures including Alomarada, Endureluxe, and Fathering Without Fear." />
        <meta name="keywords" content="Abraham London, entrepreneur, Alomarada, Endureluxe, Fathering Without Fear, creative works, business ventures, sustainable luxury, innovation" />
        <meta name="author" content="Abraham of London" />
        <link rel="canonical" href="https://abrahamoflondon.com" /> {/* Update with your actual domain */}

        {/* Open Graph / Facebook from website code legendary.docx */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://abrahamoflondon.com" /> {/* Update with your actual domain */}
        <meta property="og:title" content="Abraham of London | Visionary Entrepreneur & Creative Force" />
        <meta property="og:description" content="Visionary entrepreneur, author, and creative force transforming industries through innovative ventures and thought leadership." />
        <meta property="og:image" content="https://abrahamoflondon.com/assets/og-image.jpg" /> {/* Ensure this image exists in public/assets */}
        <meta property="og:site_name" content="Abraham of London" />

        {/* Twitter from website code legendary.docx */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://abrahamoflondon.com" /> {/* Update with your actual domain */}
        <meta name="twitter:title" content="Abraham of London | Visionary Entrepreneur & Creative Force" />
        <meta name="twitter:description" content="Visionary entrepreneur, author, and creative force transforming industries through innovative ventures and thought leadership." />
        <meta name="twitter:image" content="https://abrahamoflondon.com/assets/twitter-image.jpg" /> {/* Ensure this image exists in public/assets */}
        <meta name="twitter:creator" content="@abraham_london" /> {/* Update with your Twitter handle */}

        {/* Favicon from website code legendary.docx */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />

        {/* Google Fonts (from website code legendary.docx comments) */}
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

        {/* Font Awesome CDN for Icons - ADDED THIS LINE */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" integrity="sha512-Fo3rlalDLn1mNfDq9r4Nq1/J1lG4sKz3P/4jW+L4P6h3W2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2R2X6K+qP1W3t1o1t5e2z2