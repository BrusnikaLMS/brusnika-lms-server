# cforj-embed

Встраиваемый конструктор курсов для LMS. Работает в iframe — LMS передаёт данные курса через postMessage, редактор возвращает изменения обратно.

Никаких дашбордов, авторизации, баз данных. Контент хранится в LMS.

## Архитектура

```
cforj-embed/
  apps/
    studio/             — React-редактор курсов (Vite + React + Tailwind)
  packages/
    player/             — Runtime-плеер курса (рендер экранов, компонентов)
    scorm-export/       — Генератор SCORM-пакетов
  apps/api/             — FastAPI backend (AI генерация, загрузка файлов)
```

## Два виджета (как H5P)

| Виджет | URL | Назначение |
|--------|-----|-----------|
| **Редактор** | `/editor` (или `/`) | Конструктор курсов — автор создаёт/редактирует контент |
| **Плеер** | `/player` | Проигрыватель курса — обучающийся проходит курс |

Работает как H5P: LMS встраивает нужный виджет через iframe и общается через postMessage.

## Как работает интеграция

### Редактор (создание курса)
1. LMS встраивает `/editor` через iframe
2. Редактор отправляет `CS_READY` — готов принимать данные
3. LMS передаёт курс через `CS_LOAD_COURSE` (или редактор создаёт новый)
4. При каждом изменении редактор отправляет `CS_COURSE_CHANGED` обратно в LMS
5. LMS сохраняет данные курса (JSON) в свою БД

### Плеер (прохождение курса)
1. LMS встраивает `/player` через iframe
2. Плеер отправляет `CS_PLAYER_READY` — готов принимать данные
3. LMS передаёт курс через `CS_LOAD_PLAYER`
4. Обучающийся проходит курс
5. Плеер отправляет `CS_PROGRESS` и `CS_COMPLETE` в LMS

## Тестовый полигон

Файл `test-playground.html` — готовая страница для тестирования интеграции.
Открывает iframe с редактором/плеером, показывает лог postMessage, позволяет отправлять тестовые данные.

```bash
# Запустите cforj-embed
pnpm dev

# Откройте test-playground.html в браузере
# (просто двойной клик по файлу или через Live Server)
```

## PostMessage API

### LMS → Редактор

```js
// Загрузить курс в редактор
iframe.contentWindow.postMessage({
  type: 'CS_LOAD_COURSE',
  course: {
    id: 'course-123',
    version: '1.0',
    title: 'My Course',
    screens: [...],
    settings: { allowNavigation: 'linear', showResults: true },
    state: {}
  }
}, '*')

// Настроить язык и тему
iframe.contentWindow.postMessage({
  type: 'CS_SET_CONFIG',
  config: { locale: 'ru', theme: 'dark' }
}, '*')
```

### LMS → Плеер

```js
// Загрузить курс для прохождения
playerIframe.contentWindow.postMessage({
  type: 'CS_LOAD_PLAYER',
  course: courseJsonFromDatabase
}, '*')
```

### Редактор → LMS

```js
window.addEventListener('message', (e) => {
  if (e.data.type === 'CS_READY') {
    // Редактор загружен — можно отправлять CS_LOAD_COURSE
  }

  if (e.data.type === 'CS_COURSE_CHANGED') {
    // e.data.course — полный JSON курса, сохраняем в БД LMS
    saveCourseToLMS(e.data.course)
  }
})
```

### Плеер → LMS

```js
window.addEventListener('message', (e) => {
  if (e.data.type === 'CS_PLAYER_READY') {
    // Плеер загружен — отправляем курс
    playerIframe.contentWindow.postMessage({
      type: 'CS_LOAD_PLAYER',
      course: loadCourseFromDB()
    }, '*')
  }

  if (e.data.type === 'CS_PROGRESS') {
    // e.data.progress — прогресс прохождения
  }

  if (e.data.type === 'CS_COMPLETE') {
    // e.data.score — итоговый балл, отмечаем завершение в LMS
  }
})
```

## Формат курса (CourseApp)

```json
{
  "id": "course-123",
  "version": "1.0",
  "title": "Название курса",
  "description": "Описание",
  "language": "ru",
  "settings": {
    "allowNavigation": "linear",
    "showResults": true
  },
  "state": {},
  "screens": [
    {
      "id": "s-1",
      "title": "Screen 1",
      "components": [
        { "id": "c-1", "type": "text", "html": "<p>Hello</p>" },
        { "id": "c-2", "type": "quiz-single", "question": "...", "options": [...], "correct": 0 }
      ],
      "events": [],
      "navigation": {}
    }
  ]
}
```

### Типы компонентов

| Тип | Описание |
|-----|----------|
| `text` | Rich text (HTML) |
| `image` | Изображение |
| `video` | Видео (файл, YouTube, Rutube) |
| `button` | Кнопка с действием |
| `quiz-single` | Тест с одним правильным ответом |
| `quiz-multi` | Тест с несколькими правильными |
| `true-false` | Верно / Неверно |
| `flashcards` | Флеш-карточки |
| `branching` | Ветвящийся сценарий |
| `drag-drop` | Перетаскивание |
| `hotspots` | Интерактивные точки на изображении |
| `dialog-trainer` | Диалоговый тренажёр |
| `screen-simulation` | Симуляция экрана |

## Локальная разработка

```bash
pnpm install
pnpm dev
```

Редактор запустится на `http://localhost:3001`

## Сборка

```bash
pnpm build
```

Собранные файлы: `apps/studio/dist/`

## Docker

```bash
docker compose up -d --build
```

Сервисы:
- `studio` — фронтенд (порт 3001)
- `api` — бэкенд для AI и загрузки файлов (порт 8000)

## ENV-переменные

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `VITE_API_URL` | URL API для AI и uploads | `/api` |
| `DEEPSEEK_API_KEY` | API-ключ для AI генерации | — |

## Встраивание в LMS — минимальный пример

### Редактор (для автора курса)

```html
<iframe id="editor" src="https://<CFORJ_DOMAIN>/editor" style="width:100%;height:100vh;border:none;" allow="clipboard-write"></iframe>

<script>
const editor = document.getElementById('editor')

window.addEventListener('message', (e) => {
  if (e.origin !== 'https://<CFORJ_DOMAIN>') return

  if (e.data.type === 'CS_READY') {
    // Редактор готов — загружаем курс из БД LMS
    const course = loadCourseFromDB()
    if (course) {
      editor.contentWindow.postMessage({ type: 'CS_LOAD_COURSE', course }, '*')
    }
  }

  if (e.data.type === 'CS_COURSE_CHANGED') {
    // Автосохранение в БД LMS
    saveCourseToDatabase(e.data.course)
  }
})
</script>
```

### Плеер (для обучающегося)

```html
<iframe id="player" src="https://<CFORJ_DOMAIN>/player" style="width:100%;height:600px;border:none;"></iframe>

<script>
const player = document.getElementById('player')

window.addEventListener('message', (e) => {
  if (e.origin !== 'https://<CFORJ_DOMAIN>') return

  if (e.data.type === 'CS_PLAYER_READY') {
    // Плеер готов — загружаем курс
    const course = loadCourseFromDB()
    player.contentWindow.postMessage({ type: 'CS_LOAD_PLAYER', course }, '*')
  }

  if (e.data.type === 'CS_PROGRESS') {
    updateProgressInLMS(e.data.progress)
  }

  if (e.data.type === 'CS_COMPLETE') {
    markCourseCompleted(e.data.score)
  }
})
</script>
```
