// components/mdx/MDXContentWrapper.tsx
import * as React from "react";
import LegacyDiagram from "@/components/diagrams/LegacyDiagram";
import ProTip from "@/components/content/ProTip";
import FeatureGrid from "@/components/content/FeatureGrid";
import dynamic from "next/dynamic";

const DownloadCTA = dynamic(() => import("@/components/content/DownloadCTA.client"), {
  ssr: false,
});

// Type definitions
interface CTADetail {
  label: string;
  value: string;
  icon: string;
}

interface CTAConfig {
  badge?: string;
  details?: CTADetail[];
  features?: string[];
}

interface DownloadProcess {
  steps?: string[];
}

interface FeatureGridItem {
  title: string;
  description: string;
  icon?: string;
}

export interface MDXContentWrapperProps {
  content: React.ReactNode;
  frontmatter: {
    title?: string;
    useLegacyDiagram?: boolean;
    useProTip?: boolean;
    proTipContent?: string;
    proTipType?: "info" | "warning" | "success" | "danger";
    useFeatureGrid?: boolean;
    featureGridItems?: FeatureGridItem[];
    featureGridColumns?: number;
    useDownloadCTA?: boolean;
    ctaConfig?: CTAConfig;
    fileSize?: string;
    fileFormat?: string;
    downloadProcess?: DownloadProcess;
    file?: string;
    downloadUrl?: string;
    [key: string]: any;
  };
}

export function MDXContentWrapper({
  content,
  frontmatter,
}: MDXContentWrapperProps) {
  // Handler for download CTA click
  const handleDownloadClick = React.useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const downloadLink = frontmatter?.file || frontmatter?.downloadUrl;
    if (downloadLink) {
      window.open(downloadLink, '_blank', 'noopener,noreferrer');
    }
  }, [frontmatter?.file, frontmatter?.downloadUrl]);

  // Build details array for download CTA
  const downloadDetails = React.useMemo(() => {
    const details: CTADetail[] = [];
    
    if (frontmatter?.fileSize) {
      details.push({
        label: "File Size",
        value: frontmatter.fileSize,
        icon: "📦"
      });
    }
    
    if (frontmatter?.fileFormat) {
      details.push({
        label: "Format",
        value: frontmatter.fileFormat.toUpperCase(),
        icon: "📄"
      });
    }
    
    // Add any additional details from ctaConfig
    if (frontmatter?.ctaConfig?.details && Array.isArray(frontmatter.ctaConfig.details)) {
      details.push(...frontmatter.ctaConfig.details);
    }
    
    return details;
  }, [frontmatter?.fileSize, frontmatter?.fileFormat, frontmatter?.ctaConfig?.details]);

  return (
    <div className="mdx-content">
      {content}
      
      {/* Legacy Diagram */}
      {frontmatter?.useLegacyDiagram && <LegacyDiagram />}
      
      {/* Pro Tip */}
      {frontmatter?.useProTip && frontmatter?.proTipContent && (
        <ProTip type={frontmatter?.proTipType || "info"}>
          {frontmatter.proTipContent}
        </ProTip>
      )}
      
      {/* Feature Grid */}
      {frontmatter?.useFeatureGrid && frontmatter?.featureGridItems && (
        <FeatureGrid
          columns={frontmatter?.featureGridColumns || 2}
          items={frontmatter.featureGridItems}
        />
      )}
      
      {/* Download CTA */}
      {frontmatter?.useDownloadCTA && frontmatter?.ctaConfig && (
        <DownloadCTA
          title={frontmatter?.title || "Download Resource"}
          badge={frontmatter?.ctaConfig?.badge || "Download"}
          details={downloadDetails}
          features={frontmatter?.ctaConfig?.features || []}
          steps={frontmatter?.downloadProcess?.steps || []}
          buttonText="Download Now"
          onClick={handleDownloadClick}
          href={frontmatter?.file || frontmatter?.downloadUrl || "#"}
        />
      )}
    </div>
  );
}

export default MDXContentWrapper;