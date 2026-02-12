import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import Link from 'next/link';

interface MotionNavProps {
  children?: ReactNode;
  className?: string;
  backHref?: string;
  label?: string;
  onShare?: () => void;
  isBookmarked?: boolean;
  toggleBookmark?: () => void;
  isShareTooltipVisible?: boolean;  // ✅ Now used
}

export default function MotionNav({
  children,
  className = '',
  backHref = '/',
  label = '',
  onShare,
  isBookmarked = false,
  toggleBookmark,
  isShareTooltipVisible = false,
}: MotionNavProps) {
  return (
    <motion.nav
      className={className}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children || (
        <div className="flex items-center justify-between p-6">
          {/* Back link with Next.js Link and accessible label */}
          <Link
            href={backHref}
            className="text-amber-400 hover:text-amber-300"
            aria-label={label ? `Back to ${label}` : 'Back'}
          >
            ← {label ? `Back to ${label}` : 'Back'}
          </Link>

          <div className="flex gap-4">
            {/* Share button with tooltip */}
            {onShare && (
              <div className="relative">
                <button
                  type="button"
                  onClick={onShare}
                  className="text-gray-400 hover:text-white"
                  aria-label="Share this page"
                  aria-describedby={isShareTooltipVisible ? 'share-tooltip' : undefined}
                >
                  Share
                </button>
                {/* ✅ Tooltip – shown when isShareTooltipVisible is true */}
                {isShareTooltipVisible && (
                  <div
                    id="share-tooltip"
                    role="tooltip"
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-amber-500 px-2 py-1 text-xs font-medium text-black shadow-lg"
                  >
                    Link copied!
                  </div>
                )}
              </div>
            )}

            {/* Bookmark toggle */}
            {toggleBookmark && (
              <button
                type="button"
                onClick={toggleBookmark}
                className="text-gray-400 hover:text-amber-400"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {isBookmarked ? '★' : '☆'}
              </button>
            )}
          </div>
        </div>
      )}
    </motion.nav>
  );
}