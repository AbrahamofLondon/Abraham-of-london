// components/mdx/CTA.tsx
import * as React from 'react';
import Link from 'next/link';
import clsx from 'clsx';

interface CTAProps {
    title?: string;
    body?: string;
    href: string;
    label: string;
}

/**
 * Renders a bold Call-to-Action block.
 */
export default function CTA({ title, body, href, label }: CTAProps) {
    return (
        <div className="bg-deepCharcoal text-cream rounded-lg p-6 my-8 shadow-xl">
            {title && <h3 className="font-serif text-2xl font-semibold mb-2">{title}</h3>}
            {body && <p className="mb-4 text-sm opacity-80">{body}</p>}
            <Link 
                href={href}
                className={clsx(
                    "inline-block px-5 py-2 text-sm font-semibold rounded-full",
                    "bg-muted-gold text-deep-forest hover:bg-opacity-90 transition"
                )}
            >
                {label}
            </Link>
        </div>
    );
}