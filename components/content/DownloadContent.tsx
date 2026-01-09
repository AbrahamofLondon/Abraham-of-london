// components/downloads/DownloadContent.tsx
import dynamic from 'next/dynamic';

// Use dynamic import for client component
const DownloadCTA = dynamic(
  () => import('@/components/content/DownloadCTA'),
  { ssr: false }
);

// Or use the client wrapper:
// import DownloadCTA from "@/components/content/DownloadCTA.client";