import type { Request, Response, NextFunction } from 'express';
import type { IUser } from '@lumieducation/h5p-server';

/**
 * Express request with authenticated user
 */
export interface IRequestWithUser extends Request {
    user: IUser;
}

/**
 * Express request with file uploads
 */
export interface IRequestWithFiles extends Request {
    files?: {
        [key: string]: {
            tempFilePath?: string;
            [key: string]: unknown;
        };
    };
}

/**
 * Finished user data from H5P storage
 */
export interface IFinishedUserData {
    contentId: string;
    userId: string;
    score: string;
    maxScore: string;
    openedTimestamp: string;
    finishedTimestamp: string;
}

/**
 * User state data from H5P storage
 */
export interface IUserStateData {
    dataType: string;
    subContentId: string;
    userState: unknown;
    preload: boolean;
    invalidate: boolean;
}

/**
 * Public API response for user results
 */
export interface IPublicResultsResponse {
    contentId: string;
    userId: string;
    contextId: string | null;
    userStates: IUserStateData[];
    finishedData: IFinishedUserData[] | null;
}

/**
 * Public API response for content results
 */
export interface IContentResultsResponse {
    contentId: string;
    totalResults: number;
    results: IFinishedUserData[];
}

/**
 * Public API response for user's all results
 */
export interface IUserResultsResponse {
    userId: string;
    totalResults: number;
    results: IFinishedUserData[];
}

/**
 * Error response structure
 */
export interface IErrorResponse {
    error: string;
    message: string;
}

/**
 * Health check response
 */
export interface IHealthResponse {
    status: 'ok' | 'error';
    timestamp: number;
    uptime: number;
}

/**
 * Login response
 */
export interface ILoginResponse {
    success: boolean;
    userId: string;
    csrfToken: string;
}

/**
 * Express middleware function type
 */
export type ExpressMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => void | Promise<void>;

/**
 * Async express handler wrapper type
 */
export type AsyncHandler<T extends Request = Request> = (
    req: T,
    res: Response
) => Promise<void>;