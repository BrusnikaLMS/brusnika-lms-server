/**
 * Logger utility for H5P server
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

const METHOD_COLORS: Record<string, string> = {
    GET: COLORS.green,
    POST: COLORS.blue,
    PUT: COLORS.yellow,
    PATCH: COLORS.magenta,
    DELETE: COLORS.red,
    OPTIONS: COLORS.gray
};

const STATUS_COLORS: Record<string, string> = {
    '2': COLORS.green,
    '3': COLORS.cyan,
    '4': COLORS.yellow,
    '5': COLORS.red
};

function getTimestamp(): string {
    return new Date().toISOString();
}

function formatDuration(ms: number): string {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

function colorize(text: string, color: string): string {
    return `${color}${text}${COLORS.reset}`;
}

class Logger {
    private level: LogLevel;
    private prefix: string;

    constructor(prefix = 'H5P', level?: LogLevel) {
        this.prefix = prefix;
        this.level = level ?? this.getLogLevelFromEnv();
    }

    private getLogLevelFromEnv(): LogLevel {
        const envLevel = process.env.LOG_LEVEL?.toUpperCase();
        switch (envLevel) {
            case 'DEBUG': return LogLevel.DEBUG;
            case 'INFO': return LogLevel.INFO;
            case 'WARN': return LogLevel.WARN;
            case 'ERROR': return LogLevel.ERROR;
            default: return LogLevel.INFO;
        }
    }

    private formatPrefix(): string {
        return `${colorize(getTimestamp(), COLORS.dim)} ${colorize(`[${this.prefix}]`, COLORS.cyan)}`;
    }

    debug(message: string, data?: Record<string, unknown>): void {
        if (this.level <= LogLevel.DEBUG) {
            console.log(`${this.formatPrefix()} ${colorize('DEBUG', COLORS.gray)} ${message}`, data ?? '');
        }
    }

    info(message: string, data?: Record<string, unknown>): void {
        if (this.level <= LogLevel.INFO) {
            console.log(`${this.formatPrefix()} ${colorize('INFO', COLORS.blue)} ${message}`, data ?? '');
        }
    }

    warn(message: string, data?: Record<string, unknown>): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(`${this.formatPrefix()} ${colorize('WARN', COLORS.yellow)} ${message}`, data ?? '');
        }
    }

    error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(`${this.formatPrefix()} ${colorize('ERROR', COLORS.red)} ${message}`, data ?? '');
            if (error instanceof Error) {
                console.error(`${colorize('  Stack:', COLORS.dim)} ${error.stack}`);
            }
        }
    }

    request(method: string, url: string, statusCode: number, duration: number, extra?: Record<string, unknown>): void {
        if (this.level > LogLevel.INFO) return;

        const methodColor = METHOD_COLORS[method] || COLORS.reset;
        const statusColor = STATUS_COLORS[String(statusCode)[0]] || COLORS.reset;

        const methodStr = colorize(method.padEnd(7), methodColor);
        const statusStr = colorize(String(statusCode), statusColor);
        const durationStr = colorize(formatDuration(duration), COLORS.dim);
        const urlStr = colorize(url, COLORS.bright);

        let line = `${this.formatPrefix()} ${methodStr} ${statusStr} ${durationStr} ${urlStr}`;

        if (extra) {
            const extraStr = Object.entries(extra)
                .map(([k, v]) => `${k}=${v}`)
                .join(' ');
            line += ` ${colorize(extraStr, COLORS.dim)}`;
        }

        console.log(line);
    }
}

export const logger = new Logger();

export function createLogger(prefix: string, level?: LogLevel): Logger {
    return new Logger(prefix, level);
}