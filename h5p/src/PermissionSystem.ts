import {
    type IPermissionSystem,
    GeneralPermission,
    type TemporaryFilePermission,
    type ContentPermission,
    type UserDataPermission
} from '@lumieducation/h5p-server';

import type LMSUser from './LMSUser';

/**
 * Simple permission system where all authenticated users have full access.
 *
 * This implementation grants permissions based solely on authentication status.
 * More granular permission checks should be handled on the client side or
 * in a separate authorization layer.
 *
 * @implements {IPermissionSystem<LMSUser>}
 */
export default class PermissionSystem implements IPermissionSystem<LMSUser> {
    /**
     * Checks if user is authenticated
     */
    private isAuthenticated(user: LMSUser | undefined): boolean {
        return user !== undefined && user.id !== undefined;
    }

    /**
     * Checks permission for user data operations (view, edit states)
     */
    async checkForUserData(
        actingUser: LMSUser,
        _permission: UserDataPermission,
        _contentId: string,
        _affectedUserId?: string
    ): Promise<boolean> {
        return this.isAuthenticated(actingUser);
    }

    /**
     * Checks permission for content operations (create, edit, delete, view)
     */
    async checkForContent(
        actingUser: LMSUser | undefined,
        _permission: ContentPermission,
        _contentId?: string
    ): Promise<boolean> {
        return this.isAuthenticated(actingUser);
    }

    /**
     * Checks permission for temporary file operations
     */
    async checkForTemporaryFile(
        user: LMSUser | undefined,
        _permission: TemporaryFilePermission,
        _filename?: string
    ): Promise<boolean> {
        return this.isAuthenticated(user);
    }

    /**
     * Checks permission for general actions.
     *
     * Note: InstallRecommended and UpdateAndInstallLibraries are allowed
     * for all users (including anonymous) to enable H5P Hub functionality.
     */
    async checkForGeneralAction(
        actingUser: LMSUser | undefined,
        permission: GeneralPermission
    ): Promise<boolean> {
        // Allow library operations for all users (needed for H5P Hub)
        if (
            permission === GeneralPermission.InstallRecommended ||
            permission === GeneralPermission.UpdateAndInstallLibraries
        ) {
            return true;
        }
        return this.isAuthenticated(actingUser);
    }
}