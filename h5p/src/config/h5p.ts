import path from 'path';
import * as H5P from '@lumieducation/h5p-server';
import createH5PEditor from '../createH5PEditor';
import PermissionSystem from '../PermissionSystem';

/**
 * Initialize H5P configuration
 */
export async function initializeH5PConfig() {
    return await new H5P.H5PConfig(
        new H5P.fsImplementations.JsonStorage(path.resolve('config.json'))
    ).load();
}

/**
 * Create URL generator with CSRF protection
 */
export function createUrlGenerator(config: H5P.IH5PConfig) {
    return new H5P.UrlGenerator(config, {
        queryParamGenerator: (user) => {
            if ((user as any).csrfToken) {
                return {
                    name: '_csrf',
                    value: (user as any).csrfToken()
                };
            }
            return { name: '', value: '' };
        },
        protectAjax: true,
        protectContentUserData: true,
        protectSetFinished: true
    });
}

/**
 * Initialize H5P Editor and Player
 */
export async function initializeH5P(
    config: H5P.IH5PConfig,
    urlGenerator: H5P.IUrlGenerator,
    translationCallback: H5P.ITranslationFunction
) {
    const permissionSystem = new PermissionSystem();

    const h5pEditor = await createH5PEditor(
        config,
        urlGenerator,
        permissionSystem,
        path.resolve('h5p/libraries'),
        path.resolve('h5p/content'),
        path.resolve('h5p/temporary-storage'),
        path.resolve('h5p/user-data'),
        translationCallback
    );

    h5pEditor.setRenderer((model) => model);

    const h5pPlayer = new H5P.H5PPlayer(
        h5pEditor.libraryStorage,
        h5pEditor.contentStorage,
        config,
        undefined,
        urlGenerator,
        undefined,
        { permissionSystem },
        h5pEditor.contentUserDataStorage
    );

    h5pPlayer.setRenderer((model) => model);

    return { h5pEditor, h5pPlayer };
}

