const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'messages.db');
const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS user_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        channelId TEXT NOT NULL,
        content TEXT NOT NULL,
        role TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_messages_userId ON user_messages(userId);
    CREATE INDEX IF NOT EXISTS idx_user_messages_channelId ON user_messages(channelId);
    CREATE INDEX IF NOT EXISTS idx_user_messages_timestamp ON user_messages(timestamp);
`);

function setupMessageHistorySystem() {
    console.log('Database connection established');
}

module.exports = { db, setupMessageHistorySystem };