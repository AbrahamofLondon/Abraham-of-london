// components/MDXComponents.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MDXComponents as MDXComponentsType } from 'mdx/types';
import * as React from 'react';

/* ---------------- utils ---------------- */

const isInternal = (href = '') => href.startsWith('/') || href.startsWith('#');

function toNumber(v?: number | string) {
  if (v == null) return undefined;
  if (typeof v === 'number') return v;
  const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
}

/* ---------------- MDX <a> ---------------- */

const A: MDXComponentsType['a'] = ({ href = '', children, className, title }) => {
  const base =
    'text-forest underline underline-offset-2 hover:text-softGold transition-colors ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ' +
    'dark:text-softGold dark:hover:text-cream dark:focus-visible:ring-softGold';
  const cls = className ? `${base} ${className}` : base;

  if (isInternal(href)) {
    return (
      <Link href={href} prefetch={false} className={cls} title={title}>
        {children}
      </Link>
    );
  }

  const isHttp = /^https?:\/\//i.test(href);
  const externalProps = isHttp ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <a href={href} className={cls} title={title} {...externalProps}>
      {children}
      {isHttp && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
};

/* ---------------- MDX <img> -> next/image (with fallbacks) ---------------- */

type MDXImgProps = React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

const DEFAULT_IMG = '/assets/images/default-book.jpg';

const Img: React.FC<MDXImgProps> = ({ src, alt, className, title, width, height }) => {
  const safeSrc = src || DEFAULT_IMG;
  const w = toNumber(width);
  const h = toNumber(height);
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  // Respect explicit decorative images: alt === "" stays empty.
  const altText = alt === '' ? '' : alt ?? (title ? String(title) : 'Image');

  const isRemote = /^https?:\/\//i.test(String(safeSrc));

  // If remote and not whitelisted in next.config.js -> plain <img>
  if (isRemote) {
    return (
      <figure className="my-6">
        <img
          src={String(safeSrc)}
          alt={altText}
          width={w}
          height={h}
          className={className || 'w-full h-auto rounded-lg shadow-card object-cover'}
          loading="lazy"
        />
        {title && (
          <figcaption className="mt-2 text-sm text-deepCharcoal/70 dark:text-cream/80">
            {title}
          </figcaption>
        )}
      </figure>
    );
  }

  const skeleton =
    'bg-gradient-to-r from-lightGrey/20 via-lightGrey/40 to-lightGrey/20 animate-[shimmer_1.8s_linear_infinite]';

  return (
    <figure className="my-6">
      {w && h ? (
        <div className="relative" style={{ width: w, height: h }}>
          {!loaded && !failed && <span className={`absolute inset-0 ${skeleton}`} aria-hidden="true" />}
          <Image
            src={failed ? DEFAULT_IMG : String(safeSrc)}
            alt={altText}
            width={w}
            height={h}
            sizes="(max-width: 768px) 100vw, 800px"
            className={className || 'rounded-lg shadow-card object-cover'}
            loading="lazy"
            onLoadingComplete={() => setLoaded(true)}
            onError={() => setFailed(true)}
            priority={false}
          />
        </div>
      ) : (
        <span className={`block relative w-full h-96 rounded-lg overflow-hidden shadow-card ${className || ''}`}>
          {!loaded && !failed && (
            <>
              <style jsx>{`
                @keyframes shimmer {
                  0% {
                    background-position: -200% 0;
                  }
                  100% {
                    background-position: 200% 0;
                  }
                }
              `}</style>
              <span className={`absolute inset-0 ${skeleton}`} aria-hidden="true" />
            </>
          )}
          <Image
            src={failed ? DEFAULT_IMG : String(safeSrc)}
            alt={altText}
            fill
            sizes="100vw"
            className="object-cover"
            loading="lazy"
            onLoadingComplete={() => setLoaded(true)}
            onError={() => setFailed(true)}
            priority={false}
          />
        </span>
      )}
      {title && (
        <figcaption className="mt-2 text-sm text-deepCharcoal/70 dark:text-cream/80">{title}</figcaption>
      )}
    </figure>
  );
};

/* ---------------- YouTube ---------------- */

type YouTubeProps = { id?: string; url?: string; title?: string; className?: string; start?: number };

function parseYouTubeId(urlOrId?: string): string | null {
  if (!urlOrId) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  try {
    const u = new URL(urlOrId);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '') || null;
    if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = u.pathname.match(/\/(embed|shorts)\/([a-zA-Z0-9_-]{11})/);
      if (m) return m[2];
    }
  } catch {}
  return null;
}

export const YouTube: React.FC<YouTubeProps> = ({ id, url, title, className, start }) => {
  const videoId = id || parseYouTubeId(url || '');
  if (!videoId) return null;
  const src = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  if (typeof start === 'number' && start > 0) src.searchParams.set('start', String(start));

  return (
    <div className={`relative w-full overflow-hidden rounded-lg shadow-card ${className || ''}`} style={{ aspectRatio: '16 / 9' }}>
      <iframe
        src={src.toString()}
        title={title || 'YouTube video'}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  );
};

/* ---------------- Safe iframe mapper ---------------- */

type IframeProps = React.ComponentProps<'iframe'> & { className?: string };

const ALLOWED_IFRAME_HOSTS = [
  'www.youtube-nocookie.com',
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'player.vimeo.com',
  'open.spotify.com',
];

const Iframe: React.FC<IframeProps> = ({ src = '', title = 'Embedded content', className, ...rest }) => {
  let url: URL | null = null;
  try {
    url = new URL(src);
  } catch {}
  const allowed = !!url && ALLOWED_IFRAME_HOSTS.some((h) => url!.hostname.endsWith(h));
  if (!allowed) {
    return (
      <div className="my-6 rounded-md border p-4 text-sm text-deepCharcoal/70 dark:text-cream/80">
        Embedded content blocked for security. Allowed: YouTube, Vimeo, Spotify.
      </div>
    );
  }
  if (url!.hostname.includes('youtube.com') || url!.hostname.includes('youtu.be')) {
    const id = parseYouTubeId(src);
    if (id) return <YouTube id={id} title={title} className={className} />;
  }
  return (
    <div className={`relative w-full overflow-hidden rounded-lg shadow-card ${className || ''}`} style={{ aspectRatio: '16 / 9' }}>
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        {...rest}
      />
    </div>
  );
};

/* ---------------- export to MDX ---------------- */

export const MDXComponents: MDXComponentsType = {
  a: A,
  img: (props) => <Img {...(props as MDXImgProps)} />,
  YouTube,
  iframe: Iframe,
};

export default MDXComponents;
