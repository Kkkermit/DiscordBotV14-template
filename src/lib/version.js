const axios = require('axios');
const config = require('../config')
const { color, getTimestamp } = require('../utils/logEffects.js');

async function getLatestVersion() {
    try {
        const response = await axios.get('https://api.github.com/repos/Kkkermit/DiscordBotV14-template/releases/latest');
        const latestVersion = response.data.tag_name;
        return latestVersion;
    } catch (error) {
        console.error(`${color.red}[${getTimestamp()}] [LATEST_VERSION] Error while retrieving the latest version. No release found. ${color.reset}`);
        return null;
    }
}

function checkVersion(currentVersion) {
    getLatestVersion().then((latestVersion) => {
        if (currentVersion < latestVersion) {
            console.log(`${color.torquise}[${getTimestamp()}] [LATEST_VERSION] Attention, a new update is available, please install it - https://github.com/Kkkermit/DiscordBotV14-template ${color.reset}`);
        } else {
            console.log(`${color.torquise}[${getTimestamp()}] [LATEST_VERSION] You have the latest version of the code. (${config.botVersion}) ${color.reset}`);
        }
    });
}

module.exports = { getLatestVersion, checkVersion };