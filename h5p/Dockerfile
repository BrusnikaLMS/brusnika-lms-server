# Многостадийная сборка для оптимизации размера образа
FROM node:20-alpine AS builder

# Установка зависимостей для сборки
RUN apk add --no-cache curl unzip bash python3

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./
COPY tsconfig*.json ./

# Установка ВСЕХ зависимостей (включая dev для сборки)
RUN npm ci && \
    npm cache clean --force

# Копирование исходного кода
COPY src ./src
COPY static ./static
COPY config.json ./
COPY download-core.sh ./

# Сборка приложения
RUN npm run build

# Загрузка H5P core и editor
RUN chmod +x download-core.sh && \
    ./download-core.sh

# Скачивание списка типов контента H5P Hub в static/ для локального обслуживания без обращения к api.h5p.org в runtime.
# api.h5p.org обрывает соединение после ~16KB — скачиваем по кускам через Range-запросы POST.
COPY fetch_content_types.py ./
RUN python3 fetch_content_types.py 2>&1 || echo '{"contentTypes":[]}' > static/content-types-hub.json

# Патч h5peditor.js: безопасный доступ к window.parent в окружении Bitrix24-iframe.
# h5peditor.js изначально рассчитан на запуск внутри iframe, где window.parent —
# страница LMS. Но LMS встроена в Bitrix24-iframe, поэтому window.parent cross-origin
# и прямой доступ бросает SecurityError. Патч оборачивает доступ в try/catch и
# мержит в существующий H5PEditor вместо замены (чтобы сохранить ns.Editor из
# h5peditor-editor.js, который грузится раньше).
RUN sed -i \
    '7s/.*/window.H5PEditor = window.H5PEditor || {}; var _pe = {}, _pi = {}; try { _pe = window.parent.H5PEditor || {}; } catch(e) {} try { _pi = window.parent.H5PIntegration || {}; } catch(e) {} window.ns = window.H5PEditor = H5P.jQuery.extend(false, window.H5PEditor, _pe);/' \
    h5p/editor/scripts/h5peditor.js && \
    sed -i \
    's/^H5PIntegration = H5P\.jQuery\.extend(false, {}, window\.parent\.H5PIntegration);/var _ei = (typeof H5PIntegration !== "undefined") ? H5PIntegration : {}; H5PIntegration = H5P.jQuery.extend(false, _ei, _pi);/' \
    h5p/editor/scripts/h5peditor.js && \
    sed -i \
    's/^ns\.widgets = {};/ns.widgets = {};\nns.language = ns.language || {};/' \
    h5p/editor/scripts/h5peditor.js

# Патч HttpClient.js: api.h5p.org не поддерживает TLS 1.3 через некоторые сети.
# Node.js/axios по умолчанию пробует TLS 1.3, что вызывает зависание на 80+ сек.
# Фиксируем максимальную версию TLS до 1.2 для исходящих запросов к H5P Hub.
RUN sed -i \
    's/httpsAgent: proxyAgent/httpsAgent: proxyAgent || new (require("https").Agent)({maxVersion:"TLSv1.2"})/' \
    node_modules/@lumieducation/h5p-server/build/src/helpers/HttpClient.js

# НЕ удаляем devDependencies, так как npm start использует ts-node
# Для production лучше запускать через npm start, чем через node напрямую

# Финальный образ
FROM node:20-alpine

# Установка curl и unzip для возможных будущих обновлений
RUN apk add --no-cache curl unzip bash

WORKDIR /app

# Копирование зависимостей из builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Копирование собранного приложения
COPY --from=builder /app/build ./build
COPY --from=builder /app/src ./src
COPY --from=builder /app/config.json ./
COPY --from=builder /app/tsconfig*.json ./

# Копирование H5P core и editor из builder
COPY --from=builder /app/h5p/core ./h5p/core
COPY --from=builder /app/h5p/editor ./h5p/editor

# Копирование статических файлов (включая content-types-hub.json)
COPY --from=builder /app/static ./static

# Создание директорий для монтирования volumes
RUN mkdir -p /app/h5p/content \
    /app/h5p/libraries \
    /app/h5p/temporary-storage \
    /app/h5p/user-data

# Установка прав доступа
RUN chown -R node:node /app

USER node

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=8088

EXPOSE 8088

# Запуск приложения через npm start (использует ts-node)
CMD ["npm", "start"]
