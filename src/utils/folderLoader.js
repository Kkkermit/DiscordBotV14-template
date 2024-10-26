const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function folderLoader(client) {

    client.logs.info(`[EVENTS] Started loading events...`);
    client.logs.success(`[EVENTS] Loaded ${client.eventNames().length} events.`);

    if (mongoose.connect) {
        client.logs.success('[DATABASE] Connected to MongoDB successfully.');

        const schemaFolder = path.join(__dirname, '../schemas'); 
        fs.readdir(schemaFolder, (err, files) => {
            if (err) {
                client.logs.error('[ERROR] Error reading schemas folder:', err);
                return;
            };
            client.logs.success(`[SCHEMAS] Loaded ${files.length} schema files.`);
        });
    };
    
    const loadFolder = (folderName, folderPath) => {
        client.logs.info(`[${folderName.toUpperCase()}] Started loading ${folderName.toLowerCase()}...`);
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                client.logs.error(`[ERROR] Error reading ${folderName.toLowerCase()} folder:`, err);
                return;
            }
            client.logs.success(`[${folderName.toUpperCase()}] Loaded ${files.length} ${folderName.toLowerCase()} files.`);
        });
    };
    
    const triggerFolder = path.join(__dirname, '../triggers');
    const scriptsFolder = path.join(__dirname, '../scripts');
    
    loadFolder('triggers', triggerFolder);
    loadFolder('scripts', scriptsFolder);
};

module.exports = folderLoader;