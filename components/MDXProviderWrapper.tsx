// components/MDXProviderWrapper.tsx or wherever you setup MDX
import * as React from "react";
import { MDXProvider } from "@mdx-js/react";

const components = {
  // any custom MDX components here
};

export default function MDXProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}




