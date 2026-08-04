# Brusnika LMS H5P Server

REST API сервер для работы с H5P интерактивным контентом.

---

## API Quick Reference

### System Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | [`/health`](#get-health) | - | Health check |
| `POST` | [`/login`](#post-login) | - | Авторизация, получение CSRF токена |
| `POST` | [`/logout`](#post-logout) | - | Завершение сессии |

### H5P Content API (требует авторизации + CSRF)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | [`/h5p`](#get-h5p) | Список всего контента |
| `POST` | [`/h5p`](#post-h5p) | Создание контента |
| `GET` | [`/h5p/:contentId/play`](#get-h5pcontentidplay) | Рендер контента для просмотра |
| `GET` | [`/h5p/:contentId/edit`](#get-h5pcontentidedit) | Получение данных для редактора |
| `PATCH` | [`/h5p/:contentId`](#patch-h5pcontentid) | Обновление контента |
| `DELETE` | [`/h5p/:contentId`](#delete-h5pcontentid) | Удаление контента |

### Public API (без авторизации, backend-to-backend)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | [`/api/public/storage`](#get-apipublicstorage) | Статистика использования хранилища |
| `GET` | [`/api/public/results/:contentId/:userId`](#get-apipublicresultscontentiduserid) | Результаты пользователя для контента |
| `GET` | [`/api/public/results/content/:contentId`](#get-apipublicresultscontentcontentid) | Все результаты контента |
| `GET` | [`/api/public/results/user/:userId`](#get-apipublicresultsuseruserid) | Все результаты пользователя |
| `GET` | [`/api/public/state/:contentId/:userId/:dataType/:subContentId`](#get-apipublicstatecontentiduseriddatatypesubcontentid) | Состояние интерактива |

### Content Type Cache
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | [`/h5p/content-type-cache`](#post-h5pcontent-type-cache) | - | Список доступных H5P библиотек |

---

## Data Types

### IFinishedUserData (результат прохождения)
```typescript
{
  contentId: string         // ID контента
  userId: string            // ID пользователя
  score: string             // Набранные баллы (строка)
  maxScore: string          // Максимум баллов (строка)
  openedTimestamp: string   // Unix seconds - время открытия (строка)
  finishedTimestamp: string // Unix seconds - время завершения (строка)
}
```

### IContentUserData (состояние пользователя)
```typescript
{
  dataType: string       // Тип данных ('state')
  subContentId: string   // ID под-контента ('0' для основного)
  userState: object      // JSON состояния интерактива
  preload: boolean       // Предзагрузка при старте
  invalidate: boolean    // Сброс при обновлении контента
}
```

### H5P Content Metadata
```typescript
{
  contentId: string      // ID контента
  title: string          // Название
  mainLibrary: string    // H5P библиотека (например "H5P.InteractiveVideo 1.24")
}
```

---

## Endpoints Documentation

### GET /health

Health check сервера.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": 1703443200000,
  "uptime": 3600.5
}
```

---

### POST /login

Авторизация пользователя и получение CSRF токена.

**Request Body:**
```json
{
  "userId": "user-123"
}
```

**Response 200:**
```json
{
  "success": true,
  "userId": "user-123",
  "csrfToken": "abc123-xyz789..."
}
```

**Response 400:**
```json
{
  "error": "Bad Request",
  "message": "userId is required"
}
```

---

### POST /logout

Завершение сессии пользователя.

**Response 200:**
```json
{
  "success": true
}
```

**Response 500:**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to logout"
}
```

---

### GET /h5p

Получение списка всего H5P контента.

**Headers:**
```
Cookie: h5p.sid=...
CSRF-Token: <token>
```

**Response 200:**
```json
[
  {
    "contentId": "1234567890",
    "title": "Interactive Video - Introduction",
    "mainLibrary": "H5P.InteractiveVideo 1.24"
  },
  {
    "contentId": "0987654321",
    "title": "Quiz - Module 1",
    "mainLibrary": "H5P.QuestionSet 1.20"
  }
]
```

**Response 401:**
```json
{
  "error": "Unauthorized",
  "message": "Not logged in. Please call /login first."
}
```

---

### POST /h5p

Создание нового H5P контента.

**Headers:**
```
Cookie: h5p.sid=...
CSRF-Token: <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "library": "H5P.InteractiveVideo 1.24",
  "params": {
    "params": {
      "interactiveVideo": {
        "video": {
          "startScreenOptions": {},
          "textTracks": {}
        }
      }
    },
    "metadata": {
      "title": "My Interactive Video",
      "license": "U",
      "authors": [],
      "changes": []
    }
  }
}
```

**Response 200:**
```json
{
  "contentId": "1234567890",
  "metadata": {
    "title": "My Interactive Video",
    "mainLibrary": "H5P.InteractiveVideo 1.24",
    "license": "U"
  }
}
```

**Response 400:**
```
Malformed request
```

---

### GET /h5p/:contentId/play

Рендер H5P контента для просмотра пользователем.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `contentId` | string | ID H5P контента |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contextId` | string | No | Контекст для множественных состояний |
| `asUserId` | string | No | Просмотр от имени другого пользователя |
| `readOnlyState` | "yes" | No | Только чтение (без сохранения состояния) |

**Headers:**
```
Cookie: h5p.sid=...
CSRF-Token: <token>
```

**Example:**
```
GET /h5p/1234567890/play?contextId=lesson-456&asUserId=student-789&readOnlyState=yes
```

**Response 200:**
```html
<!-- HTML-rendered H5P content with embedded scripts and styles -->
```

---

### GET /h5p/:contentId/edit

Получение данных контента для H5P редактора.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `contentId` | string | ID контента (или `undefined` для нового) |

**Headers:**
```
Cookie: h5p.sid=...
CSRF-Token: <token>
```

**Response 200 (существующий контент):**
```typescript
{
  scripts: string[],              // URLs скриптов H5P
  styles: string[],               // URLs стилей H5P
  integration: object,            // H5P integration settings
  library: "H5P.InteractiveVideo 1.24",
  metadata: {
    title: "My Video",
    license: "U"
  },
  params: object                  // Параметры контента
}
```

**Response 200 (новый контент, contentId=undefined):**
```typescript
{
  scripts: string[],              // URLs скриптов H5P
  styles: string[],               // URLs стилей H5P
  integration: object             // H5P integration settings
}
```

---

### PATCH /h5p/:contentId

Обновление существующего H5P контента.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `contentId` | string | ID контента для обновления |

**Headers:**
```
Cookie: h5p.sid=...
CSRF-Token: <token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  library: "H5P.InteractiveVideo 1.24",
  params: {
    params: object,        // Параметры контента
    metadata: {
      title: "Updated Title",
      license: "U"
    }
  }
}
```

**Response 200:**
```json
{
  "contentId": "1234567890",
  "metadata": {
    "title": "Updated Title",
    "mainLibrary": "H5P.InteractiveVideo 1.24"
  }
}
```

---

### DELETE /h5p/:contentId

Удаление H5P контента.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `contentId` | string | ID контента для удаления |

**Headers:**
```
Cookie: h5p.sid=...
CSRF-Token: <token>
```

**Response 200:**
```
Content 1234567890 successfully deleted.
```

**Response 500:**
```
Error deleting content with id 1234567890: [error message]
```

---

### POST /h5p/content-type-cache

Получение списка доступных H5P библиотек (без ограничений).

**Response 200:**
```json
[
  {
    "id": "H5P.InteractiveVideo",
    "version": { "major": 1, "minor": 24 },
    "title": "Interactive Video",
    "summary": "Create videos enriched with interactions",
    "restricted": false,
    "canInstall": true
  }
]
```

---

## Public API (без авторизации)

> **Внимание:** Эти эндпоинты предназначены для backend-to-backend коммуникации.
> Обеспечьте сетевую безопасность (firewall, внутренняя сеть).

### GET /api/public/storage

Статистика использования хранилища H5P. Для мониторинга дискового пространства.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `detailed` | "true" | No | Включить разбивку по каждому контенту |

**Response 200 (базовый):**
```json
{
  "content": {
    "size": 15728640,
    "humanReadable": "15 MB"
  },
  "libraries": {
    "size": 52428800,
    "humanReadable": "50 MB"
  },
  "userData": {
    "size": 1048576,
    "humanReadable": "1 MB"
  },
  "temporaryStorage": {
    "size": 0,
    "humanReadable": "0 B"
  },
  "total": {
    "size": 69206016,
    "humanReadable": "66 MB"
  }
}
```

**Response 200 (с `?detailed=true`):**
```json
{
  "content": {
    "size": 15728640,
    "humanReadable": "15 MB"
  },
  "libraries": {
    "size": 52428800,
    "humanReadable": "50 MB"
  },
  "userData": {
    "size": 1048576,
    "humanReadable": "1 MB"
  },
  "temporaryStorage": {
    "size": 0,
    "humanReadable": "0 B"
  },
  "total": {
    "size": 69206016,
    "humanReadable": "66 MB"
  },
  "contentItems": [
    {
      "contentId": "1550637121",
      "size": 10485760,
      "humanReadable": "10 MB"
    },
    {
      "contentId": "9876543210",
      "size": 5242880,
      "humanReadable": "5 MB"
    }
  ]
}
```

---

### GET /api/public/results/:contentId/:userId

Результаты прохождения конкретного контента пользователем.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `contentId` | string | ID H5P контента |
| `userId` | string | ID пользователя |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contextId` | string | No | Контекст состояния |

**Response 200:**
```json
{
  "contentId": "1550637121",
  "userId": "user1",
  "contextId": null,
  "userStates": [
    {
      "dataType": "state",
      "subContentId": "0",
      "userState": {
        "answers": [1]
      },
      "preload": true,
      "invalidate": true
    }
  ],
  "finishedData": [
    {
      "contentId": "1550637121",
      "userId": "user1",
      "score": "0",
      "maxScore": "1",
      "openedTimestamp": "1766576776",
      "finishedTimestamp": "1766576777"
    }
  ]
}
```

**Response 400:**
```json
{
  "error": "Missing required parameters",
  "message": "Both contentId and userId are required"
}
```

---

### GET /api/public/results/content/:contentId

Все результаты для контента (все пользователи). Для аналитики.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `contentId` | string | ID H5P контента |

**Response 200:**
```json
{
  "contentId": "1550637121",
  "totalResults": 2,
  "results": [
    {
      "contentId": "1550637121",
      "userId": "user1",
      "score": "0",
      "maxScore": "1",
      "openedTimestamp": "1766576776",
      "finishedTimestamp": "1766576777"
    },
    {
      "contentId": "1550637121",
      "userId": "user2",
      "score": "1",
      "maxScore": "1",
      "openedTimestamp": "1766577000",
      "finishedTimestamp": "1766577100"
    }
  ]
}
```

---

### GET /api/public/results/user/:userId

Все результаты пользователя (весь контент). Для профиля и GDPR.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | ID пользователя |

**Response 200:**
```json
{
  "userId": "user1",
  "totalResults": 2,
  "results": [
    {
      "contentId": "1550637121",
      "userId": "user1",
      "score": "0",
      "maxScore": "1",
      "openedTimestamp": "1766576776",
      "finishedTimestamp": "1766576777"
    },
    {
      "contentId": "9876543210",
      "userId": "user1",
      "score": "5",
      "maxScore": "10",
      "openedTimestamp": "1766580000",
      "finishedTimestamp": "1766580500"
    }
  ]
}
```

---

### GET /api/public/state/:contentId/:userId/:dataType/:subContentId

Конкретное состояние интерактива.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `contentId` | string | ID контента |
| `userId` | string | ID пользователя |
| `dataType` | string | Тип данных (обычно `state`) |
| `subContentId` | string | ID под-контента (`0` для основного) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contextId` | string | No | Контекст состояния |

**Response 200:**
```json
{
  "contentId": "1234567890",
  "userId": "user-123",
  "dataType": "state",
  "subContentId": "0",
  "contextId": null,
  "userState": {
    "progress": 75,
    "currentTime": 120.5,
    "answers": [1, 3, 2]
  },
  "preload": true,
  "invalidate": false
}
```

**Response 404:**
```json
{
  "error": "Not found",
  "message": "User state not found for the specified parameters"
}
```

---

## Installation & Configuration

### Установка

```bash
npm install
npm run build
```

### Переменные окружения (.env)

```env
PORT=8088
SESSION_SECRET=your-secret-key-change-in-production
NODE_ENV=production
TRUST_PROXY=1
COOKIE_DOMAIN=.your-domain.com
```

### Запуск

```bash
# Development
npm run start:watch

# Production
npm run start
```

---

## Storage

```
h5p/
├── content/           # H5P контент
├── libraries/         # H5P библиотеки
├── temporary-storage/ # Временные файлы
└── user-data/         # Результаты и состояния пользователей
```