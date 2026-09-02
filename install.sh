#!/bin/bash
set -e

echo "========================"
echo "   🚀 Запуск установки Brusnika LMS"
echo "   🚀 Starting Brusnika LMS installation"
echo "========================"

# === 0. ЧТЕНИЕ .env / READ .env ===
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "❗ Файл .env не найден! Сначала запустите ./setup.sh"
  echo "❗ .env file not found! Run ./setup.sh first"
  exit 1
fi

# Проверка обязательных переменных / Required variables check
for var in DOMAIN H5P_DOMAIN CFORJ_DOMAIN; do
  if [ -z "${!var}" ]; then
    echo "❗ ${var} не задан в .env — запустите ./setup.sh"
    echo "❗ ${var} not set in .env — run ./setup.sh"
    exit 1
  fi
done

# Проверка docker compose / docker compose check
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif docker-compose --version >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "❗ docker compose не найден"
  echo "❗ docker compose not found"
  exit 1
fi

echo "🔵 docker-команда / docker command: $DC"
echo "🔵 DOMAIN        = $DOMAIN"
echo "🔵 H5P_DOMAIN    = $H5P_DOMAIN"
echo "🔵 CFORJ_DOMAIN  = $CFORJ_DOMAIN"

# === 1. ОЧИСТКА / CLEANUP ===
echo "🔵 1) Очистка старых контейнеров и volume с приложением..."
echo "🔵 1) Removing old containers and the application volume..."
$DC down --remove-orphans || true
docker volume rm lms-server_version_lms_data 2>/dev/null || true
docker volume rm lms_server_version_lms_data 2>/dev/null || true

# === 2. ЗАГРУЗКА ОБРАЗОВ / PULL IMAGES ===
echo "🔵 2) Загрузка образа LMS с Docker Hub..."
echo "🔵 2) Pulling LMS image from Docker Hub..."
docker login -u brusnikalms --password "dckr_pat_DIk0stOFXkzz1xdMYG8l06PJgn4" 2>/dev/null || true
docker pull brusnikalms/brusnika-lms:latest

echo "🔵 2.1) Сборка вспомогательных образов (h5p, cforj)..."
echo "🔵 2.1) Building auxiliary images (h5p, cforj)..."
$DC build --no-cache --progress=plain h5p cforj-api cforj

# === 3. ЗАПУСК / START ===
echo "🔵 3) Запуск всех контейнеров (db, php, lms, h5p, cforj-db, cforj-api, cforj)..."
echo "🔵 3) Starting all containers (db, php, lms, h5p, cforj-db, cforj-api, cforj)..."
$DC up -d

# === 4. ОЖИДАНИЕ БД / WAIT FOR DB ===
echo "🔵 4) Ожидание MariaDB..."
echo "🔵 4) Waiting for MariaDB..."
MAX_RETRIES=110
RETRY_COUNT=0

DB_CONTAINER=$($DC ps -q db)
if [ -z "$DB_CONTAINER" ]; then
  echo "❗ Контейнер db не найден"
  echo "❗ db container not found"
  exit 1
fi

until docker exec $DB_CONTAINER mariadb -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e "SELECT 1" >/dev/null 2>&1 \
   || docker exec $DB_CONTAINER mysql   -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e "SELECT 1" >/dev/null 2>&1
do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❗ Превышено время ожидания MariaDB"
    echo "❗ Timeout waiting for MariaDB"
    exit 1
  fi
  echo "⏳ Ждём MariaDB... ($RETRY_COUNT/$MAX_RETRIES)"
  echo "⏳ Waiting for MariaDB... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 3
done

echo "🟢 MariaDB доступна"
echo "🟢 MariaDB is up"

echo "🔵 Статус контейнеров: / Container status:"
$DC ps

# === 4.5. ОБНОВЛЕНИЕ sql/ И dictionary/ ИЗ ОБРАЗА / REFRESH sql/ AND dictionary/ FROM THE IMAGE ===
# Образ несёт свежие sql/ и dictionary/ внутри (см. Dockerfile, /app-build/sql,
# /app-build/dictionary) — забираем их поверх локальных копий, чтобы install.sh
# всегда использовал актуальные миграции и словарь без ручной передачи файлов.
# The image carries fresh sql/ and dictionary/ baked in (see Dockerfile,
# /app-build/sql, /app-build/dictionary) — pull them over the local copies so
# install.sh always uses up-to-date migrations and dictionary without manual file transfers.
echo "🔵 4.5) Обновление sql/ и dictionary/ из образа... / Refreshing sql/ and dictionary/ from the image..."
PHP_CONTAINER=$($DC ps -q php)
if [ -n "$PHP_CONTAINER" ]; then
  mkdir -p ./sql ./dictionary
  if docker exec "$PHP_CONTAINER" test -d /app-build/sql 2>/dev/null; then
    docker cp "$PHP_CONTAINER:/app-build/sql/." "./sql/" 2>/dev/null \
      && echo "   ✅ sql/ обновлён из образа / sql/ refreshed from the image"
  fi
  if docker exec "$PHP_CONTAINER" test -d /app-build/dictionary 2>/dev/null; then
    docker cp "$PHP_CONTAINER:/app-build/dictionary/." "./dictionary/" 2>/dev/null \
      && echo "   ✅ dictionary/ обновлён из образа / dictionary/ refreshed from the image"
  fi
fi

# === 5. ИМПОРТ БД / DB IMPORT ===
echo "🔵 5) Импорт структуры и словарей..."
echo "🔵 5) Importing schema and dictionaries..."
if [ -f ./import.sh ]; then
  ./import.sh "${MYSQL_DATABASE}" || echo "⚠️ Импорт завершился с ошибкой, продолжаем... / Import finished with errors, continuing..."
else
  echo "⚠️ import.sh не найден, пропускаем"
  echo "⚠️ import.sh not found, skipping"
fi

# === 6. ЧИСТКА ИСХОДНИКОВ / CLEANUP SOURCE FILES ===
echo "🔵 6) Удаление исходников на хосте..."
echo "🔵 6) Removing source files from the host..."
rm -rf ./lms/src \
       ./lms/*.ts \
       ./lms/*.vue 2>/dev/null || true

echo "🔵 7) Пересоздание контейнеров (чтобы подхватить свежий образ и entrypoint залил код в volume)..."
echo "🔵 7) Recreating containers (so the fresh image and entrypoint copy code into the volume)..."
$DC up -d --force-recreate --no-deps php lms h5p cforj cforj-api

echo "🔵 7.1) Обновление JS/CSS бандлов: удаление старых, копирование новых..."
echo "🔵 7.1) Updating JS/CSS bundles: removing old ones, copying new ones..."
PHP_CONTAINER=$($DC ps -q php)
sleep 5

# Сборка отдаёт множество chunk-файлов с хэшами в имени (не только app.*/vendor.*),
# поэтому синхронизируем каталоги целиком: чистим старые файлы и копируем всё заново.
# The build emits many hashed chunk files (not just app.*/vendor.*), so we mirror
# the whole directories: wipe old files, then copy everything fresh.
docker exec "$PHP_CONTAINER" bash -c "
  rm -f /var/www/html/js/*.js /var/www/html/js/*.js.map 2>/dev/null
  rm -f /var/www/html/css/*.css /var/www/html/css/*.css.map 2>/dev/null
  cp -f /app-build/js/*.js /app-build/js/*.js.map   /var/www/html/js/  2>/dev/null
  cp -f /app-build/css/*.css /app-build/css/*.css.map /var/www/html/css/ 2>/dev/null
  true
"

# Копируем index.html (для nginx-контейнера и шаблона Bitrix) / Copy index.html (for the nginx container and the Bitrix template)
docker exec "$PHP_CONTAINER" cp /app-build/index.html /var/www/html/index.html 2>/dev/null || true
docker exec "$PHP_CONTAINER" cp /app-build/index.html /var/www/html/local/components/univer/templates/.default/template.php 2>/dev/null || true
docker exec "$PHP_CONTAINER" cp /app-build/index.html /var/www/html/local/local/components/univer/templates/.default/template.php 2>/dev/null || true

echo "🟢 Бандлы обновлены (полная синхронизация js/css) / Bundles updated (full js/css sync)"

echo "🔵 8) Ожидание запуска сервисов..."
echo "🔵 8) Waiting for services to start..."
PHP_CONTAINER=$($DC ps -q php)
MAX_PHP_RETRIES=60
PHP_RETRY=0
until docker exec "$PHP_CONTAINER" php -r "echo 'ok';" >/dev/null 2>&1; do
  PHP_RETRY=$((PHP_RETRY + 1))
  if [ $PHP_RETRY -ge $MAX_PHP_RETRIES ]; then
    echo "⚠️ PHP контейнер не ответил за 3 мин, продолжаем..."
    echo "⚠️ PHP container did not respond within 3 min, continuing..."
    break
  fi
  echo "⏳ Ждём PHP... ($PHP_RETRY/$MAX_PHP_RETRIES)"
  echo "⏳ Waiting for PHP... ($PHP_RETRY/$MAX_PHP_RETRIES)"
  sleep 3
done
sleep 5

# === 9. СОЗДАНИЕ ТАБЛИЦ / CREATE TABLES ===
echo "🔵 9) Создание таблиц через API..."
echo "🔵 9) Creating tables via API..."
MAX_API_RETRIES=20
API_RETRY=0
HTTP_CODE="000"
until [ "$HTTP_CODE" = "200" ] || [ $API_RETRY -ge $MAX_API_RETRIES ]; do
  HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/create_ib" 2>/dev/null)
  if [ "$HTTP_CODE" != "200" ]; then
    HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "http://${DOMAIN}/api/create_ib" 2>/dev/null)
  fi
  if [ "$HTTP_CODE" = "200" ]; then
    echo "🟢 Таблицы созданы (попытка $((API_RETRY+1)))"
    echo "🟢 Tables created (attempt $((API_RETRY+1)))"
    break
  fi
  API_RETRY=$((API_RETRY + 1))
  echo "⏳ create_ib вернул $HTTP_CODE, повтор... ($API_RETRY/$MAX_API_RETRIES)"
  echo "⏳ create_ib returned $HTTP_CODE, retrying... ($API_RETRY/$MAX_API_RETRIES)"
  sleep 5
done
if [ "$HTTP_CODE" != "200" ]; then
  echo "❗ create_ib не вернул 200 после $MAX_API_RETRIES попыток (последний код: $HTTP_CODE). Логи: $DC logs php"
  echo "❗ create_ib did not return 200 after $MAX_API_RETRIES attempts (last code: $HTTP_CODE). Logs: $DC logs php"
fi

# === 10. МИГРАЦИИ БД (идемпотентные .sql из lms/local/sql) / DB MIGRATIONS (idempotent .sql files from lms/local/sql) ===
# Применяются ПОСЛЕ create_ib, чтобы таблицы уже существовали. / Applied AFTER create_ib so the tables already exist.
# Все файлы должны быть idempotent (ADD COLUMN IF NOT EXISTS и т.п.). / Every file must be idempotent (ADD COLUMN IF NOT EXISTS, etc.).
# Если папка не найдена на хосте — берём миграции из PHP-контейнера (образ Docker Hub).
# If the folder isn't found on the host — pull migrations from the PHP container (Docker Hub image).
MIGRATIONS_DIR="./lms/local/sql"
PHP_CONTAINER=$($DC ps -q php 2>/dev/null)
CONTAINER_SQL_DIR="/var/www/html/local/sql"

if [ ! -d "$MIGRATIONS_DIR" ] && [ -n "$PHP_CONTAINER" ]; then
  if docker exec "$PHP_CONTAINER" test -d "$CONTAINER_SQL_DIR" 2>/dev/null; then
    echo "🔵 10) lms/local/sql не найден на хосте — копируем миграции из контейнера..."
    echo "🔵 10) lms/local/sql not found on host — copying migrations from the container..."
    mkdir -p "$MIGRATIONS_DIR"
    docker cp "$PHP_CONTAINER:$CONTAINER_SQL_DIR/." "$MIGRATIONS_DIR/"
    echo "  ✅ Скопировано из образа"
    echo "  ✅ Copied from the image"
  fi
fi

if [ -d "$MIGRATIONS_DIR" ]; then
  shopt -s nullglob
  MIGRATION_FILES=("$MIGRATIONS_DIR"/*.sql)
  shopt -u nullglob

  if [ ${#MIGRATION_FILES[@]} -gt 0 ]; then
    MIG_PASS="${MYSQL_ROOT_PASSWORD:-root}"

    echo "🔵 10) Ожидание таблицы b24_portal_reg перед миграциями..."
    echo "🔵 10) Waiting for table b24_portal_reg before running migrations..."
    MAX_TBL_RETRIES=30
    TBL_RETRY=0
    until docker exec "$DB_CONTAINER" sh -c \
      "mariadb -uroot -p'$MIG_PASS' '$MYSQL_DATABASE' -e 'SHOW TABLES LIKE \"b24_portal_reg\"' 2>/dev/null" \
      | grep -q "b24_portal_reg"; do
      TBL_RETRY=$((TBL_RETRY + 1))
      if [ $TBL_RETRY -ge $MAX_TBL_RETRIES ]; then
        echo "⚠️ b24_portal_reg не появилась за 150 сек — мигрируем всё равно"
        echo "⚠️ b24_portal_reg did not appear within 150 sec — migrating anyway"
        break
      fi
      echo "⏳ Ждём b24_portal_reg... ($TBL_RETRY/$MAX_TBL_RETRIES)"
      echo "⏳ Waiting for b24_portal_reg... ($TBL_RETRY/$MAX_TBL_RETRIES)"
      sleep 5
    done

    echo "🔵 10) Применение миграций из $MIGRATIONS_DIR (${#MIGRATION_FILES[@]} файл(ов))..."
    echo "🔵 10) Applying migrations from $MIGRATIONS_DIR (${#MIGRATION_FILES[@]} file(s))..."
    IFS=$'\n' MIGRATION_FILES=($(sort <<<"${MIGRATION_FILES[*]}")); unset IFS

    for MIG in "${MIGRATION_FILES[@]}"; do
      name="$(basename "$MIG")"
      echo "  ➜ $name"
      if docker exec -i "$DB_CONTAINER" sh -c "mariadb -uroot -p'$MIG_PASS' '$MYSQL_DATABASE'" < "$MIG"; then
        echo "  ✅ $name применена / applied"
      else
        echo "  ⚠️ $name завершилась с ошибкой (продолжаем) / failed (continuing)"
      fi
    done
  else
    echo "🔵 10) Миграции: в $MIGRATIONS_DIR нет .sql файлов — пропускаем"
    echo "🔵 10) Migrations: no .sql files in $MIGRATIONS_DIR — skipping"
  fi
else
  echo "🔵 10) Каталог миграций $MIGRATIONS_DIR отсутствует — пропускаем"
  echo "🔵 10) Migrations directory $MIGRATIONS_DIR missing — skipping"
fi

# === 11. ПРОВЕРКА СХЕМЫ БД / DB SCHEMA CHECK ===
echo "🔵 11) Проверка схемы БД..."
echo "🔵 11) Verifying DB schema..."
if [ -f ./verify_db.sh ]; then
  chmod +x ./verify_db.sh
  ./verify_db.sh || echo "⚠️ Некоторые таблицы/данные отсутствуют — см. вывод выше / Some tables/data are missing — see output above"
else
  echo "⚠️ verify_db.sh не найден — пропускаем"
  echo "⚠️ verify_db.sh not found — skipping"
fi

echo ""
echo "========================"
echo "   ✔️ УСТАНОВКА ЗАВЕРШЕНА"
echo "   ✔️ INSTALLATION COMPLETE"
echo "========================"
echo ""
echo "🌐 Доступ / Access:"
echo "   LMS:   https://${DOMAIN}"
echo "   H5P:   https://${H5P_DOMAIN}"
echo "   cforj: https://${CFORJ_DOMAIN}"
echo ""
echo "Команды / Commands:"
echo "   Логи / Logs:     $DC logs -f"
echo "   Статус / Status: $DC ps"
echo "   Стоп / Stop:     $DC down"
echo "   Рестарт / Restart: $DC restart"
