// components/MDXComponents.tsx

import * as React from 'react';
import { MDXProvider } from '@mdx-js/react';

const components = {
  h1: (props) => <h1 className="text-3xl font-bold mt-4 mb-2" {...props} />,
  p: (props) => <p className="leading-relaxed my-4" {...props} />,
  a: (props) => <a className="text-blue-600 underline" {...props} />,
  // Add more as needed
};

interface Props {
  children: React.ReactNode;
}

export default function MDXComponents({ children }: Props) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}
