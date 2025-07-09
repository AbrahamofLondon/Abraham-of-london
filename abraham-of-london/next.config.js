[build]
  base = "."
  command = "npm install && npm run build"
  publish = ".next/static"

[context.production.environment]
  NEXT_PUBLIC_BASE_URL = "https://abrahamoflondon.org"

[[plugins]]
  package = "@netlify/plugin-nextjs"