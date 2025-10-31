// components/mdx/ShareRow.tsx
import * as React from "react";
import clsx from "clsx";
import Link from "next/link";

export default function ShareRow({ 
    title = "Check this out!", // 👈 Defensive default
    url, 
    className 
}: { 
    title?: string; 
    url: string; 
    className?: string 
}) {
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);
    
    const platforms = [
        { name: "Twitter", url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
        { name: "LinkedIn", url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}` },
        { name: "Email", url: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
    ];

    return (
        <div className={clsx("flex flex-wrap items-center gap-2 py-4", className)}>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Share:</span>
            {platforms.map((p) => (
                <Link
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    prefetch={false}
                    className="rounded-full border border-lightGrey p-2 text-gray-600 hover:text-forest transition"
                    aria-label={`Share on ${p.name}`}
                >
                    {/* Placeholder for an icon component */}
                    <span>{p.name.slice(0, 1)}</span> 
                </Link>
            ))}
        </div>
    );
}