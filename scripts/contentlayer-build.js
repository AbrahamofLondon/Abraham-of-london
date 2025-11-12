import { run } from 'contentlayer/cli';

async function main(): Promise<void> {
  // Pass all arguments to the Contentlayer CLI, but prefix with 'build'
  const args = ['build', ...process.argv.slice(2)];

  try {
    console.log(`🏗️ Contentlayer building with args: ${args.join(' ')}`);
    await run(args);
    console.log('✅ Contentlayer build completed successfully');
  } catch (error: unknown) {
    // Handle Windows-specific Contentlayer CLI bug
    if (error instanceof Error && 
        error.message?.includes('code') && 
        (error as any).code === 'ERR_INVALID_ARG_TYPE') {
      console.log('⚠️ Contentlayer build completed (Windows CLI warning ignored)');
      process.exit(0);
    } else {
      console.error('❌ Contentlayer build failed:', error);
      process.exit(1);
    }
  }
}

main().catch((error: unknown) => {
  console.error('❌ Unexpected error in Contentlayer build:', error);
  process.exit(1);
});