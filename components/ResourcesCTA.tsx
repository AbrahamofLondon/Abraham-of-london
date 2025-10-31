// components/mdx/ResourcesCTA.tsx (FIXED to prevent TypeError)
import * as React from "react";
import Link from "next/link";
import clsx from "clsx";

type ResourceType = "default" | "dark" | "external";

const styleMap: Record<ResourceType, string> = {
    default: "bg-white border-lightGrey text-gray-900 hover:bg-warmWhite",
    dark: "bg-forest border-forest text-cream hover:bg-forest/90",
    external: "bg-lightGrey border-lightGrey text-gray-800 hover:bg-lightGrey/80",
};

export default function ResourcesCTA({ 
    children, 
    href, 
    type = "default", // 👈 CRITICAL FIX: Add default prop value
    className 
}: { 
    children: React.ReactNode; 
    href: string; 
    type?: ResourceType; 
    className?: string 
}) {
    const style = styleMap[type] || styleMap['default'];
    
    // Assume external if it's not a local path
    const isExternal = /^https?:\/\//i.test(href);
    const target = isExternal ? "_blank" : undefined;
    const rel = isExternal ? "noopener noreferrer" : undefined;

    return (
        <Link
            href={href}
            prefetch={false}
            className={clsx(
                "group inline-flex items-center justify-center rounded-lg border px-6 py-3 text-center text-sm font-semibold transition-colors shadow-sm",
                style,
                className
            )}
            target={target}
            rel={rel}
        >
            {children}
            {/* Optional: Add an icon if needed, often involves a string prop lookup */}
        </Link>
    );
}