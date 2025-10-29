// pages/events/[slug].tsx 

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { GetServerSideProps } from 'next';
import Head from 'next/head'; 

// 🏆 DEFINITIVE FIX: Import the default export and alias it to resolve compilation/tree-shaking issues.
import mdxComponentMap from '@/components/mdx-components';
const MDXComponents = mdxComponentMap; 

/* -------------------- Data Fetching (getServerSideProps) -------------------- */

// Define the shape of the expected props
interface EventPostProps {
    frontmatter: {
        title: string;
        date: string;
        location: string;
        registrationLink?: string; // Optional field
        // ... other event-specific frontmatter
        [key: string]: any; // Allow for other frontmatter fields
    };
    mdxSource: any; 
}

export const getServerSideProps: GetServerSideProps<EventPostProps> = async (context) => {
    const slug = context.query.slug as string; // Get the slug from the URL query

    try {
        // CRITICAL: Read the specific MDX file from 'content/events'
        const filePath = path.join(process.cwd(), 'content', 'events', slug + '.mdx');
        
        if (!fs.existsSync(filePath)) {
          return { notFound: true };
        }

        const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
        
        const { data: frontmatter, content } = matter(markdownWithMeta);
        
        // FIX: JSON Serialization of Date Objects (Needed for all Next.js data props)
        const serializedFrontmatter = Object.fromEntries(
            Object.entries(frontmatter).map(([key, value]) => [
                key, 
                value instanceof Date ? value.toISOString() : value
            ])
        );

        // Serialize the content, passing the frontmatter as scope if needed
        const mdxSource = await serialize(content, { scope: serializedFrontmatter });

        return {
            props: {
                frontmatter: serializedFrontmatter as EventPostProps['frontmatter'],
                mdxSource,
            },
        };
    } catch (error) {
        // If the file is not found or reading fails
        console.error(`Error fetching event for slug: ${slug}`, error);
        return { notFound: true };
    }
};

/* -------------------- Component Rendering -------------------- */

export default function EventPost({ frontmatter, mdxSource }: EventPostProps) {
  
  if (!mdxSource) {
    return <h1>Event Details Not Available</h1>; 
  }
  
  // Helper to format the date
  const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return dateString;
    }
  };


  return (
    <>
      <Head>
        <title>{frontmatter.title} | Event Details</title>
      </Head>
      <main className="max-w-5xl mx-auto py-12 px-4">
        
        {/* Header/Metadata Section */}
        <div className="border-b pb-6 mb-8">
            <h1 className="text-4xl font-extrabold mb-2">{frontmatter.title}</h1>
            <div className="text-lg text-gray-600 space-y-1">
                <p>🗓️ **Date & Time:** {formatDate(frontmatter.date)}</p>
                <p>📍 **Location:** {frontmatter.location}</p>
            </div>
        </div>

        {/* MDX Content Section (The detailed agenda/description) */}
        <div className="prose max-w-none">
          <MDXRemote 
            {...mdxSource} 
            components={MDXComponents} // Pass the fixed components map!
          />
        </div>

        {/* Call to Action (Registration Button) */}
        {frontmatter.registrationLink && (
            <div className="mt-10 pt-6 border-t">
                <a 
                    href={frontmatter.registrationLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block bg-green-600 text-white text-lg font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                    Register for Event &rarr;
                </a>
            </div>
        )}
      </main>
    </>
  );
}