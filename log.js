const fs = require('fs');
const path = require('path');

// Log file path (can be changed if needed)
const logFilePath = path.join(__dirname, 'codex-log.txt');

/**
 * Append a message to codex-log.txt with timestamp.
 * @param {string} message - The log message
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;

  fs.appendFile(logFilePath, entry, (err) => {
    if (err) {
      console.error("❌ Failed to write to log:", err);
    }
  });
}

// Example usage
// log("🚀 Deployment script started");

module.exports = log;
