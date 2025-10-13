// components/mdx/PullLine.tsx
"use client";

import { HTMLAttributes } from "react";
import clsx from "clsx";

type Props = HTMLAttributes<HTMLParagraphElement> & {
  subtle?: boolean; // lighter tone
};

export default function PullLine({ className, subtle, ...props }: Props) {
  return (
    <p
      {...props}
      className={clsx(
        "my-6 text-lg md:text-xl leading-snug",
        subtle
          ? "font-medium text-zinc-600"
          : "font-semibold text-zinc-800",
        "border-l-2 pl-4 border-zinc-200"
        , className
      )}
    />
  );
}
