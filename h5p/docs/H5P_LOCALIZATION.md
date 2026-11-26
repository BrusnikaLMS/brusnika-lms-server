# H5P Content Type Localization

## Проблема

H5P Editor показывал названия контент-типов (Interactive Video, Multiple Choice и т.д.) на английском языке, даже когда интерфейс был переведён на другой язык.

## Решение

### 1. Исправлен путь к переводам i18n

**Файл:** `src/config/i18n.ts`

Проблема: путь `../../../node_modules/...` был неверным для ts-node (который запускает код из `src/config/`).

```typescript
// Было (неверно):
loadPath: path.join(__dirname, '../../../node_modules/@lumieducation/h5p-server/build/assets/translations/{{ns}}/{{lng}}.json')

// Стало (верно):
loadPath: path.join(__dirname, '../../node_modules/@lumieducation/h5p-server/build/assets/translations/{{ns}}/{{lng}}.json')
```

### 2. Добавлен middleware для инъекции языка

**Файл:** `src/middleware/index.ts`

H5P клиентский JavaScript делает AJAX запросы напрямую к серверу, минуя frontend axios interceptors. Middleware `h5pLanguageMiddleware` инжектит язык из сессии в query параметры H5P AJAX запросов.

```typescript
export function h5pLanguageMiddleware(
    req: express.Request & { language?: string; session?: { language?: string } },
    res: express.Response,
    next: express.NextFunction
): void {
    if (req.path === '/h5p/ajax' && !req.query.language) {
        const sessionLanguage = (req.session as any)?.language;
        const i18nextLanguage = req.language;
        const language = sessionLanguage || i18nextLanguage || DEFAULT_LANGUAGE;

        // Express 5: req.query is read-only, override with defineProperty
        Object.defineProperty(req, 'query', {
            value: { ...req.query, language },
            writable: true,
            configurable: true
        });
    }
    next();
}
```

**Важно:** В Express 5 `req.query` read-only, поэтому используется `Object.defineProperty`.

### 3. Сохранение языка в сессии при логине

**Файл:** `src/routes/auth.ts`

```typescript
export function loginHandler(req: SessionRequest, res: Response): void {
    const { userId, language } = req.body;

    req.session.userId = userId;
    req.session.language = language || DEFAULT_LANGUAGE;

    // ...
}
```

### 4. Endpoint для смены языка (опционально)

**Файл:** `src/routes/auth.ts`

```typescript
export function setLanguageHandler(req: SessionRequest, res: Response): void {
    const { language } = req.body;
    req.session.language = language;
    res.json({ success: true, language });
}
```

**Маршрут:** `POST /language`

### 5. Поддерживаемые языки

**Файл:** `src/constants.ts`

```typescript
export const SUPPORTED_LANGUAGES = [
    'en', 'ru', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'uk',
    'bg', 'bs', 'ca', 'cs', 'el', 'et', 'eu', 'fi', 'gl', 'ja',
    'km', 'ko', 'nb', 'nn', 'sl', 'sv', 'tr', 'zh'
] as const;
```

## Порядок middleware в index.ts

```typescript
// 1. Public endpoints (before session)
configurePublicEndpoints(server, h5pEditor);

// 2. Session setup
configureSession(server);

// 3. Auth endpoints
configureAuthEndpoints(server, csrfTokenGenerator);

// 4. Auth middleware
server.use(authMiddleware);

// 5. Language update endpoint
server.post('/language', setLanguageHandler);

// 6. i18next middleware
configureI18next(server, i18nextInstance);

// 7. Language injection (must be after i18next)
server.use(h5pLanguageMiddleware);

// 8. H5P routes
configureH5PRoutes(server, h5pEditor, h5pPlayer, csrfProtection);
```

## Как работает локализация

1. **Frontend** вызывает `POST /login` с `{ userId, language: 'ru' }`
2. **Сервер** сохраняет язык в сессии: `req.session.language = 'ru'`
3. **H5P Editor** делает AJAX запрос `GET /h5p/ajax?action=content-type-cache`
4. **h5pLanguageMiddleware** добавляет `language=ru` в query
5. **H5PAjaxExpressController** передаёт язык в `h5pEditor.getContentTypeCache(user, 'ru')`
6. **ContentTypeInformationRepository** локализует названия через `translationCallback`
7. Переводы загружаются из `node_modules/@lumieducation/h5p-server/build/assets/translations/hub/ru.json`

## Frontend интеграция

### vue-example

**Файл:** `src/api/auth.ts`

```typescript
export const authApi = {
  login: async (userId: string): Promise<ILoginResponse> => {
    const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || DEFAULT_LANGUAGE;
    const response = await apiClient.post<ILoginResponse>('/login', { userId, language });
    return response.data;
  },

  setLanguage: async (language: string) => {
    const response = await apiClient.post('/language', { language });
    return response.data;
  }
};
```

**Файл:** `src/composables/useLanguage.ts`

```typescript
export const AVAILABLE_LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  // ... ещё 18 языков
] as const;
```

### brusnika.lms.front2.0

**Файл:** `src/shared/api/requests/h5p/index.ts`

Язык передаётся при логине из iframe data:

```typescript
login: async (userId: string) => {
  let language = 'ru';
  try {
    const { lang_id } = getIframeData();
    if (lang_id) language = lang_id;
  } catch {}

  return h5pInstance.post('/login', { userId, language });
}
```

## Отладка

Для включения debug логов i18next:

```bash
DEBUG=i18n npm run start
```

Проверка загрузки переводов:

```typescript
const testResult = i18next.t('hub:H5P_Accordion.title', { lng: 'ru' });
console.log('Translation:', testResult); // "Аккордеон (Accordion)"
```

## Структура файлов переводов

```
node_modules/@lumieducation/h5p-server/build/assets/translations/
├── hub/
│   ├── en.json  (нет - английский по умолчанию)
│   ├── ru.json  (49KB)
│   ├── de.json  (30KB)
│   └── ...
├── client/
├── server/
└── ...
```

Формат `hub/ru.json`:

```json
{
  "H5P_Accordion": {
    "title": "Аккордеон (Accordion)",
    "summary": "Создание вертикально расположенных раскрывающихся элементов",
    "description": "..."
  },
  "H5P_InteractiveVideo": {
    "title": "Интерактивное видео (Interactive Video)",
    ...
  }
}
```