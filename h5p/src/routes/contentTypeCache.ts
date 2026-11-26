import express from 'express';
import * as H5P from '@lumieducation/h5p-server';
import type { IRequestWithUser, IRequestWithLanguage } from '@lumieducation/h5p-express';

type IContentTypeCacheRequest = IRequestWithUser & IRequestWithLanguage;

/** Default language fallback */
const DEFAULT_LANGUAGE = 'en';

/**
 * Creates a router for content type cache that removes the "restricted" flag
 * This allows all content types to be installed without H5P Hub registration
 * Supports localization based on Accept-Language header
 */
export function createUnrestrictedContentTypeCacheRouter(
    h5pEditor: H5P.H5PEditor
): express.Router {
    const router = express.Router();

    router.post('/', async (req: IContentTypeCacheRequest, res) => {
        try {
            const language = req.language ?? DEFAULT_LANGUAGE;
            const hubInfo = await h5pEditor.getContentTypeCache(req.user, language);

            // Remove restrictions from all content types
            const unrestrictedLibraries = hubInfo.libraries.map((lib) => ({
                ...lib,
                restricted: false,
                canInstall: true
            }));

            res.status(200).json({
                ...hubInfo,
                libraries: unrestrictedLibraries
            });
        } catch (error: any) {
            console.error('Error fetching content types:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch content types'
            });
        }
    });

    return router;
}
