import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import type * as H5P from '@lumieducation/h5p-server';
import LMSUser from '../LMSUser';
import { getStorageStats, getDetailedStorageStats } from '../utils/index';

/**
 * Creates public API router for accessing H5P user results.
 *
 * These endpoints are intended for backend-to-backend communication
 * and do NOT require authentication or CSRF protection.
 *
 * @warning Ensure proper network-level security (firewall, VPN, internal network)
 *
 * @param h5pEditor - H5P Editor instance with access to contentUserDataStorage
 * @returns Express router with public API endpoints
 */
export function createPublicApiRouter(h5pEditor: H5P.H5PEditor): Router {
    const router = Router();
    const storage = h5pEditor.contentUserDataStorage;

    /**
     * POST /api/public/install-libraries
     *
     * Fetches the H5P Hub content-type list and installs all available libraries
     * that are not yet installed. Intended to be called once during server setup
     * (e.g. from install.sh) so the LMS works in closed environments after that.
     *
     * No authentication required — restrict at network level (internal Docker network).
     *
     * @returns {
     *   installed: string[],    // machineName of newly installed libs
     *   skipped:  string[],    // already installed
     *   errors:   {name, error}[],
     *   total: number
     * }
     */
    router.post('/hub-stub', (_req, res) => {
        const filePath = path.join(__dirname, '../../static/content-types-hub.json');
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.send(data);
        } catch {
            res.json({ contentTypes: [] });
        }
    });

    router.post('/install-libraries', async (_req, res) => {
        const systemUser = new LMSUser('system');
        let hubInfo: any;

        try {
            hubInfo = await h5pEditor.getContentTypeCache(systemUser, 'en');
        } catch (err: any) {
            res.status(502).json({
                error: 'Cannot reach H5P Hub',
                message: err.message
            });
            return;
        }

        const installed: string[] = [];
        const skipped: string[] = [];
        const errors: { name: string; error: string }[] = [];

        for (const contentType of hubInfo.libraries) {
            if (contentType.installed) {
                skipped.push(contentType.machineName);
                continue;
            }
            try {
                await h5pEditor.installLibraryFromHub(contentType.machineName, systemUser);
                installed.push(contentType.machineName);
                console.log(`[install-libraries] installed ${contentType.machineName}`);
            } catch (err: any) {
                errors.push({ name: contentType.machineName, error: err.message });
                console.error(`[install-libraries] failed ${contentType.machineName}:`, err.message);
            }
        }

        res.status(200).json({ installed, skipped, errors, total: installed.length });
    });

    // IMPORTANT: More specific routes must be defined BEFORE parameterized routes
    // Otherwise /results/content/:id would match /results/:contentId/:userId

    /**
     * GET /api/public/results/content/:contentId
     *
     * Returns all completion results for a specific content (all users).
     * Useful for analytics and reporting.
     *
     * @param contentId - H5P content identifier
     *
     * @returns {
     *   contentId: string,
     *   results: Array<{
     *     userId: string,
     *     score: number,
     *     maxScore: number,
     *     openedTimestamp: number,
     *     finishedTimestamp: number,
     *     completionTime: number
     *   }>
     * }
     */
    router.get('/results/content/:contentId', async (req, res) => {
        try {
            const { contentId } = req.params;

            if (!contentId) {
                return res.status(400).json({
                    error: 'Missing required parameter',
                    message: 'contentId is required'
                });
            }

            let results: H5P.IFinishedUserData[] = [];
            try {
                results = await storage.getFinishedDataByContentId(contentId) || [];
            } catch (error) {
                results = [];
            }

            res.status(200).json({
                contentId,
                totalResults: results.length,
                results
            });
        } catch (error: any) {
            console.error('Error fetching content results:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });

    /**
     * GET /api/public/results/user/:userId
     *
     * Returns all results for a specific user (all content).
     * Useful for user progress tracking and GDPR data export.
     *
     * @param userId - User identifier
     *
     * @returns {
     *   userId: string,
     *   results: Array<{
     *     contentId: string,
     *     score: number,
     *     maxScore: number,
     *     openedTimestamp: number,
     *     finishedTimestamp: number,
     *     completionTime: number
     *   }>
     * }
     */
    router.get('/results/user/:userId', async (req, res) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    error: 'Missing required parameter',
                    message: 'userId is required'
                });
            }

            // Create user object for the storage method
            const user = new LMSUser(userId);

            let results: H5P.IFinishedUserData[] = [];
            try {
                results = await storage.getFinishedDataByUser(user) || [];
            } catch (error) {
                results = [];
            }

            res.status(200).json({
                userId,
                totalResults: results.length,
                results
            });
        } catch (error: any) {
            console.error('Error fetching user results:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });

    /**
     * GET /api/public/results/:contentId/:userId
     *
     * Returns all user data and completion results for a specific content and user.
     * NOTE: This route must be defined AFTER /results/content and /results/user
     *
     * @param contentId - H5P content identifier
     * @param userId - User identifier
     * @query contextId - Optional context identifier for multiple states per content-user
     *
     * @returns {
     *   contentId: string,
     *   userId: string,
     *   userStates: Array<{
     *     dataType: string,
     *     subContentId: string,
     *     userState: any,
     *     preload: boolean,
     *     invalidate: boolean
     *   }>,
     *   finishedData: Array<{
     *     score: number,
     *     maxScore: number,
     *     openedTimestamp: number,
     *     finishedTimestamp: number,
     *     completionTime: number
     *   }> | null
     * }
     */
    router.get('/results/:contentId/:userId', async (req, res) => {
        try {
            const { contentId, userId } = req.params;
            const contextId = typeof req.query.contextId === 'string'
                ? req.query.contextId
                : undefined;

            if (!contentId || !userId) {
                return res.status(400).json({
                    error: 'Missing required parameters',
                    message: 'Both contentId and userId are required'
                });
            }

            // Get user states for the content
            let userStates: H5P.IContentUserData[] = [];
            try {
                const states = await storage.getContentUserDataByContentIdAndUser(
                    contentId,
                    userId,
                    contextId
                );
                userStates = states || [];
            } catch (error) {
                // Storage might not have this method or data doesn't exist
                userStates = [];
            }

            // Get finished/completion data
            let finishedData: H5P.IFinishedUserData[] | null = null;
            try {
                const allFinished = await storage.getFinishedDataByContentId(contentId);
                if (allFinished) {
                    finishedData = allFinished.filter(f => f.userId === userId);
                }
            } catch (error) {
                // Finished data might not exist
                finishedData = null;
            }

            // Parse userState JSON strings
            const parsedUserStates = userStates.map(state => ({
                dataType: state.dataType,
                subContentId: state.subContentId,
                userState: typeof state.userState === 'string'
                    ? JSON.parse(state.userState)
                    : state.userState,
                preload: state.preload,
                invalidate: state.invalidate
            }));

            res.status(200).json({
                contentId,
                userId,
                contextId: contextId || null,
                userStates: parsedUserStates,
                finishedData
            });
        } catch (error: any) {
            console.error('Error fetching user results:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });

    /**
     * GET /api/public/state/:contentId/:userId/:dataType/:subContentId
     *
     * Returns specific user state for content interaction.
     *
     * @param contentId - H5P content identifier
     * @param userId - User identifier
     * @param dataType - State data type (usually 'state')
     * @param subContentId - Sub-content identifier (usually '0' for main content)
     * @query contextId - Optional context identifier
     */
    router.get('/state/:contentId/:userId/:dataType/:subContentId', async (req, res) => {
        try {
            const { contentId, userId, dataType, subContentId } = req.params;
            const contextId = typeof req.query.contextId === 'string'
                ? req.query.contextId
                : undefined;

            if (!contentId || !userId || !dataType || !subContentId) {
                return res.status(400).json({
                    error: 'Missing required parameters',
                    message: 'contentId, userId, dataType, and subContentId are required'
                });
            }

            let state: H5P.IContentUserData | undefined;
            try {
                state = await storage.getContentUserData(
                    contentId,
                    dataType,
                    subContentId,
                    userId,
                    contextId
                );
            } catch (error) {
                state = undefined;
            }

            if (!state) {
                return res.status(404).json({
                    error: 'Not found',
                    message: 'User state not found for the specified parameters'
                });
            }

            res.status(200).json({
                contentId,
                userId,
                dataType,
                subContentId,
                contextId: contextId || null,
                userState: typeof state.userState === 'string'
                    ? JSON.parse(state.userState)
                    : state.userState,
                preload: state.preload,
                invalidate: state.invalidate
            });
        } catch (error: any) {
            console.error('Error fetching user state:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });

    /**
     * GET /api/public/storage
     *
     * Returns storage usage statistics for H5P content.
     * Useful for monitoring disk usage and capacity planning.
     *
     * @query detailed - Set to 'true' to include per-content breakdown
     *
     * @returns {
     *   content: { size: number, humanReadable: string },
     *   libraries: { size: number, humanReadable: string },
     *   userData: { size: number, humanReadable: string },
     *   temporaryStorage: { size: number, humanReadable: string },
     *   total: { size: number, humanReadable: string },
     *   contentItems?: Array<{ contentId: string, size: number, humanReadable: string }>
     * }
     */
    router.get('/storage', async (req, res) => {
        try {
            const detailed = req.query.detailed === 'true';

            const stats = detailed
                ? await getDetailedStorageStats()
                : await getStorageStats();

            res.status(200).json(stats);
        } catch (error: any) {
            console.error('Error fetching storage stats:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });

    return router;
}