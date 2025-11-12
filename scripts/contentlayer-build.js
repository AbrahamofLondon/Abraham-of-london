import { runBuild } from "../.contentlayer/generated/index.mjs"

async function main() {
  await runBuild()
  console.log("Contentlayer build completed")
}

main().catch(console.error)
