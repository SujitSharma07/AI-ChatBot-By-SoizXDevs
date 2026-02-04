const fs = require('fs');
const path = require('path');

const blacklistPath = path.join(__dirname, '..', 'data', 'blacklist.json');

function isUserBlacklisted(userId) {
    try {
        if (!fs.existsSync(blacklistPath)) {
            return false;
        }

        const fileContent = fs.readFileSync(blacklistPath, 'utf8');
        const blacklistData = JSON.parse(fileContent);

        if (!blacklistData.blacklistedUsers || blacklistData.blacklistedUsers.length === 0) {
            return false;
        }

        return blacklistData.blacklistedUsers.some(entry => entry.userId === userId);
    } catch (error) {
        console.error('Error checking blacklist:', error);
        return false;
    }
}

function getBlacklistEntry(userId) {
    try {
        if (!fs.existsSync(blacklistPath)) {
            return null;
        }

        const fileContent = fs.readFileSync(blacklistPath, 'utf8');
        const blacklistData = JSON.parse(fileContent);

        if (!blacklistData.blacklistedUsers || blacklistData.blacklistedUsers.length === 0) {
            return null;
        }

        return blacklistData.blacklistedUsers.find(entry => entry.userId === userId) || null;
    } catch (error) {
        console.error('Error getting blacklist entry:', error);
        return null;
    }
}

module.exports = {
    isUserBlacklisted,
    getBlacklistEntry
};

/*
@Author: Sujit Sharma
Community: https://discord.gg/XkXSRrRE3P (SoizX Devs™)
Reach out for support or credits.
*/
