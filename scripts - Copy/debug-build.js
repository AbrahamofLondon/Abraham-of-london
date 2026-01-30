const { getAllUnifiedContent } = require("../lib/server/unified-content");

async function debugBuild() {
  console.log("=== DEBUGGING BUILD ROUTES ===");

  try {
    const allContent = await getAllUnifiedContent();
    console.log("Total content items:", allContent.length);

    const byType = {};
    allContent.forEach((item) => {
      byType[item.type] = (byType[item.type] || 0) + 1;
    });

    console.log("Content by type:", byType);
  } catch (error) {
    console.error("Error debugging content:", error);
  }
}

debugBuild();
