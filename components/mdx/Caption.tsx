// components/mdx/Caption.tsx
import * as React from "react";
import clsx from "clsx";

export default function Caption({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <figcaption 
            className={clsx(
                "mt-2 text-center text-xs text-gray-500 dark:text-gray-400", 
                className
            )}
        >
            {children}
        </figcaption>
    );
}