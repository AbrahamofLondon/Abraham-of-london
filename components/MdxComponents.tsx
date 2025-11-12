/* eslint-disable no-restricted-imports */
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { withFallback } from '@/lib/safe-fallbacks';

// Base components with fallbacks
const SafeLink = withFallback(Link, ({ href, children, ...props }: any) => (
  <a href={href as string} {...props}>{children}</a>
));

const SafeImage = withFallback(Image, ({ src, alt, ...props }: any) => (
  <Image
    src={src}
    alt={alt || ""}
    width={Number(1200)}
    height={Number(800)}
    priority={false}
    {...props}
  />
));

// Brand Frame component
const BrandFrame = withFallback(({ children, className = '' }: any) => (
  <div className={`brand-frame border-2 border-gold p-6 my-6 ${className}`}>
    <div className="brand-frame-inner">{children}</div>
  </div>
));

// Hero Eyebrow component  
const HeroEyebrow = withFallback(({ children, className = '' }: any) => (
  <div className={`hero-eyebrow text-sm uppercase tracking-wider text-gray-600 mb-2 ${className}`}>
    {children}
  </div>
));

// CTA Components
const CTA = withFallback(({ href, children, variant = 'primary', ...props }: any) => (
  <SafeLink
    href={href}
    className={`cta cta-${variant} inline-block px-6 py-3 rounded font-medium transition-colors ${props.className || ''}`}
    {...props}
  >
    {children}
  </SafeLink>
));

const CTAGroup = withFallback(({ children, className = '' }: any) => (
  <div className={`cta-group flex gap-4 flex-wrap ${className}`}>
    {children}
  </div>
));

const PrimaryCTA = (props: any) => <CTA variant="primary" {...props} />;
const SecondaryCTA = (props: any) => <CTA variant="secondary" {...props} />;
const OutlineCTA = (props: any) => <CTA variant="outline" {...props} />;

// Caption component
const Caption = withFallback(({ children, className = '' }: any) => (
  <figcaption className={`caption text-sm text-gray-600 mt-2 text-center ${className}`}>
    {children}
  </figcaption>
));

// Resources CTA component
const ResourcesCTA = withFallback(({ title, description, action, className = '' }: any) => (
  <div className={`resources-cta bg-gray-50 p-6 rounded-lg border ${className}`}>
    {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
    {description && <p className="text-gray-700 mb-4">{description}</p>}
    {action && <div className="cta-action">{action}</div>}
  </div>
));

// JSON-LD component (no-op for fallback)
const JsonLd = withFallback(({ data }: any) => {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
});

// Base MDX components
const baseComponents = {
  // Layout components
  BrandFrame,
  HeroEyebrow,
  ResourcesCTA,
  JsonLd,
  Caption,
  
  // CTA components
  CTA,
  CTAGroup,
  PrimaryCTA,
  SecondaryCTA,
  OutlineCTA,
  
  // Basic HTML elements with enhanced styling
  a: withFallback(({ href, children, ...props }: any) => {
    const isExternal = href?.startsWith('http');
    const Component = isExternal ? 'a' : SafeLink;
    return (
      <Component
        href={href}
        className="text-blue-600 hover:text-blue-800 underline transition-colors"
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
      </Component>
    );
  }),
  
  img: withFallback(({ src, alt, ...props }: any) => (
    <SafeImage
      src={src}
      alt={alt || ""}
      width={Number(1200)}
      height={Number(800)}
      priority={false}
      className="rounded-lg shadow-md"
      {...props}
    />
  )),
  
  h1: withFallback(({ children, ...props }: any) => (
    <h1 className="text-4xl font-bold mt-8 mb-4 text-gray-900" {...props}>
      {children}
    </h1>
  )),
  
  h2: withFallback(({ children, ...props }: any) => (
    <h2 className="text-3xl font-semibold mt-6 mb-3 text-gray-800" {...props}>
      {children}
    </h2>
  )),
  
  h3: withFallback(({ children, ...props }: any) => (
    <h3 className="text-2xl font-medium mt-5 mb-2 text-gray-700" {...props}>
      {children}
    </h3>
  )),
  
  p: withFallback(({ children, ...props }: any) => (
    <p className="my-4 text-gray-700 leading-relaxed" {...props}>
      {children}
    </p>
  )),
  
  ul: withFallback(({ children, ...props }: any) => (
    <ul className="my-4 list-disc list-inside space-y-2" {...props}>
      {children}
    </ul>
  )),
  
  ol: withFallback(({ children, ...props }: any) => (
    <ol className="my-4 list-decimal list-inside space-y-2" {...props}>
      {children}
    </ol>
  )),
  
  li: withFallback(({ children, ...props }: any) => (
    <li className="text-gray-700" {...props}>
      {children}
    </li>
  )),
  
  blockquote: withFallback(({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-gold pl-4 my-6 italic text-gray-600" {...props}>
      {children}
    </blockquote>
  )),
  
  code: withFallback(({ children, ...props }: any) => (
    <code className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono" {...props}>
      {children}
    </code>
  )),
  
  pre: withFallback(({ children, ...props }: any) => (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4" {...props}>
      {children}
    </pre>
  )),
  
  table: withFallback(({ children, ...props }: any) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse border border-gray-300" {...props}>
        {children}
      </table>
    </div>
  )),
  
  th: withFallback(({ children, ...props }: any) => (
    <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold" {...props}>
      {children}
    </th>
  )),
  
  td: withFallback(({ children, ...props }: any) => (
    <td className="border border-gray-300 px-4 py-2" {...props}>
      {children}
    </td>
  )),
};

export const getSafeComponents = (custom: Record<string, any> = {}): Record<string, any> => {
  const map = { ...baseComponents };
  
  // Ensure all required components exist
  const required = [
    "BrandFrame",
    "HeroEyebrow", 
    "ResourcesCTA",
    "JsonLd",
    "Caption",
    "CTA",
    "CTAGroup",
    "PrimaryCTA",
    "SecondaryCTA", 
    "OutlineCTA"
  ];

  for (const comp of required) {
    if (!map[comp]) {
      map[comp] = ({ children, className = "" }: any) => (
        <div className={`mdx-fallback ${comp.toLowerCase()} ${className}`} data-fallback={comp}>
          {children}
        </div>
      );
    }
  }

  return { ...map, ...custom };
};

export default baseComponents;