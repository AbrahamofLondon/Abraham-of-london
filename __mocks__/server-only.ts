// __mocks__/server-only.ts
// No-op mock for "server-only" in vitest/Node environments.
// In Next.js, this package throws unconditionally and relies on the Next.js
// bundler to tree-shake it from server component builds.
// This mock allows server-only modules to be imported and tested in vitest.
export default {};
