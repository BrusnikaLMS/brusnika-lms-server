/**
 * Server configuration constants
 */
export const SERVER = {
    DEFAULT_PORT: '8080',
    SESSION_COOKIE_NAME: 'h5p.sid',
    SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * H5P paths configuration
 */
export const H5P_PATHS = {
    LIBRARIES: 'h5p/libraries',
    CONTENT: 'h5p/content',
    TEMPORARY: 'h5p/temporary-storage',
    USER_DATA: 'h5p/user-data',
    CORE: 'h5p/core',
    EDITOR: 'h5p/editor',
} as const;

/**
 * API routes
 */
export const ROUTES = {
    HEALTH: '/health',
    LOGIN: '/login',
    LOGOUT: '/logout',
    PUBLIC_API: '/api/public',
} as const;

/**
 * Cache configuration
 */
export const CACHE = {
    TTL: 60 * 60 * 24, // 24 hours in seconds
    MAX_ITEMS: 2 ** 10,
    TYPE: {
        MEMORY: 'in-memory',
        REDIS: 'redis',
    },
} as const;

/**
 * Storage types
 */
export const STORAGE = {
    MONGO_S3: 'mongos3',
    S3: 's3',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Not logged in. Please call /login first.',
    USER_ID_REQUIRED: 'userId is required',
    CONTENT_ID_REQUIRED: 'contentId is required',
    MISSING_PARAMETERS: 'Missing required parameters',
    MALFORMED_REQUEST: 'Malformed request',
    INTERNAL_ERROR: 'Internal server error',
    NOT_FOUND: 'Not found',
    LOGOUT_FAILED: 'Failed to logout',
} as const;

/**
 * i18n namespaces
 */
export const I18N_NAMESPACES = [
    'client',
    'copyright-semantics',
    'hub',
    'library-metadata',
    'metadata-semantics',
    'mongo-s3-content-storage',
    's3-temporary-storage',
    'server',
    'storage-file-implementations',
] as const;

/**
 * Supported languages for H5P Hub localization
 */
export const SUPPORTED_LANGUAGES = [
    'en', 'ru', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'uk',
    'bg', 'bs', 'ca', 'cs', 'el', 'et', 'eu', 'fi', 'gl', 'ja',
    'km', 'ko', 'nb', 'nn', 'sl', 'sv', 'tr', 'zh'
] as const;

/**
 * Environment variable names
 */
export const ENV = {
    PORT: 'PORT',
    SESSION_SECRET: 'SESSION_SECRET',
    NODE_ENV: 'NODE_ENV',
    CACHE: 'CACHE',
    REDIS_HOST: 'REDIS_HOST',
    REDIS_PORT: 'REDIS_PORT',
    REDIS_AUTH_PASS: 'REDIS_AUTH_PASS',
    REDIS_DB: 'REDIS_DB',
    TEMP_UPLOADS: 'TEMP_UPLOADS',
    TRUST_PROXY: 'TRUST_PROXY',
    COOKIE_DOMAIN: 'COOKIE_DOMAIN',
    CONTENT_STORAGE: 'CONTENTSTORAGE',
    TEMPORARY_STORAGE: 'TEMPORARYSTORAGE',
    CLAMSCAN_ENABLED: 'CLAMSCAN_ENABLED',
} as const;
