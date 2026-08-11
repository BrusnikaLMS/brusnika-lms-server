import type { Request, Response } from 'express';
import type { IHealthResponse, ILoginResponse, IErrorResponse } from '../types';
import { ERROR_MESSAGES } from '../constants';
import { HttpStatus, sendBadRequest } from '../utils/index';

interface SessionRequest extends Request {
    session: Request['session'] & { userId?: string; language?: string };
    csrfToken: () => string;
}

const DEFAULT_LANGUAGE = 'en';

/**
 * Login endpoint - creates session and returns CSRF token.
 *
 * @route POST /login
 * @param req.body.userId - User identifier (required)
 * @param req.body.language - Preferred language for H5P content (optional)
 * @returns {ILoginResponse} Session created with CSRF token
 */
export function loginHandler(req: SessionRequest, res: Response): void {
    const { userId, language } = req.body as { userId?: string; language?: string };

    if (!userId) {
        sendBadRequest(res, ERROR_MESSAGES.USER_ID_REQUIRED);
        return;
    }

    req.session.userId = userId;
    req.session.language = language || DEFAULT_LANGUAGE;

    const response: ILoginResponse = {
        success: true,
        userId,
        csrfToken: req.csrfToken(),
    };

    res.json(response);
}

/**
 * Update language in session.
 *
 * @route POST /language
 * @param req.body.language - New language code
 * @returns {{ success: boolean, language: string }} Updated language
 */
export function setLanguageHandler(req: SessionRequest, res: Response): void {
    const { language } = req.body as { language?: string };

    if (!language) {
        sendBadRequest(res, 'Language is required');
        return;
    }

    req.session.language = language;
    res.json({ success: true, language });
}

/**
 * Logout endpoint - destroys session.
 *
 * @route POST /logout
 * @returns {{ success: boolean }} Logout confirmation
 */
export function logoutHandler(req: Request, res: Response): void {
    req.session.destroy((err) => {
        if (err) {
            console.error('[Auth] Logout error:', err);
            const response: IErrorResponse = {
                error: 'Internal Server Error',
                message: ERROR_MESSAGES.LOGOUT_FAILED,
            };
            res.status(HttpStatus.INTERNAL_ERROR).json(response);
            return;
        }
        res.json({ success: true });
    });
}

/**
 * Health check endpoint.
 *
 * @route GET /health
 * @returns {IHealthResponse} Server status information
 */
export function healthHandler(_req: Request, res: Response): void {
    const response: IHealthResponse = {
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime(),
    };

    res.status(HttpStatus.OK).json(response);
}