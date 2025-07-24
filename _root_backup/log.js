const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, 'codex-log.txt');

/**
 * Append a log message with a timestamp
 * @param {string} message
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_PATH, entry);
}

module.exports = log;
