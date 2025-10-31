# Create the file directly in PowerShell
@"
const hookUrl = "https://api.netlify.com/build_hooks/6846264d915f250cf80d92";

console.log(" Deploying with hook:", hookUrl);

fetch(hookUrl, { method: 'POST' })
  .then(response => {
    if (response.ok) {
      console.log("✅ Deployment triggered successfully!");
    } else {
      console.log("❌ Deployment failed:", response.status);
    }
  })
  .catch(error => console.log("❌ Error:", error));
"@ | Out-File -FilePath "simple-deploy.js" -Encoding UTF8

# Then run it
node simple-deploy.js