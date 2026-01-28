import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionHeaderProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  excerpt?: string;
  category?: string;
  label?: string;
  featured?: boolean;
  displayDate?: string | null;
  readTime?: string;
  viewCount?: number | null;
  author?: string;
  tags?: string[];
}

export default function MotionHeader(props: MotionHeaderProps) {
  const {
    children,
    className = '',
    title = '',
    excerpt = '',
    category = '',
    label = '',
    featured = false,
    displayDate = null,
    readTime = '',
    viewCount = null,
    author = '',
    tags = []
  } = props;
  
  return (
    <motion.header
      className={className}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children || (
        <div>
          <div className="mb-6">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {category || label}
            </span>
            {featured && (
              <span className="ml-2 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
                Featured
              </span>
            )}
          </div>
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            {title}
          </h1>
          {excerpt && (
            <p className="mt-6 text-xl text-gray-300">{excerpt}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-gray-400">
            {displayDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {displayDate}
              </span>
            )}
            {readTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readTime}
              </span>
            )}
            {viewCount !== null && (
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {viewCount.toLocaleString()} views
              </span>
            )}
            {author && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {author}
              </span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.header>
  );
}