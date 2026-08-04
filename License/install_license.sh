#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LICENSE_DIR="$SCRIPT_DIR/putlicense"
LICENSE_ENC="$LICENSE_DIR/license.enc"
PUBLIC_KEY="$LICENSE_DIR/public.key"
CONTAINER_PATH="/local/license"

echo "========================"
echo "   Установка лицензии Brusnika LMS"
echo "========================"

# Проверка наличия файлов лицензии
if [ ! -f "$LICENSE_ENC" ]; then
  echo "❗ Файл не найден: $LICENSE_DIR/license.enc"
  echo "   Поместите license.enc в папку putlicense/ и запустите скрипт снова."
  exit 1
fi

if [ ! -f "$PUBLIC_KEY" ]; then
  echo "❗ Файл не найден: $LICENSE_DIR/public.key"
  echo "   Поместите public.key в папку putlicense/ и запустите скрипт снова."
  exit 1
fi

# Определяем docker compose
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif docker-compose --version >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "❗ docker compose не найден"
  exit 1
fi

# Ищем PHP-контейнер LMS. НЕ полагаемся ни на имя папки проекта (у клиентов
# она называется по-разному: lms-server, lms-server_version, lms-install и
# т.д.), ни на конкретный образ (некоторые клиенты собирают образ локально —
# тогда он называется не brusnikalms/brusnika-lms, а <project>-php).
#
# 1) Самый надёжный признак — compose-лейбл service=php: он не зависит ни от
#    имени проекта, ни от того, откуда взят образ (Hub или локальная сборка).
PHP_CONTAINER=$(docker ps --filter 'label=com.docker.compose.service=php' --format '{{.ID}}' | head -1)

# 2) Если контейнер запущен без docker-compose (просто `docker run`), лейбла
#    не будет — пробуем по образу с Docker Hub.
if [ -z "$PHP_CONTAINER" ]; then
  PHP_CONTAINER=$(docker ps --filter 'ancestor=brusnikalms/brusnika-lms' --format '{{.ID}}' | head -1)
fi

# 3) Последний вариант — через docker-compose, если он лежит рядом со скриптом.
if [ -z "$PHP_CONTAINER" ]; then
  PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
  if [ -f "$PROJECT_DIR/docker-compose.yaml" ] || [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
    PHP_CONTAINER=$(cd "$PROJECT_DIR" && $DC ps -q php 2>/dev/null | head -1)
  fi
fi

if [ -z "$PHP_CONTAINER" ]; then
  echo "❗ PHP-контейнер LMS не найден. Убедитесь, что контейнеры запущены."
  exit 1
fi

CONTAINER_NAME=$(docker inspect "$PHP_CONTAINER" --format '{{.Name}}' | tr -d '/')
echo "🔵 Контейнер: $CONTAINER_NAME"

# Создаём директорию в контейнере если не существует
docker exec "$PHP_CONTAINER" mkdir -p "$CONTAINER_PATH"

# Копируем файлы
echo "🔵 Копирование license.enc → $CONTAINER_PATH/license.enc"
docker cp "$LICENSE_ENC" "$PHP_CONTAINER:$CONTAINER_PATH/license.enc"

echo "🔵 Копирование public.key  → $CONTAINER_PATH/public.key"
docker cp "$PUBLIC_KEY" "$PHP_CONTAINER:$CONTAINER_PATH/public.key"

# Устанавливаем права
docker exec "$PHP_CONTAINER" chmod 644 "$CONTAINER_PATH/license.enc" "$CONTAINER_PATH/public.key" 2>/dev/null || true

echo ""
echo "✅ Лицензия установлена успешно."
echo "   $CONTAINER_PATH/license.enc"
echo "   $CONTAINER_PATH/public.key"
echo ""
