Based on our previous interactions and the code you've provided, here is a comprehensive and final README.md update for your project. This version synthesizes all the fixes and best practices we've discussed, provides clear instructions, and adds a crucial "Deployment Checklist" to ensure you can confidently ship the project.

This README is now fully up to date and ready for your repository.

-----

# Abraham of London Website

This is the Next.js and TypeScript-powered website for Abraham of London.

## Project Status

  * **Current State:** All major technical issues have been resolved. The project is locally functional, type-safe, and ready for deployment. The focus is now on confirming all assets are correctly placed for a successful live release.
  * **Last Updated:** August 11, 2025

-----

## Key Features

  * **Static Site Generation (SSG):** Utilizes Next.js `getStaticProps` for optimized performance and SEO.
  * **Incremental Static Regeneration (ISR):** Configured to automatically update content pages (e.g., `/blog`, `/books`) without a full site redeploy.
  * **Markdown/MDX Content:** Blog posts and book details are managed via Markdown/MDX files for easy content creation.
  * **TypeScript:** Ensures type safety and improves code maintainability.
  * **Tailwind CSS:** For rapid and consistent UI development.
  * **Responsive Design:** Optimized for various screen sizes.
  * **Next.js Image Component:** Ensures all images are optimized, lazy-loaded, and prevent layout shifts.
  * **Netlify Forms Integration:** Contact and newsletter forms are configured to work seamlessly with Netlify's built-in form handling.

-----

## Local Development

To get started with local development:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/AbrahamofLondon/Abraham-of-london.git
    cd Abraham-of-london
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

    *Note: Critical dependencies like `remark`, `remark-html`, `remark-gfm`, `unified`, `vfile`, `vfile-message`, `next-mdx-remote`, and `autoprefixer` are all correctly configured and in `package.json`.*

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

4.  **Build for production (optional, for local testing):**

    ```bash
    npm run build
    ```

-----

## Deployment

This project is configured for continuous deployment with Netlify. Pushes to the `main` branch will automatically trigger a new build and deployment.

  * **Live Site:** [Your Netlify URL here, e.g., https://abraham-of-london.netlify.app](https://abraham-of-london.netlify.app)

### Deployment Checklist Ã¢Å“â€¦

Before you deploy to a production domain, ensure the following steps are completed to avoid common issues:

  * **Verify Image Paths:** All image files referenced in the code must exist in the `/public` folder.
  * **Check Form Configuration:** Ensure the `contact` and `newsletter` forms are correctly configured in your Netlify dashboard and are receiving submissions.
  * **Set `siteUrl`:** Update the `siteUrl` in `next-sitemap.config.js` to your final domain (`https://abrahamoflondon.com`) for correct sitemap generation.

-----

## Recent Updates & Troubleshooting Notes

  * **2025-08-11:** A comprehensive audit of the entire codebase was conducted.

      * **Image Paths:** Consolidated all hardcoded image paths into a central `siteConfig` object to prevent broken links and simplify maintenance.
      * **Social Links:** The `SocialLinks` component was updated to be data-driven, accepting social URLs as a prop.
      * **Netlify Forms:** The contact form's submission handler was corrected to post to the page's own URL, which is the correct method for Netlify Forms on a client-side rendered page.
      * **Button and Links:** Improved accessibility and user experience by adding `aria-label` attributes and consistent CSS classes for hover effects and cursor styling.

  * **2025-07-25:**

      * Resolved `remark`/`vfile` import and version conflicts, ensuring `markdownToHtml` utility functions correctly.
      * Fixed TypeScript errors related to missing props in `BlogCard.tsx`, `BookCard.tsx`, `pages/blog.tsx`, and `pages/books.tsx`.
      * Addressed `pages/books/[slug].tsx` build error by correctly structuring `paths` in `getStaticPaths`.
      * Ensured `autoprefixer` is correctly listed in `devDependencies` within `package.json` to prevent Netlify build failures related to CSS processing.

-----

## Project Structure

```
.
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ public/                # Static assets (images, downloads, etc.)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ components/            # Reusable React components
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ lib/                   # Utility functions (e.g., markdown processing, data fetching)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ pages/                 # Next.js pages (routes)
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ api/               # API routes
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ blog/              # Blog index and dynamic blog post pages
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ books/             # Books index and dynamic book detail pages
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ posts/                 # Markdown/MDX content for blog posts
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ books/                 # Markdown/MDX content for books
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ styles/                # Global CSS and Tailwind directives
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ next.config.js         # Next.js configuration
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ tailwind.config.js     # Tailwind CSS configuration
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ postcss.config.js      # PostCSS configuration
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ package.json           # Project dependencies and scripts
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ tsconfig.json          # TypeScript configuration
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ README.md              # This file
```