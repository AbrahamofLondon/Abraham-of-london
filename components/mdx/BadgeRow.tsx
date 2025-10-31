// components/mdx/BadgeRow.tsx
import * as React from "react";
import clsx from "clsx";

export default function BadgeRow(props: React.ComponentProps<"div">) {
    return (
        <div 
            {...props} 
            className={clsx(
                "flex flex-wrap gap-2 py-4", 
                props.className
            )} 
        />
    );
}