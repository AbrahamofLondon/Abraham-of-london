import React, { useState } from 'react';
import { 
  Share2, 
  Link, 
  Twitter, 
  Linkedin, 
  MessageCircle,
  Mail,
  Check
} from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
  excerpt?: string;
  className?: string;
}

// Discriminated union for share actions
type ShareAction = 
  | { type: 'link'; name: string; icon: React.ElementType; color: string; bg: string; border: string; onClick: () => Promise<void> }
  | { type: 'href'; name: string; icon: React.ElementType; color: string; bg: string; border: string; href: string };

const ShareButtons: React.FC<ShareButtonsProps> = ({ 
  url, 
  title, 
  excerpt = '',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedExcerpt = encodeURIComponent(excerpt);

  // Define share links with proper typing
  const shareLinks: ShareAction[] = [
    {
      type: 'link',
      name: 'Copy Link',
      icon: copied ? Check : Link,
      color: 'text-gray-700 hover:text-amber-600',
      bg: 'bg-white hover:bg-amber-50',
      border: 'border-gray-200 hover:border-amber-300',
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy link:', err);
        }
      }
    },
    {
      type: 'href',
      name: 'Twitter',
      icon: Twitter,
      color: 'text-gray-700 hover:text-blue-500',
      bg: 'bg-white hover:bg-blue-50',
      border: 'border-gray-200 hover:border-blue-300',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=abrahamoflondon`
    },
    {
      type: 'href',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-gray-700 hover:text-blue-700',
      bg: 'bg-white hover:bg-blue-50',
      border: 'border-gray-200 hover:border-blue-400',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    },
    {
      type: 'href',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-gray-700 hover:text-emerald-500',
      bg: 'bg-white hover:bg-emerald-50',
      border: 'border-gray-200 hover:border-emerald-300',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
    },
    {
      type: 'href',
      name: 'Email',
      icon: Mail,
      color: 'text-gray-700 hover:text-gray-900',
      bg: 'bg-white hover:bg-gray-50',
      border: 'border-gray-200 hover:border-gray-300',
      href: `mailto:?subject=${encodedTitle}&body=${encodedExcerpt}%0A%0A${url}`
    }
  ];

  const handleWebShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: excerpt,
          url,
        });
      } catch (err) {
        // User cancelled share – ignore
      }
    } else {
      // Fallback to copy link
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-3">
        {shareLinks.map((share) => {
          const Icon = share.icon;
          if (share.type === 'href') {
            return (
              <a
                key={share.name}
                href={share.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  group relative flex items-center justify-center
                  w-12 h-12 rounded-xl border transition-all duration-300
                  ${share.bg} ${share.border} ${share.color}
                  hover:shadow-md hover:scale-105
                `}
                aria-label={`Share on ${share.name}`}
              >
                <Icon className="w-5 h-5" />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  {share.name}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </a>
            );
          } else {
            // type === 'link'
            return (
              <button
                key={share.name}
                onClick={share.onClick}
                className={`
                  group relative flex items-center justify-center
                  w-12 h-12 rounded-xl border transition-all duration-300
                  ${share.bg} ${share.border} ${share.color}
                  hover:shadow-md hover:scale-105
                  ${copied && share.name === 'Copy Link' ? '!bg-emerald-50 !border-emerald-200 !text-emerald-600' : ''}
                `}
                aria-label={share.name}
              >
                <Icon className="w-5 h-5" />
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  {copied && share.name === 'Copy Link' ? 'Copied!' : share.name}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </button>
            );
          }
        })}
      </div>

      {/* Web Share Button */}
      <button
        onClick={handleWebShare}
        className="group w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-200 text-amber-700 hover:from-amber-500/20 hover:to-amber-600/10 hover:border-amber-300 hover:text-amber-800 hover:shadow-sm transition-all duration-300"
      >
        <Share2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
        <span className="text-sm font-semibold tracking-wide">
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? 'Share via Device' : 'Share This Event'}
        </span>
      </button>
    </div>
  );
};

export default ShareButtons;