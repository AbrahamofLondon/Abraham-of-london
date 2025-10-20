<<<<<<< HEAD
import '../styles/globals.css'
=======
// src/app/layout.tsx

import '../styles/globals.css';
>>>>>>> a496e215 (Initial commit)

export const metadata = {
  title: 'Abraham of London | Visionary Entrepreneur & Brand Strategist',
  description: 'World-class consulting, luxury brand development, and transformational leadership.',
<<<<<<< HEAD
}
=======
};

// Add this line to force dynamic rendering for this layout and all pages within it
export const dynamic = 'force-dynamic';
>>>>>>> a496e215 (Initial commit)

export default function RootLayout({
  children,
}: {
<<<<<<< HEAD
  children: React.ReactNode
=======
  children: React.ReactNode;
>>>>>>> a496e215 (Initial commit)
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
<<<<<<< HEAD
  )
=======
  );
>>>>>>> a496e215 (Initial commit)
}