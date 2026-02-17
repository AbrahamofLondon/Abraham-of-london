// types/download-cta.ts
export interface CTADetail {
  label: string;
  value: string;
  icon: string;
}

export interface DownloadCTAProps {
  title: string;
  badge: string;
  details: CTADetail[];
  features: string[];
  steps: string[];
  buttonText: string;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  href: string;
}