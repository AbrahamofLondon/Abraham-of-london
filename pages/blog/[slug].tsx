// pages/blog/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { getAllPosts, getPostBySlug, PostMeta } from '../../lib/posts';
import Link from 'next/link';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { useEffect } from 'react';

interface BlogPageProps {
  post: PostMeta & {
    content: MDXRemoteSerializeResult;
  };
}

const DisqusComments = ({ slug, title }: { slug: string; title: string }) => {
  useEffect(() => {
    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = slug;
          this.page.url = `https://abrahamoflondon.org/blog/${slug}`;
          this.page.title = title;
        },
      });
    } else {
      (window as any).disqus_config = function () {
        this.page.identifier = slug;
        this.page.url = `https://abrahamoflondon.org/blog/${slug}`;
        this.page.title = title;
      };
      const d = document,
        s = d.createElement('script');
      s.src = 'https://YOUR_DISQUS_SHORTNAME.disqus.com/embed.js'; // <-- Replace YOUR_DISQUS_SHORTNAME here
      s.setAttribute('data-timestamp', Date.now().toString());
      (d.head || d.body).appendChild(s);
    }
  }, [slug, title]);

  return <div id="disqus_thread" className="mt-16"></div>;
};

const ShareButtons = ({ slug, title }: { slug: string; title: string }) => {
  const siteUrl = 'https://abrahamoflondon.org';
  const postUrl = encodeURIComponent(`${siteUrl}/blog/${slug}`);
  const postTitle = encodeURIComponent(title);

  return (
    <div className="flex space-x-4 mt-12">
      <a
        href={`https://twitter.com/intent/tweet?url=${postUrl}&text=${postTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 font-semibol
