// components/primitives/ProgressBar.tsx
// Progress bar component using design system tokens

import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showValue = true,
  size = 'md',
  className,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between">
          {label && (
            <span className={cn(
              'font-medium',
              textSizeClasses[size],
              'text-[var(--ds-text-muted)]'
            )}>
              {label}
            </span>
          )}
          {showValue && (
            <span className={cn(
              'font-mono',
              textSizeClasses[size],
              'text-[var(--ds-text-muted)]'
            )}>
              {clampedValue}%
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        'w-full rounded-full bg-[var(--ds-panel-alt)]',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-[var(--ds-accent)] to-[var(--ds-amber-400)] transition-all duration-700',
            sizeClasses[size]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};

// Pre-configured variants
export const ProgressBarVariants = {
  // Book writing progress
  BookWriting: (props: Omit<ProgressBarProps, 'label' | 'showValue'>) => (
    <ProgressBar
      label="Writing Progress"
      showValue={true}
      size="md"
      {...props}
    />
  ),
  
  // Compact progress
  Compact: (props: Omit<ProgressBarProps, 'label' | 'showValue' | 'size'>) => (
    <ProgressBar
      showValue={false}
      size="sm"
      {...props}
    />
  ),
  
  // Featured progress
  Featured: (props: Omit<ProgressBarProps, 'label' | 'showValue' | 'size'>) => (
    <ProgressBar
      label="Progress"
      showValue={true}
      size="lg"
      {...props}
    />
  ),
};