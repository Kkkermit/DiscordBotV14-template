const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { color, getTimestamp } = require('../utils/logEffects');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function askRequiredQuestion(query) {
    let answer;
    do {
        answer = await askQuestion(query);
        if (!answer) {
            console.log(`${color.red}[${getTimestamp()}]${color.reset} [ERROR] This field is a required one. Please fill it in to continue.`);
        }
    } while (!answer);
    return answer;
}

console.log(`${color.green}[${getTimestamp()}]${color.reset} [SETUP_ENV] Running setup for environment variables...`);

async function setupEnvironment() {
    const envFile = '.env';
    const envPath = path.resolve(process.cwd(), envFile);

    const botToken = await askRequiredQuestion(`${color.yellow}[${getTimestamp()}]${color.reset} [SETUP_ENV] ${color.red}[REQUIRED]${color.reset} Please enter your bot token: `);
    const clientId = await askRequiredQuestion(`${color.yellow}[${getTimestamp()}]${color.reset} [SETUP_ENV] ${color.red}[REQUIRED]${color.reset} Please enter your client ID: `);
    const guildId = await askQuestion(`${color.yellow}[${getTimestamp()}]${color.reset} [SETUP_ENV] ${color.yellow}[NOT-REQUIRED]${color.reset} Please enter your guild ID: `);
    const devId = await askRequiredQuestion(`${color.yellow}[${getTimestamp()}]${color.reset} [SETUP_ENV] ${color.red}[REQUIRED]${color.reset} Please enter your developer ID: `);
    const mongoDb = await askQuestion(`${color.yellow}[${getTimestamp()}]${color.reset} [SETUP_ENV] ${color.yellow}[NOT-REQUIRED]${color.reset} Please enter your MongoDB connection string: `);

    const envContent = `
token=${botToken}
clientid=${clientId}
guildid=${guildId}
devid=${devId}
mongodb=${mongoDb}
`;

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    console.log(`${color.green}[${getTimestamp()}]${color.reset} [SETUP_ENV_SUCCESS] Environment variables have been added to ${envFile}`);
    rl.close();
}

setupEnvironment();