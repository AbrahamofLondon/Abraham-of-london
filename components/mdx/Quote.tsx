// components/mdx/Quote.tsx
import * as React from "react";
import clsx from "clsx";

export default function Quote({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <blockquote 
            className={clsx(
                "my-6 border-l-4 border-amber-500 pl-4 italic text-gray-800 dark:text-gray-200", 
                className
            )}
        >
            {children}
        </blockquote>
    );
}