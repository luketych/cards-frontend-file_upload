import pino from 'pino';
import { addLog } from './storage';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Create the logger instance
const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    base: {
        env: process.env.NODE_ENV,
    },
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'SYS:standard',
            destination: 1, // stdout
            sync: true // Ensure synchronous writing
        }
    }
});

// Store original console methods
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
    info: console.info
};

// Simple debug function that uses original console
const debugLog = (level: LogLevel, ...args: any[]) => {
    originalConsole.log(`[DEBUG] ${level}:`, ...args);
};

// Create the debug logger with storage
const debugLogger = {
    debug: async (msg: string, ...args: any[]) => {
        debugLog('debug', msg, ...args);
        await addLog({ level: 'debug', message: msg, data: args, timestamp: Date.now() });
        return logger.debug(msg, ...args);
    },
    info: async (msg: string, ...args: any[]) => {
        debugLog('info', msg, ...args);
        await addLog({ level: 'info', message: msg, data: args, timestamp: Date.now() });
        return logger.info(msg, ...args);
    },
    warn: async (msg: string, ...args: any[]) => {
        debugLog('warn', msg, ...args);
        await addLog({ level: 'warn', message: msg, data: args, timestamp: Date.now() });
        return logger.warn(msg, ...args);
    },
    error: async (msg: string, ...args: any[]) => {
        debugLog('error', msg, ...args);
        await addLog({ level: 'error', message: msg, data: args, timestamp: Date.now() });
        return logger.error(msg, ...args);
    }
};

// Export both the debug logger and the original pino logger
export { debugLogger };
export default debugLogger;

// Example usage:
// import logger from '@/utils/logger';
// logger.info('User logged in');
// logger.info({ userId: 123 }, 'User logged in');
// logger.error({ error: new Error('Something went wrong') }, 'Operation failed'); 