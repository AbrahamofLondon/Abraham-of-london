// components/ResourcesCTA.tsx
"use client";

import * as React from "react";
import CtaPresetComponent from "@/components/mdx/CtaPresetComponent";

type Props = {
  preset?: string;
  title?: string;
  description?: string;
};

export default function ResourcesCTA(props: Props) {
  return <CtaPresetComponent {...props} />;
}
