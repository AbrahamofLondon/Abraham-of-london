// scripts/contentlayer-build.js
(async () => {
  // Use the ESM CLI via dynamic import so we don’t need ts-node
  const cli = await import("contentlayer/cli");
  // Pass-thru args; prepend "build"
  const args = ["build", ...process.argv.slice(2)];
  try {
    console.log(`🏗️ Contentlayer building with args: ${args.join(" ")}`);
    await cli.run(args);
    console.log("✅ Contentlayer build completed successfully");
  } catch (err) {
    // Some Windows envs throw odd CLI errors even after successful run; be explicit.
    console.error("❌ Contentlayer build failed:", err);
    process.exit(1);
  }
})();
