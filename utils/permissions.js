const config = require('../config.js');

function checkOwnerPermission(userId) {
    return config.OWNER_IDS.includes(userId);
}

module.exports = {
    checkOwnerPermission
};

/*
@Author: SoizX Devs
Community: https://discord.gg/XkXSRrRE3P (SoizX Devs™)
Reach out for support or credits.
*/

