// components/Quote.tsx (FIXED - no irregular whitespace)
import { FC, ReactNode } from 'react';

interface QuoteProps {
  children: ReactNode;
  cite?: string;
}

const Quote: FC<QuoteProps> = ({ children, cite }) => {
  return (
    <blockquote className="border-l-4 border-gold pl-6 py-2 my-6 italic text-gray-700 dark:text-gray-300 bg-charcoal-light rounded-r-lg" cite={cite}>
      <div className="text-lg leading-relaxed">
        {children}
      </div>
      {cite && (
        <footer className="mt-4 text-sm text-gray-500 dark:text-gray-400 not-italic">
          — {cite}
        </footer>
      )}
    </blockquote>
  );
};

export default Quote;