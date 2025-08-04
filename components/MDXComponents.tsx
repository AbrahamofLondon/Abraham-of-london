import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MDXComponents } from 'mdx/types';

const MDXComponents: MDXComponents = {
  h1: (props) => <h1 className="text-4xl font-bold my-6" {...props} />,
  h2: (props) => <h2 className="text-3xl font-semibold my-5" {...props} />,
  h3: (props) => <h3 className="text-2xl font-medium my-4" {...props} />,
  p: (props) => <p className="text-lg my-4 text-gray-700" {...props} />,
  a: ({ href = '', ...props }) => (
    <Link href={href} legacyBehavior>
      <a className="text-blue-600 hover:underline" {...props} />
    </Link>
  ),
  img: ({ src = '', alt = '' }) => (
    <div className="my-6 rounded-md overflow-hidden shadow">
      <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} />
    </div>
  ),
  ul: (props) => <ul className="list-disc list-inside my-4" {...props} />,
  ol: (props) => <ol className="list-decimal list-inside my-4" {...props} />,
  li: (props) => <li className="mb-2" {...props} />,
  blockquote: (props) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />
  ),
  table: (props) => <table className="w-full border-collapse my-6" {...props} />,
  th: (props) => <th className="border p-2 bg-gray-100 text-left" {...props} />,
  td: (props) => <td className="border p-2" {...props} />,
  pre: (props) => <pre className="bg-gray-900 text-white p-4 rounded overflow-x-auto" {...props} />,
  code: (props) => <code className="bg-gray-100 text-pink-600 px-1 rounded" {...props} />,
};

export default MDXComponents;
