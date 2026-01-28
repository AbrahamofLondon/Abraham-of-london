import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionNavProps {
  children?: ReactNode;
  className?: string;
  backHref?: string;
  label?: string;
  onShare?: () => void;
  isBookmarked?: boolean;
  toggleBookmark?: () => void;
  isShareTooltipVisible?: boolean;
}

export default function MotionNav(props: MotionNavProps) {
  const {
    children,
    className = '',
    backHref = '/',
    label = '',
    onShare,
    isBookmarked = false,
    toggleBookmark,
    isShareTooltipVisible = false
  } = props;
  
  return (
    <motion.nav
      className={className}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children || (
        <div className="flex items-center justify-between p-6">
          <a href={backHref} className="text-amber-400 hover:text-amber-300">
            ← Back to {label}
          </a>
          <div className="flex gap-4">
            {onShare && (
              <button onClick={onShare} className="text-gray-400 hover:text-white">
                Share
              </button>
            )}
            {toggleBookmark && (
              <button onClick={toggleBookmark} className="text-gray-400 hover:text-amber-400">
                {isBookmarked ? '★' : '☆'}
              </button>
            )}
          </div>
        </div>
      )}
    </motion.nav>
  );
}