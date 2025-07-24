// components/Layout.tsx
import React, { ReactNode } from 'react'; // Keep React import if using React.FC or hooks
import Head from 'next/head';
import Header from './Header'; // Correctly imports Header from Header.tsx

// Define the props interface for the Layout component
interface LayoutProps {
  children: ReactNode; // 'children' allows other components to be nested inside Layout
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Head>
        {/* Common meta tags for your site */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* You can add a default favicon here if you want, e.g., <link rel="icon" href="/favicon.ico" /> */}
        {/* Other common SEO meta tags can go here */}
      </Head>
      {/* This div wraps the entire page content.
          - min-h-screen ensures it takes at least the full viewport height.
          - flex flex-col makes it a flex container with items stacked vertically.
          - font-body applies your custom 'body' font defined in tailwind.config.js
            (which should map to 'GeistMono-Regular' as per our discussion).
      */}
      <div className="min-h-screen flex flex-col font-body">
        {/* Your Header component goes at the top of every page */}
        <Header />

        {/* The main content area, which expands to fill available space.
            'children' will be whatever content is passed into the Layout component from your pages.
        */}
        <main className="flex-grow">
          {children}
        </main>

        {/* If you have a Footer component, you would include it here: */}
        {/* <Footer /> */}
      </div>
    </>
  );
};

export default Layout;