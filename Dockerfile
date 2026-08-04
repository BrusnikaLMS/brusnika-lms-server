##########################################################
# Сборка SPA (Quasar) — отдельный builder-этап
##########################################################
FROM node:22 AS builder

ARG SERVER_VERSION=Y
ARG APIURL=""
ARG APP_SERVER_URL=""
ARG SHOW_NEW_UI=""
ARG H5P_BASE=""
ARG CFORJ_DEFAULT_BASE_URL=""

WORKDIR /build

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV SERVER_VERSION=${SERVER_VERSION}
ENV APIURL=${APIURL}
ENV APP_SERVER_URL=${APP_SERVER_URL}
ENV SHOW_NEW_UI=${SHOW_NEW_UI}
ENV H5P_BASE=${H5P_BASE}
ENV CFORJ_DEFAULT_BASE_URL=${CFORJ_DEFAULT_BASE_URL}

RUN cd lms \
    && npm install --legacy-peer-deps \
    && npm i -g @quasar/cli \
    && quasar build -d

##########################################################
# Финальная stage: PHP 8.2-FPM
##########################################################
FROM php:8.2-fpm

RUN mkdir -p /var/www/html /app-build
WORKDIR /var/www/html

# Системные пакеты + Composer
RUN apt-get update && apt-get install -y \
        git unzip libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
        libonig-dev libxml2-dev libicu-dev \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sS https://getcomposer.org/installer \
        | php -- --install-dir=/usr/local/bin --filename=composer

# PHP модули под Brusnika LMS
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        mysqli pdo pdo_mysql gd zip intl mbstring xml opcache bcmath

# Лимиты загрузки файлов
RUN { \
    echo 'upload_max_filesize = 512M'; \
    echo 'post_max_size = 512M'; \
    echo 'memory_limit = 512M'; \
    echo 'max_execution_time = 300'; \
    echo 'max_input_time = 300'; \
} > /usr/local/etc/php/conf.d/uploads.ini

# Отключение вывода ошибок PHP в браузер
RUN { \
    echo 'display_errors = Off'; \
    echo 'display_startup_errors = Off'; \
    echo 'error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT'; \
    echo 'log_errors = On'; \
} > /usr/local/etc/php/conf.d/z-nodebug.ini

##########################################################
# Копируем готовый SPA + бэкенд LMS во временную папку
##########################################################
COPY --from=builder /build/lms/dist/spa/ /app-build/

COPY lms/core/    /app-build/core/
COPY lms/local/   /app-build/local/
COPY lms/index.php /app-build/
COPY lms/*.php     /app-build/

# sql/ и dictionary/ печём в образ, чтобы install.sh/update.sh могли забрать их
# из контейнера через `docker cp /app-build/{sql,dictionary}` — без ручной
# передачи файлов клиенту при каждом фиксе БД/словаря.
COPY sql/        /app-build/sql/
COPY dictionary/ /app-build/dictionary/

# template.php = index.html со свежими хешами бандлов (как в local_build.sh)
RUN mkdir -p /app-build/local/components/univer/templates/.default \
    && cp /app-build/index.html /app-build/local/components/univer/templates/.default/template.php

# tcpdf в git-репозитории неполный (нет include/) — докачиваем include/ с GitHub.
# vendor/tcpdf/ берётся из git как есть, версия читается из vendor/tcpdf/VERSION.
RUN TCPDF_VER=$(cat /app-build/core/vendor/tcpdf/VERSION 2>/dev/null | tr -d '[:space:]' || echo "6.7.5") \
    && curl -fsSL "https://github.com/tecnickcom/TCPDF/archive/refs/tags/${TCPDF_VER}.tar.gz" -o /tmp/tcpdf.tar.gz \
    && tar -xzf /tmp/tcpdf.tar.gz -C /tmp/ \
    && cp -r /tmp/TCPDF-${TCPDF_VER}/include/ /app-build/core/vendor/tcpdf/include/ \
    && rm -rf /tmp/tcpdf.tar.gz /tmp/TCPDF-${TCPDF_VER} \
    && composer dump-autoload --working-dir=/app-build/core --no-dev --optimize --ignore-platform-reqs

##########################################################
# Entrypoint — копирование app в общий volume при старте
##########################################################
RUN printf '%s\n' \
    '#!/bin/bash' \
    'if [ ! -f /var/www/html/index.php ] || [ "$FORCE_UPDATE" = "1" ]; then' \
    '  echo "Copying app files to volume..."' \
    '  cp -r /app-build/* /var/www/html/' \
    '  echo "Done!"' \
    'fi' \
    'mkdir -p /var/www/html/logs' \
    'chown -R www-data:www-data /var/www/html' \
    'chmod -R 775 /var/www/html' \
    'exec "$@"' \
    > /entrypoint.sh \
    && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["php-fpm"]
