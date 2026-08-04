#!/bin/bash
set -e

# Определяем директорию где находится скрипт
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Загружаем переменные из .env
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi

PASS="${MYSQL_ROOT_PASSWORD:-root}"

# Определяем команду docker compose (v2 или v1)
if docker compose version >/dev/null 2>&1; then
    DC="docker compose"
elif docker-compose --version >/dev/null 2>&1; then
    DC="docker-compose"
else
    echo "Ошибка: docker compose не найден!"
    exit 1
fi

# Автоматически находим контейнер db
CONTAINER=$($DC ps -q db 2>/dev/null)

if [ -z "$CONTAINER" ]; then
    echo "Ошибка: контейнер db не найден. Запустите $DC up -d"
    exit 1
fi

echo "Найден контейнер: $CONTAINER"

# Если БД передана как параметр — используем её
if [ -n "$1" ]; then
    DB="$1"
else
    # Получаем список баз данных
    echo ""
    echo "Доступные базы данных:"
    DATABASES=$(docker exec -i $CONTAINER mysql -u root -p$PASS -N -e "SHOW DATABASES;" 2>/dev/null | grep -v -E "^(information_schema|performance_schema|mysql|sys)$")

    i=1
    declare -a DB_ARRAY
    while IFS= read -r db; do
        echo "  $i) $db"
        DB_ARRAY[$i]="$db"
        ((i++))
    done <<< "$DATABASES"

    echo ""
    read -p "Выберите номер базы данных: " choice

    if [ -z "${DB_ARRAY[$choice]}" ]; then
        echo "Ошибка: неверный выбор"
        exit 1
    fi

    DB="${DB_ARRAY[$choice]}"
fi

echo "Используется БД: $DB"

echo "=== НАЧИНАЕМ ИМПОРТ ==="
echo "Рабочая директория: $SCRIPT_DIR"

# Импортируем все .sql файлы из dictionary/ по алфавиту.
# Важен порядок: сначала структура, потом данные. Именуйте файл
# структуры так, чтобы он шёл первым (например "00-структура.sql"),
# либо кладите единственный дамп — он отработает один.
shopt -s nullglob
SQL_FILES=("$SCRIPT_DIR"/dictionary/*.sql)
shopt -u nullglob

if [ ${#SQL_FILES[@]} -eq 0 ]; then
    echo "❗ В dictionary/ нет ни одного .sql файла"
    exit 1
fi

IFS=$'\n' SQL_FILES=($(sort <<<"${SQL_FILES[*]}")); unset IFS

for FULL in "${SQL_FILES[@]}"; do
    file="$(basename "$FULL")"
    echo "Импорт: $file"
    docker exec -i $CONTAINER mysql -u root -p$PASS $DB < "$FULL"
    echo "✅ $file импортирован"
done

echo "=== ГОТОВО ==="
