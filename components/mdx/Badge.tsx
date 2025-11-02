// components/mdx/Badge.tsx
import * as React from 'react';
import clsx from 'clsx';

interface BadgeProps extends React.PropsWithChildren {
    variant?: 'default' | 'subtle';
}

/**
 * Renders a small tag/badge.
 */
export default function Badge({ children, variant = 'default' }: BadgeProps) {
    const classes = clsx(
        "inline-block px-2 py-0.5 text-xs font-medium rounded-full",
        {
            'bg-gray-200 text-gray-800': variant === 'default',
            'bg-green-100 text-green-800': variant === 'subtle',
        }
    );
    return <span className={classes}>{children}</span>;
}