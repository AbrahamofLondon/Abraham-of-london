import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import Head from 'next/head'

// Define posts directory
const postsDirectory = path.join(process.cwd(), 'data/blog')

// Get all .mdx posts
export function getAllPosts() {
  const filenames = fs.readdirSync(postsDirectory)

  return filenames
    .filter((file) => file.endsWith('.mdx'))
    .map((filename) => {
      const filePath = path.join(postsDirectory, filename)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContents)
      const slug = filename.replace(/\.mdx$/, '')

      return {
        slug,
        meta: {
          ...data,
          slug,
        },
        content,
      }
    })
}

// Generate paths at build time
export async function getStaticPaths() {
  const posts = getAllPosts()

  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }))

  return {
    paths,
    fallback: 'blocking', // For dynamic MDX posts
  }
}

// Load each post by slug
export async function getStaticProps({ params }) {
  const posts = getAllPosts()
  const post = posts.find((p) => p.slug === params.slug)

  if (!post) return { notFound: true }

  const mdxSource = await serialize(post.content)

  return {
    props: {
      source: mdxSource,
      meta: post.meta,
    },
    revalidate: 60, // Incremental Static Regeneration
  }
}

// The page component
export default function BlogPost({ source, meta }) {
  return (
    <>
      <Head>
        <title>{meta.seo?.title || meta.title}</title>
        <meta name="description" content={meta.seo?.description} />
        <meta name="keywords" content={meta.seo?.keywords} />
        <meta property="og:title" content={meta.seo?.title || meta.title} />
        <meta property="og:description" content={meta.seo?.description} />
        <meta property="og:image" content={meta.image} />
      </Head>

      <article className="prose max-w-3xl mx-auto py-10">
        <h1>{meta.title}</h1>
        <p className="text-sm text-gray-500">{meta.date}</p>
        <MDXRemote {...source} />
      </article>
    </>
  )
}
