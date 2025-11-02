// components/mdx/Callout.tsx
import * as React from 'react';
import clsx from 'clsx';

type Tone = 'info' | 'caution' | 'key' | 'default';

interface CalloutProps extends React.PropsWithChildren {
  title?: string;
  tone?: Tone;
}

/**
 * Renders a callout box with contextual styling.
 * Assumes Tailwind color variables are defined (e.g., bg-blue-50, border-blue-600).
 */
export default function Callout({ children, title, tone = 'default' }: CalloutProps) {
  const classes = clsx('p-4 rounded-lg border-l-4 my-6', {
    'bg-blue-50 border-blue-600 text-blue-800': tone === 'info',
    'bg-yellow-50 border-yellow-600 text-yellow-800': tone === 'caution',
    'bg-green-50 border-green-600 text-green-800': tone === 'key',
    'bg-gray-50 border-gray-300 text-gray-700': tone === 'default',
  });
  
  return (
    <div className={classes}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={clsx({ 'mt-2': !!title })}>{children}</div>
    </div>
  );
}