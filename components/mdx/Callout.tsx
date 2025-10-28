// components/mdx/Callout.tsx (FIXED to prevent TypeError)
import * as React from "react";
import clsx from "clsx";

// Define the expected types
export type CalloutType = "info" | "warn" | "success" | "danger";

// Define the color palettes (using tailwind class names)
const getPalette = (type: CalloutType) => {
    switch (type) {
        case "success":
            return ["green-600", "green-50", "green-500/20"];
        case "warn":
            return ["amber-700", "amber-50", "amber-500/20"];
        case "danger":
            return ["red-700", "red-50", "red-500/20"];
        case "info":
        default:
            return ["sky-700", "sky-50", "sky-500/20"];
    }
};

export default function Callout({ 
    type = "info", // 👈 THE CRITICAL FIX: prevents 'undefined.toLowerCase()'
    title, 
    children, 
    className 
}: { 
    type?: CalloutType; 
    title?: string;
    children: React.ReactNode; 
    className?: string; 
}) {
    // Ensure the type is valid for lookup, defaulting to 'info' if passed an invalid value
    const safeType = (type && getPalette(type) ? type : "info") as CalloutType;
    const palette = getPalette(safeType);

    return (
        <div
            className={clsx(
                "my-6 rounded-xl border p-4",
                `border-${palette[0]}/30 bg-${palette[1]} dark:border-${palette[0]}/30 dark:bg-${palette[2]}`,
                className
            )}
            role="alert"
        >
            {title && (
                <div className={clsx("mb-1 text-sm font-semibold", `text-${palette[0]}`)}>
                    {title}
                </div>
            )}
            <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-100">{children}</div>
        </div>
    );
}