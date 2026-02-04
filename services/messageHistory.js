const { db } = require('../db/database.js');

async function addMessageToHistory(userId, channelId, content, role) {
    try {
        const stmt = db.prepare(`
            INSERT INTO user_messages (userId, channelId, content, role, timestamp)
            VALUES (?, ?, ?, ?, datetime('now'))
        `);
        
        stmt.run(userId, channelId, content, role);
        
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM user_messages WHERE userId = ?');
        const result = countStmt.get(userId);
        
        if (result.count > 25) {
            const deleteStmt = db.prepare(`
                DELETE FROM user_messages 
                WHERE userId = ? AND id NOT IN (
                    SELECT id FROM user_messages 
                    WHERE userId = ? 
                    ORDER BY timestamp DESC 
                    LIMIT 25
                )
            `);
            deleteStmt.run(userId, userId);
        }
        
    } catch (error) {
        console.error('Error adding message to history:', error);
    }
}

async function getUserHistory(userId, limit = 15) {
    try {
        const stmt = db.prepare(`
            SELECT content, role, timestamp 
            FROM user_messages 
            WHERE userId = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `);
        
        const messages = stmt.all(userId, limit);
        return messages.reverse();
        
    } catch (error) {
        console.error('Error getting user history:', error);
        return [];
    }
}

async function getChannelHistory(userId, channelId, limit = 8) {
    try {
        const stmt = db.prepare(`
            SELECT content, role, timestamp 
            FROM user_messages 
            WHERE userId = ? AND channelId = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `);
        
        const messages = stmt.all(userId, channelId, limit);
        return messages.reverse();
        
    } catch (error) {
        console.error('Error getting channel history:', error);
        return [];
    }
}

async function cleanupOldMessages() {
    try {
        const stmt = db.prepare(`
            DELETE FROM user_messages 
            WHERE timestamp < datetime('now', '-7 days')
        `);
        
        const result = stmt.run();
        if (result.changes > 0) {
            console.log(`Cleaned up ${result.changes} old messages`);
        }
        
    } catch (error) {
        console.error('Error cleaning up old messages:', error);
    }
}

function formatHistoryForAI(messages) {
    if (!messages || messages.length === 0) return [];
    
    return messages.map(msg => ({
        role: msg.role,
        content: msg.content
    }));
}

module.exports = {
    addMessageToHistory,
    getUserHistory,
    getChannelHistory,
    cleanupOldMessages,
    formatHistoryForAI
};