"use client";
import * as React from "react";
import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  note?: string;           // optional small caption
  className?: string;
};

export default function PullLine({ children, align = "center", note, className }: Props) {
  const alignClass =
    align === "left" ? "text-left items-start" :
    align === "right" ? "text-right items-end" : "text-center items-center";

  return (
    <figure
      className={clsx(
        "my-8 flex flex-col gap-3",
        alignClass,
        className
      )}
    >
      <blockquote className="text-xl md:text-2xl leading-snug font-medium">
        {children}
      </blockquote>
      {note ? <figcaption className="text-sm opacity-70">{note}</figcaption> : null}
    </figure>
  );
}
