import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode, HTMLAttributes, ImgHTMLAttributes } from 'react';

const MDXComponents: MDXComponents = {
  h1: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-4xl font-extrabold my-6 text-gray-900" {...props} />
  ),
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-3xl font-bold my-5 text-gray-800" {...props} />
  ),
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-2xl font-semibold my-4 text-gray-700" {...props} />
  ),
  h4: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="text-xl font-medium my-3 text-gray-600" {...props} />
  ),
  p: (props: HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-lg leading-relaxed my-4 text-gray-700" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <Link href={props.href || ''}>
      <a className="text-blue-600 hover:underline" {...props} />
    </Link>
  ),
  ul: (props: HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside my-4 pl-5 text-gray-700" {...props} />
  ),
  ol: (props: HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside my-4 pl-5 text-gray-700" {...props} />
  ),
  li: (props: HTMLAttributes<HTMLLIElement>) => <li className="mb-2" {...props} />,
  blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />
  ),
  img: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    <span className="block my-6 rounded-lg overflow-hidden shadow-md">
      <Image
        src={props.src || ''}
        alt={props.alt || ''}
        width={700}
        height={400}
        layout="responsive"
        objectFit="cover"
      />
    </span>
  ),
  table: (props: HTMLAttributes<HTMLTableElement>) => (
    <table className="w-full border-collapse my-6" {...props} />
  ),
  th: (props: HTMLAttributes<HTMLTableCellElement>) => (
    <th className="border p-2 bg-gray-100 text-left font-semibold text-gray-800" {...props} />
  ),
  td: (props: HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border p-2 text-gray-700" {...props} />
  ),
  pre: (props: HTMLAttributes<HTMLPreElement>) => (
    <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto my-6" {...props} />
  ),
  code: (props: HTMLAttributes<HTMLElement>) =
