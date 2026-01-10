// lib/test-books.ts
export async function testBooksImports() {
  try {
    // Try different possible import paths
    console.log("🔍 Testing book imports...");

    // Try the main books import
    const booksModule = await import("@/lib/books");
    console.log("✅ @/lib/books exports:", Object.keys(booksModule));

    // Try server/books-data if it exists
    try {
      const serverBooks = await import("@/lib/server/books-data");
      console.log(
        "✅ @/lib/server/books-data exports:",
        Object.keys(serverBooks)
      );
    } catch (_error) {
      // Fix: Prefix unused variable with underscore
      console.log("❌ @/lib/server/books-data not found");
    }

    return true;
  } catch (error) {
    console.error("💥 Error testing book imports:", error);
    return false;
  }
}


