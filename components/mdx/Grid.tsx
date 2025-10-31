// components/mdx/Grid.tsx
import * as React from "react";
import clsx from "clsx";

type Props = {
    columns?: 2 | 3 | 4;
    children?: React.ReactNode;
    className?: string;
};

export default function Grid({ columns = 2, children, className }: Props) {
    const cls =
        columns === 4 ? "md:grid-cols-4" :
        columns === 3 ? "md:grid-cols-3" :
                        "md:grid-cols-2";
    return (
        <div className={clsx("my-6 grid grid-cols-1 gap-6", cls, className)}>
            {children}
        </div>
    );
}