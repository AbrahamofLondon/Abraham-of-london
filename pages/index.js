// Define Geist Sans local font
const geistSans = localFont({
  src: [
    {
      path: '/fonts/geist-black.woff2', // CHANGED
      weight: '400',
      style: 'normal',
    },
    {
      path: '/fonts/Geist-Regular.woff2', // CHANGED
      weight: '500',
      style: 'normal',
    },
    {
      path: '/fonts/Geist-SemiBold.woff2', // CHANGED
      weight: '600',
      style: 'normal',
    },
    {
      path: '/fonts/Geist-Bold.woff2', // CHANGED
      weight: '700',
      style: 'normal',
    },
  ],
  variable: "--font-geist-sans",
});

// Define Geist Mono local font
const geistMono = localFont({
  src: [
    {
      path: '/fonts/GeistMono-Regular.woff2', // CHANGED
      weight: '400',
      style: 'normal',
    },
    {
      path: '/fonts/GeistMono-Medium.woff2', // CHANGED
      weight: '500',
      style: 'normal',
    },
  ],
  variable: "--font-geist-mono",
});