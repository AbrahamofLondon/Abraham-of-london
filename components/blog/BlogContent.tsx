import React from 'react';

interface BlogContentProps {
  children: React.ReactNode;
}

const BlogContent: React.FC<BlogContentProps> = ({ children }) => {
  return (
    <div className="blog-content">
      {children}
    </div>
  );
};

export default BlogContent;
