# Abraham of London - Project README

## Project Overview

Abraham of London is a personal brand website showcasing the philosophies, ventures, writings, and creative projects of Abraham. The platform blends storytelling, strategic insights, and brand showcases, positioning Abraham's identity and thought leadership.

---

## Table of Contents

1.  [Project Structure](#project-structure)
2.  [Installation](#installation)
3.  [Development Commands](#development-commands)
4.  [Technologies Used](#technologies-used)
5.  [Content Management](#content-management)
6.  [Deployment](#deployment)
7.  [Troubleshooting Common Build Errors](#troubleshooting-common-build-errors)
8.  [Contribution Guidelines](#contribution-guidelines)
9.  [Support & Maintenance](#support--maintenance)
10. [Notes](#notes)

---

## Project Structure

This outlines the main directories and their purposes:

* `/Abraham-of-london` (Project Root)
    * `/components` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; # Shared UI components (e.g., `Layout.tsx`, `BookCard`). All components are built with TypeScript (`.tsx`).
    * `/pages` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; # Next.js pages, defining routes (e.g., `index.js`, `about.tsx`, `blog/[slug].tsx`, `books/[slug].tsx`, `brands.tsx`, `contact.tsx`).
    * `/public/assets` &nbsp; &nbsp; &nbsp; # Images, logos, and other static assets (e.g., `images`, `logo`).
    * `/content` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; # Blog posts and book data managed in MDX/Markdown format.
    * `/styles` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; # TailwindCSS configuration and global CSS styles.
    * `/utils` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; # Helper functions (e.g., `getAllContent` for data fetching).
    * `package.json` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;# Project metadata, scripts, and dependency definitions.
    * `tsconfig.json` &nbsp; &nbsp; &nbsp; &nbsp; # TypeScript compiler configuration.
    * `tailwind.config.js` &nbsp; &nbsp; # Tailwind CSS configuration file.

---

## Installation

### Prerequisites

Before setting up the project, ensure you have the following installed:

* **Node.js**: `v20.x LTS` (avoid v22+ for now to prevent potential compatibility issues).
* **npm**: `v9+` (Node Package Manager, typically bundled with Node.js).
* **Git**: Version control system.

### Setup Instructions

Follow these steps to get the project running locally:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/AbrahamofLondon/Abraham-of-london.git](https://github.com/AbrahamofLondon/Abraham-of-london.git)
    cd Abraham-of-london
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Your application should now be accessible at `http://localhost:3000` (or another port if 3000 is in use).

---

## Development Commands

Here's a list of useful commands for development:

| Command         | Description                                   |
| :-------------- | :-------------------------------------------- |
| `npm run dev`   | Starts the development server with hot-reloading. |
| `npm run build` | Builds the application for production deployment. |
| `npm run start` | Starts a production-ready server from the built output. |
| `npm run lint`  | Runs ESLint checks to identify code quality issues. |

---

## Technologies Used

This project leverages a modern web development stack:

* **Next.js**: A powerful React Framework enabling Server-Side Rendering (SSR), Static Site Generation (SSG), and API routes for high performance and SEO.
* **TypeScript**: A superset of JavaScript that adds static type definitions, enhancing code quality, readability, and maintainability. It's crucial for component props (e.g., `children: React.ReactNode`) and general code reliability.
* **TailwindCSS**: A utility-first CSS framework that allows for rapid UI development directly in your markup without writing custom CSS.
* **MDX**: Allows you to write Markdown with embedded JSX components. This is used for dynamic content like blog posts and books, enabling rich, interactive content.

---

## Content Management

Content for the website is organized as follows:

* **Blogs**: Markdown/MDX files located in `/content/blog`.
* **Books**: Markdown/MDX files located in `/content/books`.
* **Images**: All images and logos are stored in `/public/assets/images`.
* **Static Files**: Downloadable assets (e.g., PDFs, EPUBs) are placed under `/public/downloads`.

---

## Deployment

The project is designed for seamless deployment on various platforms.

### Recommended Platforms

* **Vercel**: Offers native and optimized support for Next.js applications, providing easy continuous deployment.
* **Netlify**: A popular platform for deploying static sites and frontends, offering robust build and deployment features.

### CI/CD Setup Considerations

* Ensure the `.next` cache is cleared during build steps to prevent stale data issues.
* Properly configure any environment variables required for the application (e.g., API keys).

---

## Troubleshooting Common Build Errors

If you encounter `npm run build` failures, especially after making changes to components or pages, these are common issues and their solutions:

1.  **Clear the Next.js Cache:**
    * **Symptom:** Cryptic or persistent build errors that don't seem to make sense.
    * **Reason:** Stale build artifacts or cache files can interfere with new builds.
    * **Solution:** Remove the `.next` build directory entirely.
        * **Windows:** `rmdir /s /q .next`
        * **macOS/Linux:** `rm -rf .next`
    * Then, re-run `npm run build`.

2.  **Verify `Layout` Component Usage:**
    * **Symptom 1: `Type error: Cannot find name 'Layout'.`**
        * **Reason:** The `Layout` component isn't being correctly imported or found by TypeScript in the consuming page file.
        * **Solution:**
            * Confirm `components/Layout.tsx` exists and is correctly exporting its default function: `export default function Layout(...) { ... }`.
            * Verify the **exact relative import path** in the problematic page file. For pages directly under `/pages` (e.g., `pages/about.tsx`), use `import Layout from '../components/Layout';`. For pages nested deeper (e.g., `pages/blog/[slug].tsx`, `pages/books/index.tsx`), use `import Layout from '../../components/Layout';`.
            * Ensure `components/Layout.tsx` includes `import React from 'react';` for `React.ReactNode` type.

    * **Symptom 2: `Type error: Property 'children' is missing in type '{}' but required in type '{ children: ReactNode; }'.`**
        * **Reason:** The `Layout` component has a TypeScript interface (`LayoutProps`) that requires it to receive `children` (content) inside its tags, but somewhere it's being rendered without any content, like `<Layout></Layout>`.
        * **Solution:** For *every* page that imports and uses `Layout`, ensure there is **always content nested within the `<Layout>` tags**. Even an empty `<div>` or a React Fragment (`<></>`) is sufficient to satisfy the `children` prop requirement:
            ```jsx
            // Correct usage: Content is wrapped
            <Layout>
              <div>
                {/* Your page content */}
              </div>
            </Layout>

            // Incorrect usage: No content inside Layout tags
            <Layout></Layout>
            ```
        * This applies to all pages: `index.js`, `about.tsx`, `blog/index.tsx`, `blog/[slug].tsx`, `books/index.tsx`, `books/[slug].tsx`, `brands.tsx`, `contact.tsx`, and any custom error pages like `404.tsx`.

3.  **Check `return` Statement Syntax in Pages:**
    * **Symptom: `Type error: ')' expected.`**
        * **Reason:** When a React functional component returns JSX that spans multiple lines, the JSX *must* be enclosed in parentheses `()`. This error typically occurs when the opening parenthesis after `return` or the closing parenthesis before the semicolon is missing.
        * **Solution:** Always structure your component's return statement like this:
            ```typescript
            export default function MyPage() {
              return ( // <--- Add this opening parenthesis if missing
                <Layout>
                  {/* ... all your multi-line JSX content ... */}
                </Layout>
              ); // <--- Add this closing parenthesis and semicolon if missing
            }
            ```

4.  **Confirm `.tsx` and `.js` File Extensions:**
    * Ensure all files intended to be TypeScript components or pages are named `.tsx` (or `.ts` for non-JSX files like utilities). Regular JavaScript files should remain `.js`. Mismatched extensions can cause import/resolution issues.

5.  **Review Console for Specific File Paths and Line Numbers:**
    * Always pay close attention to the error messages in your terminal. They provide precise file paths and line numbers, which are your best guide to locating and fixing the issue.

---

## Contribution Guidelines

We welcome contributions to the Abraham of London website! Please follow these guidelines:

1.  **Clone the repository and create a feature branch:**
    ```bash
    git checkout -b feature/your-feature-name
    ```
    Choose a descriptive name for your branch.

2.  **Commit changes with meaningful messages:**
    ```bash
    git commit -m "feat: Add new section for testimonials"
    ```
    Use conventional commit messages (e.g., `feat:`, `fix:`, `docs:`) for clarity.

3.  **Push your changes to your branch:**
    ```bash
    git push origin feature/your-feature-name
    ```

4.  **Open a Pull Request (PR):**
    * Explain your changes clearly.
    * Reference any related issues.
    * Ensure your branch is up-to-date with `main` before creating the PR.

---

## Support & Maintenance

* **Primary Maintainer:** Abraham of London DevOps Lead
* **Contact:** For issues, bug reports, or improvements, please raise a GitHub issue in this repository or email: `contact@abrahamoflondon.org`.

---

## Notes

* **Node.js Version:** For consistency and to avoid potential dependency conflicts, it's recommended to use Node.js `v20.x LTS`. You can manage Node.js versions with `nvm` (Node Version Manager): `nvm use 20`.

---

*Version: 1.0*
*Last Updated: July 22, 2025*