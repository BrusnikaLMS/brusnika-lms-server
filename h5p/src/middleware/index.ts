import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import csurf from '@dr.pogodin/csurf';
import i18nextHttpMiddleware from 'i18next-http-middleware';
import * as H5P from '@lumieducation/h5p-server';
import LMSUser from '../LMSUser';
import { DirectoryResult } from 'tmp-promise';
import { logger } from '../utils/logger';

export interface MiddlewareConfig {
    maxFileSize: number;
    useTempUploads: boolean;
    tmpDir?: DirectoryResult;
    i18next: any;
}

const DEFAULT_LANGUAGE = 'en';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
const H5P_PUBLIC_ASSET_PREFIXES = [
    '/h5p/core/',
    '/h5p/editor/',
    '/h5p/libraries/'
];

/**
 * Configure request logging middleware
 * Logs request details including session and cookie info for debugging
 */
export function configureRequestLogging(app: express.Application): void {
    app.use((req, res, next) => {
        const startTime = Date.now();

        // Capture original end to log response
        const originalEnd = res.end;
        res.end = function (chunk?: any, encoding?: any, callback?: any) {
            const duration = Date.now() - startTime;
            const sessionId = req.sessionID;
            const userId = (req.session as any)?.userId;
            const hasCookie = !!req.headers.cookie;

            // Extract h5p.sid value from cookie
            const cookieHeader = req.headers.cookie || '';
            const h5pSidMatch = cookieHeader.match(/h5p\.sid=([^;]+)/);
            const h5pSidValue = h5pSidMatch ? h5pSidMatch[1].substring(0, 20) + '...' : 'none';

            // Log request with session info
            logger.request(req.method, req.originalUrl, res.statusCode, duration, {
                sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'none',
                visitorSid: h5pSidValue,
                userId: userId || 'none',
                hasCookie
            });

            // Debug log for 401 errors - full session/cookie details
            if (res.statusCode === 401) {
                logger.warn('401 Unauthorized - Session Debug', {
                    path: req.path,
                    origin: req.headers.origin,
                    referer: req.headers.referer,
                    host: req.headers.host,
                    xForwardedFor: req.headers['x-forwarded-for'],
                    xForwardedHost: req.headers['x-forwarded-host'],
                    xForwardedProto: req.headers['x-forwarded-proto'],
                    cookie: req.headers.cookie ? '[present]' : '[missing]',
                    sessionID: sessionId || '[no session]',
                    sessionUserId: userId || '[no userId in session]',
                    sessionData: req.session ? Object.keys(req.session) : '[no session object]'
                });
            }

            // Debug log for /login to see Set-Cookie behavior
            if (req.path === '/login' && req.method === 'POST') {
                const setCookie = res.getHeader('set-cookie');
                logger.info('LOGIN Set-Cookie Debug', {
                    origin: req.headers.origin,
                    incomingCookie: h5pSidValue,
                    setCookie: setCookie ? String(setCookie).substring(0, 100) + '...' : '[not sent]',
                    newSessionId: sessionId
                });
            }

            return originalEnd.call(this, chunk, encoding, callback);
        } as typeof res.end;

        next();
    });
}

/**
 * Configure security headers for iframe support
 */
export function configureSecurityHeaders(app: express.Application): void {
    app.use((req, res, next) => {
        res.removeHeader('X-Frame-Options');
        res.setHeader(
            'Content-Security-Policy',
            "frame-ancestors 'self' http://localhost:* https://localhost:*"
        );
        next();
    });
}

/**
 * Configure CORS middleware
 */
export function configureCors(app: express.Application): void {
    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token', 'csrf-token', 'Accept-Language'],
        exposedHeaders: ['CSRF-Token']
    }));
}

/**
 * Configure body parser middleware
 */
export function configureBodyParser(app: express.Application): void {
    app.use(bodyParser.json({ limit: '500mb' }));
    app.use(bodyParser.urlencoded({ extended: true }));
}

/**
 * Configure file upload middleware
 */
export function configureFileUpload(app: express.Application, config: MiddlewareConfig): void {
    app.use(
        fileUpload({
            limits: { fileSize: config.maxFileSize },
            useTempFiles: config.useTempUploads,
            tempFileDir: config.useTempUploads ? config.tmpDir?.path : undefined
        })
    );
}

