// components/Layout.js
import Head from 'next/head';
import { useEffect } from 'react';

export default function Layout({ children }) {
  // useEffect for client-side JavaScript features
  useEffect(() => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetElement = document.querySelector(this.getAttribute('href'));
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
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
      const toggleMenu = () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
      };
      
      menuToggle.addEventListener('click', toggleMenu);

      // Close menu when a link is clicked
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (navLinks.classList.contains('active')) {
            toggleMenu();
          }
        });
      });
    }

  }, []); // Empty dependency array means this runs once on mount

  return (
    <>
      <Head>
        {/* Basic Meta Data */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="color-scheme" content="light" />

        {/* Primary Meta Tags */}
        <title>Abraham of London | Visionary Entrepreneur & Creative Force</title>
        <meta name="description" content="Visionary entrepreneur, author, and creative force transforming industries through innovative ventures including Alomarada, Endureluxe, and Fathering Without Fear." />
        <meta name="keywords" content="Abraham London, entrepreneur, Alomarada, Endureluxe, Fathering Without Fear, creative works, business ventures, sustainable luxury, innovation" />
        <meta name="author" content="Abraham of London" />
        <link rel="canonical" href="https://abrahamoflondon.com" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://abrahamoflondon.com" />
        <meta property="og:title" content="Abraham of London | Visionary Entrepreneur & Creative Force" />
        <meta property="og:description" content="Visionary entrepreneur, author, and creative force transforming industries through innovative ventures and thought leadership." />
        <meta property="og:image" content="https://abrahamoflondon.com/assets/og-image.jpg" />
        <meta property="og:site_name" content="Abraham of London" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://abrahamoflondon.com" />
        <meta name="twitter:title" content="Abraham of London | Visionary Entrepreneur & Creative Force" />
        <meta name="twitter:description" content="Visionary entrepreneur, author, and creative force transforming industries through innovative ventures and thought leadership." />
        <meta name="twitter:image" content="https://abrahamoflondon.com/assets/twitter-image.jpg" />
        <meta name="twitter:creator" content="@abraham_london" />

        {/* Favicon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />

        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

        {/* THIS IS THE LINE THAT WAS CAUSING THE ERROR. THE VERSION BELOW IS CORRECT. */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
          integrity="sha512-Fo3rlrZj/k7ujTnHg4CGR2D7kSs0v4LLanw2qksYuRlEzO+tcaEPQogQ0KaoGN26/zrn20ImR1DfuLWnOo7aBA==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </Head>

      <main>
        {children}
      </main>
    </>
  );
}