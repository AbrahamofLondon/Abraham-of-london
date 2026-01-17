'use client';

import * as React from "react";
import Image from "next/image";
import Link, { LinkProps } from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import Rule from "@/components/mdx/Rule";

/* -------------------------------------------------------------------------- */
/* 1. PRIMITIVE TYPES FOR STRICT TYPE SAFETY                                 */
/* -------------------------------------------------------------------------- */

type InternalLinkProps = Omit<LinkProps, 'href'> & {
  href: string;
  children: React.ReactNode;
  className?: string;
  onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLAnchorElement>;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  // Explicitly omit problematic event handlers that Next.js Link doesn't support
  onAuxClick?: never;
  onContextMenu?: never;
  onDragStart?: never;
  // All other HTML attributes
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 
  'href' | 'onMouseEnter' | 'onMouseLeave' | 'onClick'
>;

/* -------------------------------------------------------------------------- */
/* 2. PREMIUM TYPOGRAPHY SYSTEM                                              */
/* -------------------------------------------------------------------------- */

const H1: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h1 className="mt-8 mb-6 font-serif text-4xl font-bold tracking-tight text-deepCharcoal md:text-5xl lg:text-6xl bg-gradient-to-r from-deepCharcoal via-deepCharcoal/90 to-deepCharcoal/80 bg-clip-text text-transparent">
    {children}
  </h1>
);

const H2: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="relative mt-10 mb-6">
    <div className="absolute -left-4 top-0 h-full w-1 bg-gradient-to-b from-softGold/30 to-transparent"></div>
    <h2 className="font-serif text-2xl font-semibold tracking-tight text-deepCharcoal md:text-3xl pl-3 border-l-2 border-softGold/20">
      {children}
    </h2>
  </div>
);

const H3: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h3 className="mt-8 mb-4 font-serif text-xl font-medium tracking-tight text-deepCharcoal md:text-2xl flex items-center gap-3">
    <ChevronRight className="w-5 h-5 text-softGold/60 flex-shrink-0" />
    {children}
  </h3>
);

const P: React.FC<React.PropsWithChildren> = ({ children }) => (
  <p className="my-5 text-[color:var(--color-on-secondary)/0.85] leading-relaxed tracking-wide font-light max-w-3xl">
    {children}
  </p>
);

const Ul: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ul className="my-5 space-y-3 pl-5 text-[color:var(--color-on-secondary)/0.85] max-w-3xl">
    {children}
  </ul>
);

const Ol: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ol className="my-5 space-y-3 pl-5 text-[color:var(--color-on-secondary)/0.85] max-w-3xl list-decimal list-outside marker:text-softGold/60 marker:font-medium">
    {children}
  </ol>
);

const Li: React.FC<React.PropsWithChildren> = ({ children }) => (
  <li className="leading-relaxed pl-2 relative before:absolute before:left-[-1rem] before:top-3 before:w-1.5 before:h-1.5 before:rounded-full before:bg-softGold/30">
    {children}
  </li>
);

const Strong: React.FC<React.PropsWithChildren> = ({ children }) => (
  <strong className="font-semibold text-deepCharcoal bg-gradient-to-r from-softGold/10 to-softGold/5 px-1 py-0.5 rounded">
    {children}
  </strong>
);

const Em: React.FC<React.PropsWithChildren> = ({ children }) => (
  <em className="italic text-deepCharcoal/90 tracking-tight">{children}</em>
);

const Blockquote: React.FC<React.PropsWithChildren> = ({ children }) => (
  <blockquote className="my-8 relative pl-8 py-6 border-l-4 border-softGold/50 bg-gradient-to-r from-warmWhite/50 to-warmWhite/30 rounded-r-2xl shadow-sm">
    <div className="absolute top-0 left-0 w-12 h-12 opacity-10">
      <div className="w-4 h-4 bg-softGold absolute top-2 left-2 rounded-full"></div>
      <div className="w-6 h-6 bg-softGold absolute bottom-2 right-2 rounded-full"></div>
    </div>
    <div className="text-lg font-light text-deepCharcoal/90 tracking-wide leading-relaxed relative z-10">
      {children}
    </div>
  </blockquote>
);

/* -------------------------------------------------------------------------- */
/* 3. PREMIUM LINK SYSTEM WITH STRICT TYPES                                  */
/* -------------------------------------------------------------------------- */

