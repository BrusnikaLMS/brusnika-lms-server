import express from 'express';
import * as H5P from '@lumieducation/h5p-server';
import type {
    IRequestWithUser,
    IRequestWithLanguage
} from '@lumieducation/h5p-express';
import { ERROR_MESSAGES } from './constants';
import { HttpStatus } from './utils/errorHandler';

/** Request with user and language for editing */
type IEditorRequest = IRequestWithLanguage & { user: H5P.IUser };

/** Default language fallback */
const DEFAULT_LANGUAGE = 'en';

/**
 * Gets the language to use for H5P rendering
 */
function getLanguage(req: { language?: string }, languageOverride: string | 'auto'): string {
    return languageOverride === 'auto'
        ? (req.language ?? DEFAULT_LANGUAGE)
        : languageOverride;
}

/**
 * Extracts string query parameter or undefined
 */
function getStringQuery(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

/** Content request body structure */
interface IContentRequestBody {
    params: {
        params: H5P.ContentParameters;
        metadata: H5P.IContentMetadata;
    };
    library: string;
}

/**
 * Validates content request body has required fields
 */
function isValidContentBody(body: unknown): body is IContentRequestBody {
    const b = body as Record<string, unknown>;
    return !!(
        b?.params &&
        (b.params as Record<string, unknown>)?.params &&
        (b.params as Record<string, unknown>)?.metadata &&
        b?.library
    );
}

/**
 * Handles errors from H5P operations
 */
function handleH5PError(res: express.Response, error: unknown, contextMessage?: string): void {
    console.error(error);

    if (error instanceof H5P.H5pError) {
        res.status(error.httpStatusCode).send(error.message);
        return;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    const fullMessage = contextMessage ? `${contextMessage}: ${message}` : message;
    res.status(HttpStatus.INTERNAL_ERROR).send(fullMessage);
}

/**
 * Creates router for H5P content CRUD operations.
 *
 * @param h5pEditor - H5P Editor instance
 * @param h5pPlayer - H5P Player instance
 * @param languageOverride - Language to use ('auto' uses request language)
 * @returns Express router with H5P content routes
 */
export default function createH5PContentRoutes(
    h5pEditor: H5P.H5PEditor,
    h5pPlayer: H5P.H5PPlayer,
    languageOverride: string | 'auto' = 'auto'
): express.Router {
    const router = express.Router();

    /**
     * GET /:contentId/play
     * Renders H5P content for viewing/playing
     */
    router.get('/:contentId/play', async (req: IRequestWithUser, res) => {
        try {
            const content = await h5pPlayer.render(
                req.params.contentId,
                req.user,
                getLanguage(req, languageOverride),
                {
                    contextId: getStringQuery(req.query.contextId),
                    asUserId: getStringQuery(req.query.asUserId),
                    readOnlyState: req.query.readOnlyState === 'yes' ? true : undefined
                }
            );
            res.status(HttpStatus.OK).send(content);
        } catch (error) {
            handleH5PError(res, error);
        }
    });

    /**
     * GET /:contentId/edit
     * Gets content data for H5P editor
     */
    router.get('/:contentId/edit', async (req: IEditorRequest, res) => {
        try {
            const contentId = ['undefined', 'new'].includes(req.params.contentId)
                ? undefined
                : req.params.contentId;

            const editorModel = await h5pEditor.render(
                contentId,
                getLanguage(req, languageOverride),
                req.user
            ) as H5P.IEditorModel;

            // Return just editor model for new content
            if (!contentId) {
                res.status(HttpStatus.OK).send(editorModel);
                return;
            }

            // Include content data for existing content
            const content = await h5pEditor.getContent(contentId, req.user);
            res.status(HttpStatus.OK).send({
                ...editorModel,
                library: content.library,
                metadata: content.params.metadata,
                params: content.params.params
            });
        } catch (error) {
            handleH5PError(res, error);
        }
    });

    /**
     * POST /
     * Creates new H5P content
     */
    router.post('/', async (req: IRequestWithUser, res) => {
        if (!isValidContentBody(req.body) || !req.user) {
            res.status(HttpStatus.BAD_REQUEST).send(ERROR_MESSAGES.MALFORMED_REQUEST);
            return;
        }

        try {
            const { id: contentId, metadata } =
                await h5pEditor.saveOrUpdateContentReturnMetaData(
                    undefined,
                    req.body.params.params,
                    req.body.params.metadata,
                    req.body.library,
                    req.user
                );

            res.status(HttpStatus.OK).json({ contentId, metadata });
        } catch (error) {
            handleH5PError(res, error);
        }
    });

    /**
     * PATCH /:contentId
     * Updates existing H5P content
     */
    router.patch('/:contentId', async (req: IRequestWithUser, res) => {
        if (!isValidContentBody(req.body) || !req.user) {
            res.status(HttpStatus.BAD_REQUEST).send(ERROR_MESSAGES.MALFORMED_REQUEST);
            return;
        }

        try {
            const { id: contentId, metadata } =
                await h5pEditor.saveOrUpdateContentReturnMetaData(
                    req.params.contentId,
                    req.body.params.params,
                    req.body.params.metadata,
                    req.body.library,
                    req.user
                );

            res.status(HttpStatus.OK).json({ contentId, metadata });
        } catch (error) {
            handleH5PError(res, error);
        }
    });

    /**
     * DELETE /:contentId
     * Deletes H5P content
     */
    router.delete('/:contentId', async (req: IRequestWithUser, res) => {
        const { contentId } = req.params;

        try {
            await h5pEditor.deleteContent(contentId, req.user);
            res.status(HttpStatus.OK).send(`Content ${contentId} successfully deleted.`);
        } catch (error) {
            handleH5PError(res, error, `Error deleting content with id ${contentId}`);
        }
    });

    /**
     * GET /
     * Lists all H5P content
     */
    router.get('/', async (req: IRequestWithUser, res) => {
        try {
            const contentIds = await h5pEditor.contentManager.listContent(req.user);

            const contentObjects = await Promise.all(
                contentIds.map(async (id) => ({
                    contentId: id,
                    ...(await h5pEditor.contentManager.getContentMetadata(id, req.user))
                }))
            );

            res.status(HttpStatus.OK).send(
                contentObjects.map(({ contentId, title, mainLibrary }) => ({
                    contentId,
                    title,
                    mainLibrary
                }))
            );
        } catch (error) {
            handleH5PError(res, error);
        }
    });

    return router;
}

