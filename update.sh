#!/bin/bash
set -e

echo "=============================="
echo "   Обновление серверной ЛМС"
echo "   Brusnika LMS — Update"
echo "=============================="

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Директория обновления / Update directory: $SCRIPT_DIR"

# Если сам update.sh лежит рядом со своим install.sh — это и есть нужная ЛМС,
# автопоиск по /var/www не нужен (там могут быть старые заброшенные копии).
# If update.sh sits next to its own install.sh, that's the LMS to update —
# skip the /var/www auto-search (stale leftover copies may live there too).
LMS_DIR=""
if [ -f "${SCRIPT_DIR}/install.sh" ]; then
  LMS_DIR="${SCRIPT_DIR}/"
  echo "Используется текущая директория / Using current directory: $LMS_DIR"
fi

# Поиск развёрнутой ЛМС в /var/www / Search for the deployed LMS under /var/www
if [ -z "$LMS_DIR" ]; then
  echo "Поиск серверной ЛМС в /var/www/... / Searching for the LMS installation in /var/www/..."
  for dir in /var/www/*lms*/ /var/www/*/*lms*/ /var/www/*/ /var/www/*/*/; do
    [ -d "$dir" ] || continue
    if [ -f "${dir}install.sh" ]; then
      LMS_DIR="$dir"
      break
    fi
  done
fi

if [ -z "$LMS_DIR" ]; then
  echo "Серверная ЛМС не найдена автоматически в /var/www/ / LMS not found automatically in /var/www/"
  echo -n "Укажите путь до директории серверной ЛМС вручную / Enter the path to the LMS directory manually: "
  read LMS_DIR
  if [ ! -f "${LMS_DIR}/install.sh" ]; then
    echo "Ошибка: install.sh не найден в $LMS_DIR / Error: install.sh not found in $LMS_DIR"
    exit 1
  fi
fi

LMS_DIR="${LMS_DIR%/}/"
echo "Найдена серверная ЛМС / LMS found at: $LMS_DIR"

# Читаем .env из развёрнутой ЛМС / Read .env from the deployed LMS
if [ ! -f "${LMS_DIR}.env" ]; then
  echo "Ошибка: .env не найден в $LMS_DIR / Error: .env not found in $LMS_DIR"
  exit 1
fi
export $(grep -v '^#' "${LMS_DIR}.env" | xargs)

# Определяем docker compose / Detect docker compose
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif docker-compose --version >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "Ошибка: docker compose не найден / Error: docker compose not found"
  exit 1
fi

cd "$LMS_DIR"

# === 1. ВЫБОР ВЕРСИИ / VERSION SELECTION ===
DOCKERHUB_USER="brusnikalms"
DOCKERHUB_PASS_LOCAL="dckr_pat_DIk0stOFXkzz1xdMYG8l06PJgn4"
IMAGE="brusnikalms/brusnika-lms"
TARGET_TAG="latest"

echo ""
echo "Что сделать? / What to do?"
echo "  1) Обновиться до последней версии / Update to the latest version"
echo "  2) Откатиться до одной из последних версий / Roll back to a previous version"

if [ -t 0 ]; then
  read -p "Выбор [1] / Choice [1]: " UPDATE_CHOICE
else
  UPDATE_CHOICE="1"
  echo "   Неинтерактивный запуск — по умолчанию обновление до latest. / Non-interactive run — defaulting to latest."
fi
UPDATE_CHOICE="${UPDATE_CHOICE:-1}"

