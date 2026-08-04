import { dir, DirectoryResult } from 'tmp-promise';
import express from 'express';
import path from 'path';
import type * as H5P from '@lumieducation/h5p-server';
import type { i18n } from 'i18next';
import {
    h5pAjaxExpressRouter,
    libraryAdministrationExpressRouter
} from '@lumieducation/h5p-express';
import { createUnrestrictedContentTypeCacheRouter } from './routes/contentTypeCache';

import createH5PContentRoutes from './routes';
import { createPublicApiRouter } from './routes/public';
import { displayIps, clearTempFiles } from './utils';
import { initializeI18n } from './config/i18n';
import { initializeH5PConfig, createUrlGenerator, initializeH5P } from './config/h5p';
import {
    configureSecurityHeaders,
    configureCors,
    configureBodyParser,
    configureFileUpload,
    configureSession,
    configureCSRF,
    configureI18next,
    configureRequestLogging,
    authMiddleware,
    csrfTokenMiddleware,
    h5pLanguageMiddleware
} from './middleware';
import { loginHandler, logoutHandler, healthHandler, setLanguageHandler } from './routes/auth';
import { SERVER } from './constants';
import {IRequestWithFiles} from "./types";

/** Temporary directory for file uploads */
let tmpDir: DirectoryResult;

/**
 * Creates translation callback for H5P
 */
function createTranslationCallback(i18next: i18n) {
    return (key: string, language: string): string =>
        i18next.t(key, { lng: language });
}

/**
 * Configures temporary file cleanup middleware
 */
function configureTempFileCleanup(server: express.Express): void {
    server.use((req: IRequestWithFiles, res, next) => {
        res.on('finish', async () => clearTempFiles(req));
        next();
    });
}

/**
 * Configures public endpoints (no authentication required)
 */
function configurePublicEndpoints(
    server: express.Express,
    h5pEditor: H5P.H5PEditor
): void {
    // Health check
    server.get('/health', healthHandler);

    // Public API for backend-to-backend communication
    // WARNING: Ensure proper network-level security
    server.use('/api/public', createPublicApiRouter(h5pEditor));
}

/**
 * Configures authentication endpoints
 */
function configureAuthEndpoints(
    server: express.Express,
    csrfTokenGenerator: express.RequestHandler
): void {
    server.post('/login', csrfTokenGenerator, loginHandler);
    server.post('/logout', logoutHandler);
}

/**
 * Configures H5P routes with CSRF protection
 */
function configureH5PRoutes(
    server: express.Express,
    h5pEditor: H5P.H5PEditor,
    h5pPlayer: H5P.H5PPlayer,
    csrfProtection: express.RequestHandler
): void {
    const baseUrl = h5pEditor.config.baseUrl;

    // CSRF protection
    server.use(baseUrl, csrfProtection, csrfTokenMiddleware);

    // H5P AJAX routes
    server.use(
        baseUrl,
        h5pAjaxExpressRouter(
            h5pEditor,
            path.resolve('h5p/core'),
            path.resolve('h5p/editor'),
            undefined,
            'auto'
        )
    );

    // H5P Content CRUD routes
    server.use(baseUrl, createH5PContentRoutes(h5pEditor, h5pPlayer, 'auto'));

    // Library administration
    server.use(
        `${baseUrl}/libraries`,
        libraryAdministrationExpressRouter(h5pEditor)
    );

    // Content type cache (unrestricted, with localization)
    server.use(
        `${baseUrl}/content-type-cache`,
        createUnrestrictedContentTypeCacheRouter(h5pEditor)
    );
}

/**
 * Initializes and starts the H5P server
 */
async function startServer(): Promise<void> {
    // Initialize temporary uploads directory
    const useTempUploads = process.env.TEMP_UPLOADS !== 'false';
    if (useTempUploads) {
        tmpDir = await dir({ keep: false, unsafeCleanup: true });
    }

    // Initialize i18n
    const i18nextInstance = await initializeI18n();
    const translationCallback = createTranslationCallback(i18nextInstance);

    // Initialize H5P
    const config = await initializeH5PConfig();
    const urlGenerator = createUrlGenerator(config);
    const { h5pEditor, h5pPlayer } = await initializeH5P(
        config,
        urlGenerator,
        translationCallback
    );

    // Create Express server
    const server = express();

    // Configure base middleware
    configureSecurityHeaders(server);
    configureCors(server);
    configureBodyParser(server);
    configureFileUpload(server, {
        maxFileSize: h5pEditor.config.maxTotalSize,
        useTempUploads,
        tmpDir,
        i18next: i18nextInstance
    });

    // Cleanup temporary files after upload
    if (useTempUploads) {
        configureTempFileCleanup(server);
    }

    // Public endpoints (before session middleware)
    configurePublicEndpoints(server, h5pEditor);

    // Session and CSRF setup
    configureSession(server);
    const { protection: csrfProtection, generator: csrfTokenGenerator } = configureCSRF();

    // Request logging (after session to have access to session data)
    configureRequestLogging(server);

    // Auth endpoints
    configureAuthEndpoints(server, csrfTokenGenerator);

    // Authentication middleware for protected routes
    server.use(authMiddleware);

    // Language update endpoint (requires auth)
    server.post('/language', setLanguageHandler);

    // i18next middleware
    configureI18next(server, i18nextInstance);

    // Language injection for H5P AJAX requests (must be after i18next)
    server.use(h5pLanguageMiddleware);

    // H5P routes with CSRF protection
    configureH5PRoutes(server, h5pEditor, h5pPlayer, csrfProtection);

    // Start server
    const port = process.env.PORT || SERVER.DEFAULT_PORT;
    displayIps(port);
    server.listen(port);
}

// Start the server
startServer();
