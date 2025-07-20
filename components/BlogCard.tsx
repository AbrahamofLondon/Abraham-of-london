import React from 'react';

interface BookCardProps {
    title: string;
    coverImage: string;
    author: string;
    slug: string;
    excerpt: string;
}

export const BookCard: React.FC<BookCardProps> = ({
    title,
    coverImage,
    author,
    slug,
    excerpt
}) => {
    return (
        <div className="border rounded-lg shadow-md p-4">
            {coverImage && <img src={coverImage} alt={title} className="w-full h-60 object-cover mb-4" />}
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-gray-600 text-sm mb-2">{excerpt}</p>
            <div className="text-xs text-gray-500 mb-2">By {author}</div>
            <a href={`/books/${slug}`} className="text-blue-600 text-sm">View Book</a>
        </div>
    );
};
