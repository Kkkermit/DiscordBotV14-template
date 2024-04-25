module.exports = (db) => {

    // Crtl + C
    process.on('SIGINT', () => {
        console.log();
        error('SIGINT: Exiting...');
        process.exit();
    });

    // Standard crash
    process.on('uncaughtException', (err) => {
        error(`UNCAUGHT EXCEPTION: ${err.stack}`);
    });

    // Killed process
    process.on('SIGTERM', () => {
        error('SIGTERM: Closing database and exiting...');
        process.exit();
    });

    // Standard crash
    process.on('unhandledRejection', (err) => {
        error(`UNHANDLED REJECTION: ${err.stack}`);
    });

    // Deprecation warnings
    process.on('warning', (warning) => {
        warn(warning);
    });

    // Reference errors
    process.on('uncaughtReferenceError', (err) => {
        error(err.stack);
    });

};

const color = {
    red: '\x1b[31m',
    orange: '\x1b[38;5;202m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[36m',
    reset: '\x1b[0m',
}

function error(message) {
    console.log(`${color.blue}[ ERROR ] ${message}${color.reset}`);
}

function warn(message) {
    console.log(`${color.orange}[ WARN ]${color.reset} ${message}`);
}