if [ "$UPDATE_CHOICE" = "2" ]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "❗ jq не установлен — откат по версиям недоступен, обновляюсь до latest. / jq not installed — rollback unavailable, updating to latest."
  else
    echo "   Получаю список версий с Docker Hub... / Fetching version list from Docker Hub..."
    HUB_JWT=$(curl -s -X POST "https://hub.docker.com/v2/users/login/" \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"${DOCKERHUB_USER}\",\"password\":\"${DOCKERHUB_PASS_LOCAL}\"}" \
      | jq -r '.token // empty' 2>/dev/null)

    if [ -z "$HUB_JWT" ]; then
      echo "❗ Не удалось авторизоваться в Docker Hub — обновляюсь до latest. / Docker Hub auth failed — updating to latest."
    else
      # Docker Hub API игнорирует ordering=-last_updated для этого эндпоинта и всегда
      # отдаёт теги от старых к новым, поэтому сортируем сами по tag_last_pushed.
      # The ordering=-last_updated param is ignored by this Hub endpoint (always
      # returns oldest-first), so we sort by tag_last_pushed ourselves.
      TAGS_JSON=$(curl -s "https://hub.docker.com/v2/repositories/${IMAGE}/tags?page_size=30" \
        -H "Authorization: JWT ${HUB_JWT}")
      mapfile -t TAG_NAMES < <(echo "$TAGS_JSON" | jq -r '
        [.results[] | select(.name != "latest")]
        | sort_by(.tag_last_pushed)
        | reverse
        | .[].name
      ' 2>/dev/null | head -10)

      if [ "${#TAG_NAMES[@]}" -eq 0 ]; then
        echo "❗ Нет доступных версий для отката — обновляюсь до latest. / No versions available for rollback — updating to latest."
      else
        REG_TOKEN=$(curl -s -u "${DOCKERHUB_USER}:${DOCKERHUB_PASS_LOCAL}" \
          "https://auth.docker.io/token?service=registry.docker.io&scope=repository:${IMAGE}:pull" \
          | jq -r '.token // empty' 2>/dev/null)

        echo ""
        echo "Доступные версии (номер — тег — changelog) / Available versions (number — tag — changelog):"
        i=1
        for t in "${TAG_NAMES[@]}"; do
          CL=""
          if [ -n "$REG_TOKEN" ]; then
            DIGEST=$(curl -s -H "Authorization: Bearer ${REG_TOKEN}" \
              -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
              "https://registry-1.docker.io/v2/${IMAGE}/manifests/${t}" \
              | jq -r '.config.digest // empty' 2>/dev/null)
            if [ -n "$DIGEST" ]; then
              CL=$(curl -s -H "Authorization: Bearer ${REG_TOKEN}" \
                "https://registry-1.docker.io/v2/${IMAGE}/blobs/${DIGEST}" \
                | jq -r '.config.Labels["io.brusnika.changelog"] // empty' 2>/dev/null)
            fi
          fi
          printf "  %2d) %-18s %s\n" "$i" "$t" "$CL"
          i=$((i + 1))
        done
        echo ""
        read -p "Номер версии для отката / Version number to roll back to [1]: " VER_CHOICE
        VER_CHOICE="${VER_CHOICE:-1}"
        if [[ "$VER_CHOICE" =~ ^[0-9]+$ ]] && [ "$VER_CHOICE" -ge 1 ] && [ "$VER_CHOICE" -le "${#TAG_NAMES[@]}" ]; then
          IDX=$((VER_CHOICE - 1))
          TARGET_TAG="${TAG_NAMES[$IDX]}"
        else
          echo "❗ Некорректный номер — обновляюсь до latest. / Invalid number — updating to latest."
        fi
      fi
    fi
  fi
fi

# === 2. ЗАГРУЗКА ОБРАЗА / PULL IMAGE ===
echo "2) Загрузка образа LMS (${TARGET_TAG}) с Docker Hub... / Pulling LMS image (${TARGET_TAG}) from Docker Hub..."
docker login -u "${DOCKERHUB_USER}" --password "${DOCKERHUB_PASS_LOCAL}" 2>/dev/null || true
docker pull "${IMAGE}:${TARGET_TAG}"
if [ "$TARGET_TAG" != "latest" ]; then
  docker tag "${IMAGE}:${TARGET_TAG}" "${IMAGE}:latest"
  echo "   Версия ${TARGET_TAG} помечена как latest локально. / Version ${TARGET_TAG} tagged as latest locally."
fi
echo "   Образ обновлён. / Image updated."

# === 3. ПЕРЕЗАПУСК КОНТЕЙНЕРА С НОВЫМ ОБРАЗОМ ===
# === 4. ПЕРЕСОЗДАНИЕ КОНТЕЙНЕРОВ БЕЗ УДАЛЕНИЯ VOLUMES ===
# === 3-4. RECREATE CONTAINERS WITHOUT REMOVING VOLUMES ===
# --force-recreate перезапускает контейнеры с новым образом.
# --force-recreate restarts containers with the new image.
# Именованные volumes (dbdata, lms_data, h5p-*, cforj_*) НЕ удаляются —
# все данные пользователей, материалы и настройки сохраняются.
# Named volumes (dbdata, lms_data, h5p-*, cforj_*) are NOT removed —
# all user data, materials and settings are preserved.
echo "4) Пересоздание контейнеров (данные и volumes НЕ удаляются)... / Recreating containers (data and volumes are NOT removed)..."
$DC up -d --force-recreate --no-deps php lms

# === 5. ОЖИДАНИЕ PHP / WAIT FOR PHP ===
echo "5) Ожидание PHP... / Waiting for PHP..."
PHP_CONTAINER=$($DC ps -q php)
sleep 5
MAX_RETRIES=60
RETRY=0
until docker exec "$PHP_CONTAINER" php -r "echo 'ok';" >/dev/null 2>&1; do
  RETRY=$((RETRY + 1))
  if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "   Предупреждение: PHP не ответил за 3 мин, продолжаем... / Warning: PHP did not respond within 3 min, continuing..."
    break
  fi
  echo "   Ждём PHP... ($RETRY/$MAX_RETRIES) / Waiting for PHP... ($RETRY/$MAX_RETRIES)"
  sleep 3
done

# === 6. ОБНОВЛЕНИЕ JS/CSS БАНДЛОВ / UPDATE JS/CSS BUNDLES ===
echo "6) Обновление JS/CSS бандлов... / Updating JS/CSS bundles..."
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
  cp -f /app-build/index.html /var/www/html/index.html 2>/dev/null || true
  cp -f /app-build/index.html /var/www/html/local/components/univer/templates/.default/template.php 2>/dev/null || true
  cp -f /app-build/index.html /var/www/html/local/local/components/univer/templates/.default/template.php 2>/dev/null || true
  true
"

echo "   Новые бандлы скопированы (полная синхронизация js/css) / New bundles copied (full js/css sync)"

echo "   Бандлы обновлены. / Bundles updated."

# === 6.5. ОБНОВЛЕНИЕ sql/ И dictionary/ ИЗ ОБРАЗА / REFRESH sql/ AND dictionary/ FROM THE IMAGE ===
# Образ несёт свежие sql/ и dictionary/ внутри (см. Dockerfile, /app-build/sql,
# /app-build/dictionary) — забираем их поверх локальных копий, чтобы verify_db.sh/
# fix_db.sh ниже применяли актуальные миграции без ручной передачи файлов клиенту.
# dictionary/ сама по себе не импортируется при update.sh (см. шаг 7 ниже), но
# обновление файла на диске не помешает будущим ручным/повторным install.sh.
# The image carries fresh sql/ and dictionary/ baked in (see Dockerfile,
# /app-build/sql, /app-build/dictionary) — pull them over the local copies so
# verify_db.sh/fix_db.sh below apply up-to-date migrations without manual file
# transfers. dictionary/ itself isn't imported during update.sh (see step 7
# below), but refreshing the file on disk doesn't hurt future install.sh runs.
echo "6.5) Обновление sql/ и dictionary/ из образа... / Refreshing sql/ and dictionary/ from the image..."
mkdir -p "${LMS_DIR}sql" "${LMS_DIR}dictionary"
if docker exec "$PHP_CONTAINER" test -d /app-build/sql 2>/dev/null; then
  docker cp "$PHP_CONTAINER:/app-build/sql/." "${LMS_DIR}sql/" 2>/dev/null \
    && echo "   ✅ sql/ обновлён из образа / sql/ refreshed from the image"
fi
if docker exec "$PHP_CONTAINER" test -d /app-build/dictionary 2>/dev/null; then
  docker cp "$PHP_CONTAINER:/app-build/dictionary/." "${LMS_DIR}dictionary/" 2>/dev/null \
    && echo "   ✅ dictionary/ обновлён из образа / dictionary/ refreshed from the image"
fi

# === 7. ТОЛЬКО МИГРАЦИИ (без полного import.sh) / MIGRATIONS ONLY (no full import.sh) ===
# import.sh при обновлении НЕ запускается — он переимпортирует словари целиком
# и перезаписывает пользовательские данные.
# import.sh is NOT run during updates — it would re-import dictionaries and overwrite user data.
# Применяются только idempotent-миграции из lms/local/sql/*.sql.
# Only idempotent migrations from lms/local/sql/*.sql are applied.
MIGRATIONS_DIR="${LMS_DIR}lms/local/sql"
if [ -d "$MIGRATIONS_DIR" ]; then
  shopt -s nullglob
  MIGRATION_FILES=("$MIGRATIONS_DIR"/*.sql)
  shopt -u nullglob
  if [ ${#MIGRATION_FILES[@]} -gt 0 ]; then
    DB_CONTAINER=$($DC ps -q db)
    MIG_PASS="${MYSQL_ROOT_PASSWORD:-root}"
    echo "7) Применение миграций (${#MIGRATION_FILES[@]} файл(ов))... / Applying migrations (${#MIGRATION_FILES[@]} file(s))..."
    IFS=$'\n' MIGRATION_FILES=($(sort <<<"${MIGRATION_FILES[*]}")); unset IFS
    for MIG in "${MIGRATION_FILES[@]}"; do
      name="$(basename "$MIG")"
      echo "   ➜ $name"
      if docker exec -i "$DB_CONTAINER" sh -c "mariadb -uroot -p'${MIG_PASS}' '${MYSQL_DATABASE}'" < "$MIG"; then
        echo "   ✅ $name применена / applied"
      else
        echo "   ⚠️  $name завершилась с ошибкой (продолжаем) / failed (continuing)"
      fi
    done
  else
    echo "7) Миграций нет — пропускаем. / No migrations found — skipping."
  fi
else
  echo "7) Каталог миграций отсутствует — пропускаем. / Migrations directory not found — skipping."
fi

# === 8. ПРОВЕРКА СХЕМЫ БД / DB SCHEMA CHECK ===
echo "8) Проверка схемы БД... / Verifying DB schema..."
if [ -f "${LMS_DIR}verify_db.sh" ]; then
  chmod +x "${LMS_DIR}verify_db.sh"
  (cd "$LMS_DIR" && ./verify_db.sh) || echo "⚠️ Некоторые таблицы/данные отсутствуют — см. вывод выше / Some tables/data are missing — see output above"
else
  echo "   verify_db.sh не найден — пропускаем / verify_db.sh not found — skipping"
fi

echo ""
echo "=============================="
echo "   Обновление завершено!"
echo "   Update complete!"
echo "=============================="
echo ""
echo "Данные пользователей, материалы и настройки сохранены. / User data, materials and settings have been preserved."
echo "Volumes (dbdata, lms_data, h5p-*, cforj_*) не затронуты. / Volumes (dbdata, lms_data, h5p-*, cforj_*) were not affected."
