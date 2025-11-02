// components/mdx/BadgeRow.tsx
import * as React from 'react';

/**
 * Container for multiple Badge components.
 */
export default function BadgeRow({ children }: React.PropsWithChildren) {
    return <div className="flex flex-wrap gap-2 my-4">{children}</div>;
}