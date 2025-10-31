// components/mdx/Badge.tsx (FIXED to prevent TypeError)

'use client';

import * as React from "react";
import clsx from "clsx";

// Example types often used in a Badge component
type BadgeType = "default" | "success" | "warning" | "error" | "feature";

// Example lookup map based on a 'type' prop
const badgeStyleMap: Record<BadgeType, string> = {
    default: "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200",
    success: "border-green-300 text-green-700 bg-green-50/50 dark:border-green-700 dark:text-green-300",
    warning: "border-amber-300 text-amber-700 bg-amber-50/50 dark:border-amber-700 dark:text-amber-300",
    error: "border-red-300 text-red-700 bg-red-50/50 dark:border-red-700 dark:text-red-300",
    feature: "border-blue-300 text-blue-700 bg-blue-50/50 dark:border-blue-700 dark:text-blue-300",
};

export default function Badge({ 
    children, 
    type = "default", // 👈 THE CRITICAL FIX: provides a default value
    className 
}: { 
    children?: React.ReactNode; 
    type?: BadgeType; 
    className?: string; 
}) {
    // Note: Since 'type' has a default, we don't need .toLowerCase() unless
    // the MDX parser is passing a variant string that needs normalization.
    const style = badgeStyleMap[type] || badgeStyleMap['default'];

    return (
        <span 
            className={clsx(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                "border", // Include base border class
                style,
                className
            )}
        >
            {children}
        </span>
    );
}