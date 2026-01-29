// components/mdx/EmbossedBrandMark.tsx
import React from 'react';

interface EmbossedBrandMarkProps {
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'gold';
}

const EmbossedBrandMark: React.FC<EmbossedBrandMarkProps> = ({ 
  children, 
  className = '',
  size = 'md',
  variant = 'dark'
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const variantClasses = {
    light: 'bg-gradient-to-br from-white to-gray-100 border-gray-200 text-gray-800',
    dark: 'bg-gradient-to-br from-gray-900 to-black border-gray-800 text-gray-300',
    gold: 'bg-gradient-to-br from-amber-900/20 to-gold/10 border-gold/30 text-gold'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        rounded-xl border shadow-inner
        flex items-center justify-center
        ${className}
      `}
    >
      {children || (
        <div className="text-center">
          <div className="text-sm font-bold uppercase tracking-widest opacity-80">
            Abraham of London
          </div>
          <div className="text-xs mt-1 opacity-60">
            Institutional Intelligence
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbossedBrandMark;