// components/mdx/CTAGroup.tsx
import React from 'react';

interface CTAGroupProps {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  [key: string]: any;
}

export default function CTAGroup({ 
  children, 
  className = '', 
  align = 'left',
  ...props 
}: CTAGroupProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div 
      className={`flex flex-wrap gap-4 ${alignClasses[align]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}