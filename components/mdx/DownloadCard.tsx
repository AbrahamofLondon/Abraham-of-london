// components/mdx/DownloadCard.tsx (FIXED to prevent final TypeError)
import * as React from "react";
import Link from "next/link";
import clsx from "clsx";

// Define possible file formats, often used to determine the icon
type DownloadFormat = "pdf" | "doc" | "zip" | "default";

// Example lookup map for styling or icons (simulated)
const formatStyleMap: Record<DownloadFormat, string> = {
    pdf: "border-red-600 bg-red-50 text-red-800",
    doc: "border-blue-600 bg-blue-50 text-blue-800",
    zip: "border-gray-600 bg-gray-50 text-gray-800",
    default: "border-zinc-600 bg-zinc-50 text-zinc-800",
};

export default function DownloadCard({ 
    href, 
    title, 
    format = "default", // 👈 CRITICAL FIX: Provides a default value for the string prop
    description,
    className 
}: { 
    href: string; 
    title: string; 
    format?: DownloadFormat; 
    description?: string;
    className?: string; 
}) {
    // This logic is now safe because 'format' will never be undefined
    const style = formatStyleMap[format] || formatStyleMap['default'];
    
    // Ensure all string operations are safe (e.g., if you were to use format.toLowerCase())
    const iconType = String(format).toLowerCase(); 

    const isExternal = /^https?:\/\//i.test(href);
    const target = isExternal || iconType === 'pdf' ? "_blank" : undefined;
    const rel = isExternal || iconType === 'pdf' ? "noopener noreferrer" : undefined;

    return (
        <div className={clsx("my-6 p-4 rounded-xl border-l-4", style, className)}>
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg">{title}</h4>
                    {description && <p className="text-sm mt-1">{description}</p>}
                </div>
                <Link
                    href={href}
                    target={target}
                    rel={rel}
                    prefetch={false}
                    className={clsx(
                        "ml-4 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        "border border-current hover:opacity-80"
                    )}
                >
                    Download ({iconType.toUpperCase()})
                </Link>
            </div>
        </div>
    );
}