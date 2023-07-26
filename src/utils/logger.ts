import { createLogger, format, transports } from 'winston';

const consoleLogFormat = format.printf((info) => {
    const log = `${info.timestamp} | ${info.level.toUpperCase()} | ${info.message}`;

    return info.stack ? `${log}\n${info.stack}` : log;
});

const consoleLogger = createLogger({
    level: 'debug',
    exitOnError: false,
    format: format.combine(format.errors({ stack: true }), format.timestamp(), consoleLogFormat),
    transports: [ new transports.Console() ],
});

const combinedLogger = createLogger({
    level: 'info',
    exitOnError: false,
    format: format.combine(format.timestamp(), format.json()),
    transports: [ new transports.File({ filename: './logs/combined.log' }) ],
});

const errorLogger = createLogger({
    level: 'error',
    exitOnError: false,
    format: format.combine(format.timestamp(), format.json()),
    transports: [ new transports.File({ filename: './logs/error.log' }) ],
});

class Logger {
    info(msg: string | Object, name='') {
        consoleLogger.info(`${name ? name+': ': ''}${msg}`);
        if (typeof msg === 'object') msg = msg.toString();
        combinedLogger.info(`${name ? name+': ': ''}${msg}`, { color: 'blue' });
    }

    error(msg: string | Object, name='') {
        consoleLogger.error(`${name ? name+': ': ''}${msg}`);
        if (typeof msg === 'object') msg = msg.toString();
        combinedLogger.error(`${name ? name+': ': ''}${msg}`, { color: 'red' });
        errorLogger.error(`${name ? name+': ': ''}${msg}`, { color: 'red' });
    }

    warn(msg: string | Object, name='') {
        consoleLogger.warn(`${name ? name+': ': ''}${msg}`);
        if (typeof msg === 'object') msg = msg.toString();
        combinedLogger.warn(`${name ? name+': ': ''}${msg}`, { color: 'orange' });
    }

    debug(msg: string | Object, name='') {
        consoleLogger.debug(`${name ? name+': ': ''}${msg}`);
    }
}

export const logger = new Logger();
