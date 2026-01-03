// components/mdx/MDXContentWrapper.tsx
import LegacyDiagram from '@/components/diagrams/LegacyDiagram';
import ProTip from '@/components/content/ProTip';
import FeatureGrid from '@/components/content/FeatureGrid';
import DownloadCTA from '@/components/content/DownloadCTA';

interface MDXContentWrapperProps {
  content: React.ReactNode;
  frontmatter: any;
}

export function MDXContentWrapper({ content, frontmatter }: MDXContentWrapperProps) {
  return (
    <div className="mdx-content">
      {content}
      
      {frontmatter.useLegacyDiagram && <LegacyDiagram />}
      
      {frontmatter.useProTip && frontmatter.proTipContent && (
        <ProTip type={frontmatter.proTipType || "info"}>
          {frontmatter.proTipContent}
        </ProTip>
      )}
      
      {frontmatter.useFeatureGrid && frontmatter.featureGridItems && (
        <FeatureGrid 
          columns={frontmatter.featureGridColumns || 2}
          items={frontmatter.featureGridItems}
        />
      )}
      
      {frontmatter.useDownloadCTA && frontmatter.ctaConfig && (
        <DownloadCTA 
          title={frontmatter.title}
          description={frontmatter.excerpt || frontmatter.description}
          badge={frontmatter.ctaConfig.badge || "Download"}
          details={frontmatter.ctaConfig.details || []}
          features={frontmatter.ctaConfig.features || []}
          downloadUrl={frontmatter.file}
          fileSize={frontmatter.fileSize}
          fileFormat={frontmatter.fileFormat}
          buttonText="Download Now"
        />
      )}
    </div>
  );
}