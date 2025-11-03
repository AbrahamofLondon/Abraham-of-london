// components/mdx/Caption.tsx
import * as React from 'react';

/**
 * Renders an italic, centered caption for images or pull quotes.
 */
export default function Caption({ children }: React.PropsWithChildren) {
  return (
    <p className="mt-2 text-sm text-center text-gray-500 italic">
        {children}
    </p>
  );
}
