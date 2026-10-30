import type { Response } from 'express';
import type { IErrorResponse } from '../types';
import { ERROR_MESSAGES } from '../constants';

/**
 * HTTP status codes
 */
export const HttpStatus = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
} as const;

/**
 * Sends a JSON error response
 */
export function sendError(
    res: Response,
    status: number,
    error: string,
    message: string
): void {
    const response: IErrorResponse = { error, message };
    res.status(status).json(response);
}

/**
 * Sends a 400 Bad Request error
 */
export function sendBadRequest(res: Response, message: string): void {
    sendError(res, HttpStatus.BAD_REQUEST, 'Bad Request', message);
}

/**
 * Sends a 401 Unauthorized error
 */
export function sendUnauthorized(res: Response): void {
    sendError(
        res,
        HttpStatus.UNAUTHORIZED,
        'Unauthorized',
        ERROR_MESSAGES.UNAUTHORIZED
    );
}

/**
 * Sends a 404 Not Found error
 */
export function sendNotFound(res: Response, message: string): void {
    sendError(res, HttpStatus.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND, message);
}

/**
 * Sends a 500 Internal Server Error
 */
export function sendInternalError(res: Response, error: Error): void {
    console.error('Internal server error:', error);
    sendError(
        res,
        HttpStatus.INTERNAL_ERROR,
        ERROR_MESSAGES.INTERNAL_ERROR,
        error.message
    );
}

/**
 * Wraps an async route handler with error handling
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
    fn: T
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args);
        } catch (error) {
            const res = args[1] as Response;
            sendInternalError(res, error as Error);
        }
    }) as T;
}