// components/content/DownloadCTA.types.ts
export interface DetailItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface FeatureItem {
  title: string;
  desc?: string;
  icon?: React.ReactNode;
}

export interface StepItem {
  title: string;
  desc?: string;
}

export interface DownloadCTAProps {
  title?: string;
  badge?: string;
  details?: DetailItem[];
  features?: FeatureItem[];
  steps?: StepItem[];
  buttonText?: string;
  onClick?: (e: React.MouseEvent) => void;  // Make it optional
  href?: string;
}