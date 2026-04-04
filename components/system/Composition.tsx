import * as React from "react";

type Props = {
  children: React.ReactNode;
  layout?: "asymmetric" | "split" | "stack";
  className?: string;
};

export default function Composition({
  children,
  layout = "asymmetric",
  className = "",
}: Props) {
  const items = React.Children.toArray(children);

  if (layout === "stack") {
    return <div className={`space-y-6 md:space-y-8 ${className}`}>{items}</div>;
  }

  if (layout === "split") {
    return <div className={`grid gap-6 md:gap-8 lg:grid-cols-2 ${className}`}>{items}</div>;
  }

  return (
    <div className={`grid gap-6 md:gap-8 lg:grid-cols-12 ${className}`}>
      {items.map((child, i) => {
        if (i === 0) return <div key={i} className="lg:col-span-7">{child}</div>;
        if (i === 1) return <div key={i} className="lg:col-span-5">{child}</div>;
        return <div key={i} className="lg:col-span-12">{child}</div>;
      })}
    </div>
  );
}