const A: React.FC<InternalLinkProps> = ({ 
  href = "#", 
  children, 
  onMouseEnter,
  onMouseLeave,
  onClick,
  className = "",
  ...rest 
}) => {
  const isExternal = /^https?:\/\//i.test(href);
  
  // Handle event handlers safely
  const eventHandlers = {
    ...(onMouseEnter && { onMouseEnter }),
    ...(onMouseLeave && { onMouseLeave }),
    ...(onClick && { onClick }),
  };

  if (isExternal) {
    return (
      <a
        href={href}
        className={`luxury-link group relative inline-flex items-center gap-1.5 text-softGold hover:text-softGold/80 transition-all duration-300 font-medium tracking-wide border-b border-softGold/20 hover:border-softGold/40 pb-0.5 ${className}`}
        target="_blank"
        rel="noopener noreferrer"
        {...eventHandlers}
        {...rest}
      >
        {children}
        <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  }

  // Internal route - use Next.js Link with filtered props
  return (
    <Link 
      href={href} 
      className={`luxury-link group relative inline-flex items-center gap-1.5 text-softGold hover:text-softGold/80 transition-all duration-300 font-medium tracking-wide border-b border-softGold/20 hover:border-softGold/40 pb-0.5 ${className}`}
      {...eventHandlers}
    >
      {children}
      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. PREMIUM IMAGE COMPONENT                                                */
/* -------------------------------------------------------------------------- */

type ImgProps = {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  caption?: string;
};

const Img: React.FC<ImgProps> = ({
  src,
  alt = "",
  width = 800,
  height = 450,
  className = "",
  caption,
}) => (
  <figure className="my-10 w-full group">
    <div className="relative w-full rounded-2xl overflow-hidden border border-lightGrey/30 bg-gradient-to-br from-warmWhite/50 to-warmWhite/20 shadow-lg transition-all duration-500 hover:shadow-xl hover:border-softGold/20">
      {src ? (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`object-cover transition-transform duration-700 group-hover:scale-105 ${className}`}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 rounded"></div>
            </div>
            <p className="text-sm">Image not found</p>
          </div>
        </div>
      )}
    </div>
    {caption && (
      <figcaption className="mt-3 text-center text-sm text-gray-600 font-light tracking-wide italic px-4">
        {caption}
      </figcaption>
    )}
  </figure>
);

/* -------------------------------------------------------------------------- */
/* 5. PREMIUM CUSTOM COMPONENTS                                              */
/* -------------------------------------------------------------------------- */

type NoteProps = React.PropsWithChildren<{
  title?: string;
  tone?: "info" | "warning" | "success" | "premium";
  icon?: React.ReactNode;
}>;

const Note: React.FC<NoteProps> = ({ title, tone = "info", icon, children }) => {
  const toneConfig = {
    info: {
      border: "border-sky-300/40",
      bg: "bg-gradient-to-br from-sky-50/70 to-white",
      iconBg: "bg-sky-500",
      titleColor: "text-sky-800",
    },
    warning: {
      border: "border-amber-300/40",
      bg: "bg-gradient-to-br from-amber-50/70 to-white",
      iconBg: "bg-amber-500",
      titleColor: "text-amber-800",
    },
    success: {
      border: "border-emerald-300/40",
      bg: "bg-gradient/to-br from-emerald-50/70 to-white",
      iconBg: "bg-emerald-500",
      titleColor: "text-emerald-800",
    },
    premium: {
      border: "border-softGold/40",
      bg: "bg-gradient-to-br from-softGold/5 via-warmWhite/50 to-white",
      iconBg: "bg-gradient-to-br from-softGold to-gold",
      titleColor: "text-deepCharcoal",
    },
  }[tone];

  return (
    <aside className={`my-8 rounded-2xl border ${toneConfig.border} ${toneConfig.bg} p-6 shadow-sm backdrop-blur-sm`}>
      <div className="flex items-start gap-4">
        {icon || (
          <div className={`w-10 h-10 rounded-full ${toneConfig.iconBg} flex items-center justify-center text-white flex-shrink-0 mt-1`}>
            <div className="w-4 h-4 border-2 border-white rounded"></div>
          </div>
        )}
        <div className="flex-1">
          {title && (
            <p className={`mb-3 font-semibold tracking-wide ${toneConfig.titleColor} text-lg`}>
              {title}
            </p>
          )}
          <div className="text-gray-700/90 font-light leading-relaxed tracking-wide">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
};

type QuoteProps = React.PropsWithChildren<{
  author?: string;
  authorTitle?: string;
  source?: string;
}>;

const Quote: React.FC<QuoteProps> = ({ children, author, authorTitle, source }) => (
  <figure className="my-10 p-8 bg-gradient-to-br from-warmWhite/60 to-warmWhite/30 rounded-3xl border border-softGold/20 shadow-sm relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
      <div className="absolute top-4 right-4 w-16 h-16 border-2 border-softGold rounded-full"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border border-softGold rounded-full"></div>
    </div>
    <div className="relative z-10">
      <div className="text-2xl font-serif font-light text-deepCharcoal/90 tracking-wide leading-relaxed italic mb-6">
        "{children}"
      </div>
      {(author || source) && (
        <figcaption className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-softGold/10">
          <div>
            {author && (
              <p className="font-medium text-deepCharcoal tracking-wide">
                {author}
                {authorTitle && <span className="text-gray-600 text-sm ml-2">• {authorTitle}</span>}
              </p>
            )}
          </div>
          {source && (
            <p className="text-sm text-gray-500 font-light tracking-wide">
              {source}
            </p>
          )}
        </figcaption>
      )}
    </div>
  </figure>
);

type VerseProps = React.PropsWithChildren<{
  refText?: string;
  version?: string;
}>;

const Verse: React.FC<VerseProps> = ({ children, refText, version }) => (
  <div className="my-8 p-6 rounded-2xl bg-gradient-to-br from-deepCharcoal/5 via-deepCharcoal/2 to-transparent border border-deepCharcoal/10">
    <div className="font-serif text-lg font-light text-deepCharcoal/90 leading-relaxed tracking-wide italic">
      {children}
    </div>
    {(refText || version) && (
      <div className="mt-4 pt-4 border-t border-deepCharcoal/10 flex flex-wrap items-center justify-between gap-3">
        {refText && (
          <p className="text-sm font-medium uppercase tracking-wider text-softGold">
            {refText}
          </p>
        )}
        {version && (
          <p className="text-xs text-gray-500 font-light">
            {version}
          </p>
        )}
      </div>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/* 6. PREMIUM UTILITY COMPONENTS                                             */
/* -------------------------------------------------------------------------- */

const JsonLd: React.FC<{ children?: React.ReactNode; [key: string]: unknown }> = () => null;

const ShareRow: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="mt-10 pt-8 border-t border-lightGrey/30 flex flex-wrap items-center justify-between gap-4">
    <div className="text-sm text-gray-500 font-light tracking-wide">
      Share this event
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {children}
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* 7. NEW PREMIUM COMPONENTS FOR EVENTS                                      */
/* -------------------------------------------------------------------------- */

type CountdownProps = {
  date: Date;
  title?: string;
  compact?: boolean;
};

const Countdown: React.FC<CountdownProps> = ({ date, title = "Event starts in", compact = false }) => {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +date - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [date]);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-softGold/10 to-softGold/5 border border-softGold/20">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-deepCharcoal">{timeLeft.days}d</span>
          <span className="text-gray-400">:</span>
          <span className="text-sm font-medium text-deepCharcoal">{timeLeft.hours}h</span>
          <span className="text-gray-400">:</span>
          <span className="text-sm font-medium text-deepCharcoal">{timeLeft.minutes}m</span>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8 p-6 rounded-2xl bg-gradient-to-br from-warmWhite/60 to-white border border-lightGrey/30 shadow-sm">
      {title && (
        <p className="text-sm text-gray-500 font-light tracking-wide mb-4">{title}</p>
      )}
      <div className="flex items-center justify-center gap-4">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-softGold/10 to-softGold/5 border border-softGold/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-deepCharcoal">
                {value.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs text-gray-500 font-light mt-2 uppercase tracking-wider">
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

type SpeakerCardProps = {
  name: string;
  title: string;
  company?: string;
  image?: string;
  topics?: string[];
  social?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
};

const SpeakerCard: React.FC<SpeakerCardProps> = ({ 
  name, 
  title, 
  company, 
  image, 
  topics = [], 
  social 
}) => (
  <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-warmWhite/50 to-white border border-lightGrey/30 hover:border-softGold/30 transition-all duration-300 hover:shadow-lg">
    <div className="flex items-start gap-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-softGold/20 group-hover:border-softGold/40 transition-colors">
          {image ? (
            <Image
              src={image}
              alt={name}
              width={80}
              height={80}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-softGold/20 to-softGold/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-deepCharcoal/50">
                {name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-serif text-xl font-semibold text-deepCharcoal mb-1">
          {name}
        </h4>
        <p className="text-gray-600 text-sm font-light mb-2">
          {title}
          {company && <span className="text-gray-500"> • {company}</span>}
        </p>
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {topics.map((topic, index) => (
              <span
                key={index}
                className="px-2.5 py-1 text-xs rounded-full bg-gradient-to-r from-softGold/10 to-softGold/5 border border-softGold/20 text-gray-700 font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* 8. EXPORT MAPPING                                                         */
/* -------------------------------------------------------------------------- */

const mdxComponents = {
  // Premium Typography
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  ul: Ul,
  ol: Ol,
  li: Li,
  strong: Strong,
  em: Em,
  blockquote: Blockquote,

  // Separators
  hr: () => <Rule />,
  Rule,

  // Premium Links & Images
  a: A,
  img: Img,

  // Premium Custom Components
  Note,
  Quote,
  Verse,
  JsonLd,
  ShareRow,

  // New Premium Event Components
  Countdown,
  SpeakerCard,
};

export default mdxComponents;