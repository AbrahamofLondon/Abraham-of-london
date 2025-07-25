Markdown

# Abraham of London Website

This is the Next.js and TypeScript-powered website for Abraham of London.

## Project Status

**[Update this section based on current status]**

* **Current State:** Actively developed. Local build is successful, addressing critical dependencies and type errors. Deployment to Netlify is the next step.
* **Last Updated:** July 25, 2025

## Key Features

* **Static Site Generation (SSG):** Utilizes Next.js `getStaticProps` for optimized performance.
* **Incremental Static Regeneration (ISR):** Configured for pages like `/blog` and `/books` to update content without full redeploys.
* **Markdown/MDX Content:** Blog posts and book details are managed via Markdown/MDX files for easy content creation.
* **TypeScript:** Ensures type safety and improves code maintainability.
* **Tailwind CSS:** For rapid and consistent UI development.
* **Responsive Design:** Optimized for various screen sizes.

## Local Development

To get started with local development:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/AbrahamofLondon/Abraham-of-london.git](https://github.com/AbrahamofLondon/Abraham-of-london.git)
    cd Abraham-of-london
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # Or if you use yarn:
    # yarn install
    ```
    *Note: Critical dependencies like `remark`, `remark-html`, `remark-gfm`, `unified`, `vfile`, `vfile-message`, `next-mdx-remote`, and `autoprefixer` are required for a successful build.*

3.  **Run the development server:**
    ```bash
    npm run dev
    # Or if you use yarn:
    # yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

4.  **Build for production (optional, for local testing):**
    ```bash
    npm run build
    ```

## Deployment

This project is configured for continuous deployment with Netlify. Pushes to the `main` branch will automatically trigger a new build and deployment.

* **Live Site:** [Your Netlify URL here, e.g., https://abraham-of-london.netlify.app](https://abraham-of-london.netlify.app)

## Recent Updates & Troubleshooting Notes (Add this section!)

* **2025-07-25:**
    * Resolved `remark`/`vfile` import and version conflicts, ensuring `markdownToHtml` utility functions correctly.
    * Fixed TypeScript errors related to `BlogCardProps` (missing `excerpt`, `date`, `coverImage`) in `components/BlogCard.tsx` and `pages/blog.tsx`.
    * Fixed TypeScript errors related to `BookCardProps` (missing `slug`) in `components/BookCard.tsx` and `pages/books.tsx`.
    * Addressed `pages/books/[slug].tsx` build error by correctly structuring `paths` in `getStaticPaths` to extract `slug` from `BookItem` objects.
    * Ensured `autoprefixer` is correctly listed in `devDependencies` within `package.json` to prevent Netlify build failures related to CSS processing. (If still encountering issues, check `postcss.config.js` or force clear cache & redeploy on Netlify).

## Project Structure (Optional, but helpful)

.
├── public/                 # Static assets (images, downloads, etc.)
├── components/             # Reusable React components
├── lib/                    # Utility functions (e.g., markdown processing, data fetching)
├── pages/                  # Next.js pages (routes)
│   ├── api/                # API routes
│   ├── blog/               # Blog index and dynamic blog post pages
│   └── books/              # Books index and dynamic book detail pages
├── posts/                  # Markdown/MDX content for blog posts
├── books/                  # Markdown/MDX content for books
├── styles/                 # Global CSS and Tailwind directives
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file


## Contributing (Optional)

[Instructions for contributing, if applicable]

## License

[Your license information]
Key things I added/changed for today's update:

Project Status: Updated to reflect current progress and the date.

Local Development -> Install dependencies: Added a note about the crucial dependencies we fixed.

Deployment: Added a placeholder for your Netlify URL.

Recent Updates & Troubleshooting Notes: This is the most important new section for today. I've summarized all the major fixes we went through, including the specific files and issues. This will be invaluable for future debugging or if someone else joins the project.