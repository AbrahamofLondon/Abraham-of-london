import * as React from "react";
export default function CTA(props: React.ComponentProps<"div">) {
  return (
    <div {...props} className={"my-8 p-6 bg-softGold/20 rounded-lg border border-softGold " + (props.className ?? "")}>
        <p className="font-semibold text-deepCharcoal">Call to Action Placeholder</p>
        {props.children}
    </div>
  );
}