import * as React from "react";

// Minimal component to satisfy the build
export default function HeroEyebrow(props: React.ComponentProps<"div">) {
  return <div {...props} className={"text-sm uppercase tracking-wider text-gray-500 " + (props.className ?? "")} />;
}