// components/MDXComponents.tsx
import Image from 'next/image';
import Link from 'next/link';

// Define custom components for MDX rendering
const MDXComponents = {
  h1: (props: any) => <h1 className="text-4xl font-extrabold my-6 text-gray-900" {...props} />,
  h2: (props: any) => <h2 className="text-3xl font-bold my-5 text-gray-800" {...props} />,
  h3: (props: any) => <h3 className="text-2xl font-semibold my-4 text-gray-700" {...props} />,
  h4: (props: any) => <h4 className="text-xl font-medium my-3 text-gray-600" {...props} />,
  p: (props: any) => <p className="text-lg leading-relaxed my-4 text-gray-700" {...props} />,
  a: (props: any) => <Link className="text-blue-600 hover:underline" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside my-4 pl-5 text-gray-700" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside my-4 pl-5 text-gray-700" {...props} />,
  li: (props: any) => <li className="mb-2" {...props} />,
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />
  ),
  img: (props: any) => (
    <span className="block my-6 rounded-lg overflow-hidden shadow-md">
      <Image {...props} layout="responsive" width={700} height={400} objectFit="cover" alt={props.alt || ''} />
    </span>
  ),
  table: (props: any) => <table className="w-full border-collapse my-6" {...props} />,
  th: (props: any) => <th className="border p-2 bg-gray-100 text-left font-semibold text-gray-800" {...props} />,
  td: (props: any) => <td className="border p-2 text-gray-700" {...props} />,
  pre: (props: any) => (
    <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto my-6" {...props} />
  ),
  code: (props: any) => <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded" {...props} />,
  // Add any other HTML elements you want to style or replace
  // Example for a custom component:
  // MyCustomComponent: (props: any) => <div className="text-red-500" {...props} />,
};

export default MDXComponents;