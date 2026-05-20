import { getResolvedLinkedInOutboundAssets } from "@/lib/outbound/linkedin-content-resolver";
import { canPublishLinkedInOutbound } from "@/lib/outbound/linkedin-publish-gate";

const dryRunConnection = {
  connected: true,
  status: "active",
  scopes: ["openid", "profile", "w_member_social"],
  publishingEnabled: true,
};

const assets = getResolvedLinkedInOutboundAssets(true);

let publishable = 0;
let blocked = 0;

console.log("LinkedIn publishing dry run");
console.log("---------------------------");

for (const asset of assets) {
  const result = canPublishLinkedInOutbound(asset.item, { connection: dryRunConnection });
  if (result.allowed) {
    publishable += 1;
    console.log(`PUBLISHABLE ${asset.slug}`);
  } else {
    blocked += 1;
    console.log(`BLOCKED ${asset.slug}`);
    for (const blocker of result.blockers) {
      console.log(`  - ${blocker}`);
    }
  }
}

console.log("---------------------------");
console.log(`Total: ${assets.length}`);
console.log(`Publishable: ${publishable}`);
console.log(`Blocked: ${blocked}`);
