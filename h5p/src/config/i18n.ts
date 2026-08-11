import i18next, { i18n } from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';
import i18nextHttpMiddleware from 'i18next-http-middleware';
import path from 'path';
import { I18N_NAMESPACES, SUPPORTED_LANGUAGES } from '../constants';

/**
 * Initialize i18next for H5P translations
 */
export async function initializeI18n(): Promise<i18n> {
    const instance = i18next.createInstance();

    const translationsPath = path.join(
        __dirname,
        '../../node_modules/@lumieducation/h5p-server/build/assets/translations/{{ns}}/{{lng}}.json'
    );

    await instance
        .use(i18nextFsBackend)
        .use(i18nextHttpMiddleware.LanguageDetector)
        .init({
            backend: { loadPath: translationsPath },
            debug: process.env.DEBUG?.includes('i18n'),
            defaultNS: 'server',
            fallbackLng: 'en',
            ns: [...I18N_NAMESPACES],
            preload: [...SUPPORTED_LANGUAGES]
        });

    return instance;
}