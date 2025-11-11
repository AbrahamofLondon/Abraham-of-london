import { FC, ReactNode } from 'react';

interface QuoteProps {
  children: ReactNode;
  cite?: string;
}

export const Quote: FC<QuoteProps> = ({ children, cite }) => {
  return (
    <blockquote cite={cite}>
      {children}
    </blockquote>
  );
};