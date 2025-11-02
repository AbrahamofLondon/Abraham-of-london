// components/mdx/ShareRow.tsx
import * as React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
// Assuming you have a small SocialIcon component or just use text/emoji
import { Share2 } from 'lucide-react'; 

interface ShareRowProps {
  text?: string;
  hashtags?: string;
}

/**
 * Renders a row with social media sharing links.
 */
export default function ShareRow({ text = '', hashtags = '' }: ShareRowProps) {
  const encodedText = encodeURIComponent(text);
  const encodedHashtags = encodeURIComponent(hashtags.replace(/\s+/g, ','));
  const url = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://www.abrahamoflondon.org');

  const shareLinks = [
    { name: 'Twitter (X)', href: `https://twitter.com/intent/tweet?url=${url}&text=${encodedText}&hashtags=${encodedHashtags}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { name: 'Email', href: `mailto:?subject=${encodedText}&body=Check out this article: ${url}` },
  ];

  return (
    <div className="mt-12 py-4 border-t border-gray-200">
      <h4 className="font-semibold text-sm text-deepCharcoal mb-3">Share This Insight</h4>
      <div className="flex flex-wrap gap-3">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition'
            )}
          >
            <Share2 className="w-4 h-4" />
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}