/**
 * Configure session middleware
 */
export function configureSession(app: express.Application): void {
    const isProduction = process.env.NODE_ENV === 'production';

    if (process.env.TRUST_PROXY === '1' || isProduction) {
        app.set('trust proxy', 1);
    }

    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'h5p-session-secret-change-in-production',
            resave: false,
            saveUninitialized: false,
            name: 'h5p.sid',
            cookie: {
                httpOnly: true,
                secure: isProduction ? 'auto' : false,
                sameSite: isProduction ? 'none' : 'lax',
                domain: process.env.COOKIE_DOMAIN || undefined,
                maxAge: SESSION_MAX_AGE,
                path: '/'
            },
            proxy: isProduction
        })
    );
}

/**
 * Configure CSRF protection middleware
 */
export function configureCSRF() {
    return {
        protection: csurf(),
        generator: csurf({ ignoreMethods: ['POST', 'GET'] })
    };
}

/**
 * Configure i18next middleware
 */
export function configureI18next(app: express.Application, i18nextInstance: any): void {
    app.use(i18nextHttpMiddleware.handle(i18nextInstance, {
        ignoreRoutes: ['/health', '/login', '/logout']
    }));
}

/**
 * Check if request can be served without a real session user.
 *
 * Important: H5P temporary files and content files may look like static files
 * (`.png`, `.jpg`, ...), but they must keep the real session user. Temporary
 * storage is user-scoped, so serving them as `anonymous` breaks image preview
 * right after upload and leads to 404s.
 */
function isPublicAssetRequest(path: string): boolean {
    const hasStaticExtension =
        /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|map)$/i.test(path);

    if (!hasStaticExtension) {
        return false;
    }

    if (!path.startsWith('/h5p/')) {
        return true;
    }

    return H5P_PUBLIC_ASSET_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Check if endpoint is public (no auth required)
 */
function isPublicEndpoint(path: string, action?: string): boolean {
    const publicActions = ['content-type-cache', 'content-hub-metadata-cache'];
    return (
        (path === '/h5p/ajax' && publicActions.includes(action as string)) ||
        path.startsWith('/h5p/content-type-cache') ||
        path.startsWith('/h5p/content-hub-metadata-cache')
    );
}

/**
 * Authentication middleware - extracts user from session
 */
export function authMiddleware(
    req: express.Request & { user: H5P.IUser; csrfToken?: () => string },
    res: express.Response,
    next: express.NextFunction
): void {
    if (isPublicAssetRequest(req.path)) {
        req.user = new LMSUser('anonymous');
        return next();
    }

    if (isPublicEndpoint(req.path, req.query.action as string)) {
        req.user = new LMSUser('anonymous');
        return next();
    }

    const userId = (req.session as any).userId;
    if (userId) {
        req.user = new LMSUser(userId);
        next();
    } else {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Not logged in. Please call /login first.'
        });
    }
}

/**
 * CSRF token middleware - adds csrfToken to user object
 */
export function csrfTokenMiddleware(
    req: express.Request & { user: H5P.IUser; csrfToken?: () => string },
    res: express.Response,
    next: express.NextFunction
): void {
    if (req.user) {
        (req.user as any).csrfToken = req.csrfToken;
    }
    next();
}

/**
 * Language injection middleware for H5P AJAX requests.
 * Injects language parameter from session into H5P AJAX requests
 * to ensure content type names are localized.
 *
 * Priority:
 * 1. Explicit language query parameter
 * 2. Language stored in session (set during login)
 * 3. Language from Accept-Language header (i18next)
 * 4. Default to 'en'
 */
export function h5pLanguageMiddleware(
    req: express.Request & { language?: string; session?: { language?: string } },
    res: express.Response,
    next: express.NextFunction
): void {
    if (req.path === '/h5p/ajax' && !req.query.language) {
        const sessionLanguage = (req.session as any)?.language;
        const i18nextLanguage = req.language;
        const language = sessionLanguage || i18nextLanguage || DEFAULT_LANGUAGE;

        // Express 5: req.query is read-only, override with defineProperty
        Object.defineProperty(req, 'query', {
            value: { ...req.query, language },
            writable: true,
            configurable: true
        });
    }
    next();
}
