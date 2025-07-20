// pages/blog.tsx
import { getAllContent } from '../utils/getAllContent';
import { BlogCard } from '../components/BlogCard';

export async function getStaticProps() {
  const posts = getAllContent('blog');
  return {
    props: {
      posts,
    },
  };
}

export default function BlogPage({ posts }) {
  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Latest Blog Posts</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard
            key={post.slug}
            slug={post.slug}
            title={post.frontmatter.title}
            date={post.frontmatter.date}
            excerpt={post.frontmatter.excerpt}
            coverImage={post.frontmatter.coverImage}
            category={post.frontmatter.category}
            author={post.frontmatter.author}
            readTime={post.frontmatter.readTime}
          />
        ))}
      </div>
    </div>
  );
}


// pages/books.tsx
import { getAllContent } from '../utils/getAllContent';
import { BookCard } from '../components/BookCard';

export async function getStaticProps() {
  const books = getAllContent('books');
  return {
    props: {
      books,
    },
  };
}

export default function BooksPage({ books }) {
  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Books by Abraham of London</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <BookCard
            key={book.slug}
            slug={book.slug}
            title={book.frontmatter.title}
            coverImage={book.frontmatter.coverImage}
            author={book.frontmatter.author}
            excerpt={book.frontmatter.excerpt}
          />
        ))}
      </div>
    </div>
  );
}