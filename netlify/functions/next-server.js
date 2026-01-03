// This enables Netlify to properly handle Next.js functions
export { handleRequest as default } from '@netlify/nextjs';

// Alternatively, for simpler setup:
// module.exports = require('@netlify/nextjs').handleRequest;