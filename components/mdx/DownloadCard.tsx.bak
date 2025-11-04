// components/mdx/DownloadCard.tsx
import * as React from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react'; // Assuming lucide-react is the icon library

interface DownloadCardProps {
    title: string;
    href: string;
    meta?: string;
}

/**
 * Renders a stylized card for a downloadable resource.
 */
export default function DownloadCard({ title, href, meta }: DownloadCardProps) {
    return (
        <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border border-lightGrey rounded-lg shadow-sm hover:shadow-md transition bg-white"
        >
            <div className="flex items-start">
                <Download className="w-5 h-5 text-deepCharcoal flex-shrink-0 mt-1 mr-3" />
                <div>
                    <h4 className="font-semibold text-deepCharcoal text-base">{title}</h4>
                    {meta && <p className="text-xs text-gray-500 mt-1">{meta}</p>}
                </div>
            </div>
        </a>
    );
}
