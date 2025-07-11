// Import React if you're using older versions or need JSX transform explicitly
import React from 'react'; // Optional for newer React, but good practice

function BlogCard({ post }) { // Assuming it takes a 'post' prop
  return (
    // Your component JSX goes here, e.g.:
    <div>
      <img src={post.image} alt={post.title} />
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
    </div>
  );
}

// THIS LINE IS CRUCIAL for the "default export" error
export default BlogCard;