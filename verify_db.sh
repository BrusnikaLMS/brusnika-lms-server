#!/bin/bash
# Проверка схемы БД серверной ЛМС.
# Verifies the server LMS database schema.
# Запускается автоматически в конце install.sh и update.sh.
# Run automatically at the end of install.sh and update.sh.
# Выводит список проблем и возвращает код 0 (всё ок) или 1 (есть проблемы).
# Prints a list of issues and returns exit code 0 (all ok) or 1 (problems found).
# При обнаружении проблем — автоматически вызывает fix_db.sh.
# If problems are found — automatically calls fix_db.sh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------- Конфигурация / Configuration ----------
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB="${MYSQL_DATABASE:-brusnika-lms-server}"
PASS="${MYSQL_ROOT_PASSWORD:-root}"

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif docker-compose --version >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "❗ docker compose не найден / docker compose not found"
  exit 1
fi

DB_CONTAINER=$($DC ps -q db 2>/dev/null)
if [ -z "$DB_CONTAINER" ]; then
  echo "❗ verify_db: контейнер db не запущен — пропускаем / db container is not running — skipping"
  exit 0
fi

run_sql() {
  echo "$1" | docker exec -i "$DB_CONTAINER" \
    mariadb -uroot -p"${PASS}" "${DB}" -sN 2>/dev/null
}

ERRORS=0
NEEDS_FIX=0

echo ""
echo "=============================="
echo "   🔍 Проверка схемы БД"
echo "   🔍 DB Schema Check"
echo "=============================="

# ---------- 1. Обязательные таблицы / Required tables ----------
REQUIRED_TABLES=(
  b24_event_log
  b24_options
  b24_orders
  b24_portal_reg
  b24_products
  dictionary
  dictionary2
  dictionary2_custom
  dictionary3
  iblock
  iblock_element
  iblock_element_property_values
  iblock_property
  iblock_property_enum
  iblock_section
  iblock_section_property_values
  instructions
  log
  messages
  oauth_access_tokens
  oauth_authorization_codes
  oauth_clients
  oauth_refresh_tokens
  oauth_scopes
  reset_password
  transfer_data
  transfer_ident
  transfer_users
  users
  uni_hr_poll_template_categories
  uni_hr_poll_templates
)

echo "1) Проверка таблиц (${#REQUIRED_TABLES[@]})... / Checking tables (${#REQUIRED_TABLES[@]})..."
MISSING_TABLES=()
for tbl in "${REQUIRED_TABLES[@]}"; do
  EXISTS=$(run_sql "SHOW TABLES LIKE '${tbl}';" | wc -l | tr -d ' ')
  if [ "$EXISTS" = "0" ]; then
    MISSING_TABLES+=("$tbl")
  fi
done

if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
  echo "   ✅ Все таблицы присутствуют / All tables present"
else
  echo "   ❌ Отсутствуют таблицы (${#MISSING_TABLES[@]}): / Missing tables (${#MISSING_TABLES[@]}):"
  for t in "${MISSING_TABLES[@]}"; do
    echo "      - $t"
  done
  ERRORS=$((ERRORS + ${#MISSING_TABLES[@]}))
  NEEDS_FIX=1
fi

# ---------- 2. dictionary3 не пустой / dictionary3 is not empty ----------
echo "2) Проверка dictionary3... / Checking dictionary3..."
D3_COUNT=$(run_sql "SELECT COUNT(*) FROM dictionary3;" 2>/dev/null || echo "0")
D3_COUNT=$(echo "$D3_COUNT" | tr -d '[:space:]')
if [ "${D3_COUNT:-0}" -lt 1000 ]; then
  echo "   ❌ dictionary3 пустой или почти пустой (строк: ${D3_COUNT:-0}) / dictionary3 is empty or nearly empty (rows: ${D3_COUNT:-0})"
  ERRORS=$((ERRORS + 1))
  NEEDS_FIX=1
else
  echo "   ✅ dictionary3: ${D3_COUNT} строк / rows"
fi

# ---------- 3. Обязательные iblock-записи / Required iblock records ----------
echo "3) Проверка iblock-сущностей... / Checking iblock entities..."
REQUIRED_IBLOCKS=(
  uni_profile
  uni_options
  uni_files
  uni_opens
  uni_ucourses
  uni_utests
  uni_comments
  uni_aos
  uni_competence
  uni_meth360180
  uni_tests
  uni_courses
  uni_lessons
  uni_ulessons
  uni_schedules
  uni_notifs
  uni_bids
  uni_events
  uni_progscheds
  uni_uprogscheds
  uni_programs
  uni_degree360
  uni_udegree360
  uni_tdegree360
  uni_subaccounts
  uni_quiz
  uni_rating
  uni_message
  uni_userstat
  uni_quizevent
  uni_shelves
  uni_items
  uni_items_own
  uni_items_checks
  uni_polls
  uni_poll_bindings
  uni_poll_submissions
  uni_access_rights
  uni_catalog_shares
  uni_item_subs
  uni_gifts_cats
  uni_gifts
  uni_opens_templates
  uni_gifts_requests
  uni_pushsubs
)
MISSING_IB=()
for code in "${REQUIRED_IBLOCKS[@]}"; do
  CNT=$(run_sql "SELECT COUNT(*) FROM iblock WHERE code='${code}';" 2>/dev/null || echo "0")
  CNT=$(echo "$CNT" | tr -d '[:space:]')
  if [ "${CNT:-0}" -eq 0 ]; then
    MISSING_IB+=("$code")
  fi
done

if [ ${#MISSING_IB[@]} -eq 0 ]; then
  echo "   ✅ Все iblock-сущности присутствуют / All iblock entities present"
else
  echo "   ❌ Отсутствуют iblock-записи: / Missing iblock records:"
  for ib in "${MISSING_IB[@]}"; do
    echo "      - $ib"
  done
  ERRORS=$((ERRORS + ${#MISSING_IB[@]}))
  NEEDS_FIX=1
fi

# ---------- 4. Свойства uni_poll_submissions / uni_poll_submissions properties ----------
echo "4) Проверка iblock-свойств uni_poll_submissions... / Checking uni_poll_submissions iblock properties..."
REQUIRED_POLL_SUB_PROPS=(uf_PROPERTY_binding_id uf_PROPERTY_poll_id uf_PROPERTY_user_id uf_PROPERTY_attempt_no uf_PROPERTY_answers uf_PROPERTY_status uf_PROPERTY_started_at uf_PROPERTY_submitted_at uf_PROPERTY_is_latest)
MISSING_PROPS=()
IB_SUBMISSIONS_ID=$(run_sql "SELECT id FROM iblock WHERE code='uni_poll_submissions' LIMIT 1;" 2>/dev/null | tr -d '[:space:]')
if [ -z "$IB_SUBMISSIONS_ID" ]; then
  echo "   ⚠️  uni_poll_submissions iblock не найден — пропускаем проверку свойств / iblock not found — skipping property check"
  ERRORS=$((ERRORS + 1))
  NEEDS_FIX=1
else
  for prop in "${REQUIRED_POLL_SUB_PROPS[@]}"; do
    CNT=$(run_sql "SELECT COUNT(*) FROM iblock_property WHERE iblock_id=${IB_SUBMISSIONS_ID} AND code='${prop}';" 2>/dev/null || echo "0")
    CNT=$(echo "$CNT" | tr -d '[:space:]')
    if [ "${CNT:-0}" -eq 0 ]; then
      MISSING_PROPS+=("$prop")
    fi
  done
  if [ ${#MISSING_PROPS[@]} -eq 0 ]; then
    echo "   ✅ Все 9 свойств uni_poll_submissions присутствуют / All 9 properties present"
  else
    echo "   ❌ Отсутствуют свойства uni_poll_submissions (${#MISSING_PROPS[@]}): / Missing properties (${#MISSING_PROPS[@]}):"
    for p in "${MISSING_PROPS[@]}"; do
      echo "      - $p"
    done
    ERRORS=$((ERRORS + ${#MISSING_PROPS[@]}))
    NEEDS_FIX=1
  fi
fi

# ---------- 4б. Свойства uni_polls / 4b. uni_polls properties ----------
echo "4б) Проверка iblock-свойств uni_polls... / 4b) Checking uni_polls iblock properties..."
REQUIRED_POLLS_PROPS=(uf_PROPERTY_list uf_PROPERTY_sections uf_PROPERTY_users uf_PROPERTY_deps uf_PROPERTY_allaccess uf_PROPERTY_flags uf_PROPERTY_owner uf_PROPERTY_ra_type uf_PROPERTY_time_limit uf_PROPERTY_subaccs uf_PROPERTY_subacc_grps)
MISSING_POLLS_PROPS=()
IB_POLLS_ID=$(run_sql "SELECT id FROM iblock WHERE code='uni_polls' LIMIT 1;" 2>/dev/null | tr -d '[:space:]')
if [ -z "$IB_POLLS_ID" ]; then
  echo "   ⚠️  uni_polls iblock не найден — пропускаем проверку свойств / iblock not found — skipping property check"
  ERRORS=$((ERRORS + 1))
  NEEDS_FIX=1
else
  for prop in "${REQUIRED_POLLS_PROPS[@]}"; do
    CNT=$(run_sql "SELECT COUNT(*) FROM iblock_property WHERE iblock_id=${IB_POLLS_ID} AND code='${prop}';" 2>/dev/null || echo "0")
    CNT=$(echo "$CNT" | tr -d '[:space:]')
    if [ "${CNT:-0}" -eq 0 ]; then
      MISSING_POLLS_PROPS+=("$prop")
    fi
  done
  if [ ${#MISSING_POLLS_PROPS[@]} -eq 0 ]; then
    echo "   ✅ Все 11 свойств uni_polls присутствуют / All 11 properties present"
  else
    echo "   ❌ Отсутствуют свойства uni_polls (${#MISSING_POLLS_PROPS[@]}): / Missing properties (${#MISSING_POLLS_PROPS[@]}):"
    for p in "${MISSING_POLLS_PROPS[@]}"; do
      echo "      - $p"
    done
    ERRORS=$((ERRORS + ${#MISSING_POLLS_PROPS[@]}))
    NEEDS_FIX=1
  fi
fi

# ---------- 4в. Колонки OAuth в b24_portal_reg / 4c. OAuth columns in b24_portal_reg ----------
echo "4в) Проверка колонок OAUTH_CLIENT_ID/OAUTH_CLIENT_SECRET в b24_portal_reg... / 4c) Checking OAuth columns in b24_portal_reg..."
MISSING_OAUTH_COLS=()
for col in OAUTH_CLIENT_ID OAUTH_CLIENT_SECRET; do
  CNT=$(run_sql "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='b24_portal_reg' AND column_name='${col}';" 2>/dev/null || echo "0")
  CNT=$(echo "$CNT" | tr -d '[:space:]')
  if [ "${CNT:-0}" -eq 0 ]; then
    MISSING_OAUTH_COLS+=("$col")
  fi
done
if [ ${#MISSING_OAUTH_COLS[@]} -eq 0 ]; then
  echo "   ✅ Колонки OAuth присутствуют / OAuth columns present"
else
  echo "   ❌ Отсутствуют колонки b24_portal_reg (${#MISSING_OAUTH_COLS[@]}): / Missing b24_portal_reg columns (${#MISSING_OAUTH_COLS[@]}):"
  for c in "${MISSING_OAUTH_COLS[@]}"; do
    echo "      - $c"
  done
  ERRORS=$((ERRORS + ${#MISSING_OAUTH_COLS[@]}))
  NEEDS_FIX=1
fi

# ---------- 5. Ключевые строки dictionary3 / Key dictionary3 strings ----------
echo "5) Проверка ключевых строк dictionary3... / Checking key dictionary3 strings..."
REQUIRED_D3_KEYS=(
  "App|typeQuest_options"
  "ReportsView|section_report_objects"
  "ReportsView|btn_add_course"
  "CreateLessonView|pickVideoFromLibrary"
  "PollTakeDialog|take_intro_until"
  "ManageThemeView|page_title"
  "ManageIPRSettingsView|role_moderator"
)
MISSING_D3=()
for entry in "${REQUIRED_D3_KEYS[@]}"; do
  COMP="${entry%%|*}"
  KEY="${entry##*|}"
  if [ "$COMP" = "App" ] && [ "$KEY" = "typeQuest_options" ]; then
    CNT=$(run_sql "SELECT COUNT(*) FROM dictionary3 WHERE COMPONENT='${COMP}' AND \`KEY\`='${KEY}';" 2>/dev/null || echo "0")
    CNT=$(echo "$CNT" | tr -d '[:space:]')
    if [ "${CNT:-0}" -gt 0 ]; then
      MISSING_D3+=("${COMP}|${KEY} (должен быть удалён / should be deleted)")
    fi
  else
    CNT=$(run_sql "SELECT COUNT(*) FROM dictionary3 WHERE COMPONENT='${COMP}' AND \`KEY\`='${KEY}';" 2>/dev/null || echo "0")
    CNT=$(echo "$CNT" | tr -d '[:space:]')
    if [ "${CNT:-0}" -eq 0 ]; then
      MISSING_D3+=("${COMP}|${KEY}")
    fi
  fi
done
if [ ${#MISSING_D3[@]} -eq 0 ]; then
  echo "   ✅ Ключевые строки dictionary3 в порядке / Key dictionary3 strings OK"
else
  echo "   ❌ Проблемы dictionary3 (${#MISSING_D3[@]}): / dictionary3 issues (${#MISSING_D3[@]}):"
  for d in "${MISSING_D3[@]}"; do
    echo "      - $d"
  done
  ERRORS=$((ERRORS + ${#MISSING_D3[@]}))
  NEEDS_FIX=1
fi

# ---------- Автофикс (однократно) / Auto-fix (once) ----------
if [ "$NEEDS_FIX" -eq 1 ] && [ "${VERIFY_DB_FIXED:-0}" = "0" ]; then
  echo ""
  echo "⚙️  Обнаружены проблемы — запускаю fix_db.sh... / Problems found — running fix_db.sh..."
  if [ -f "${SCRIPT_DIR}/fix_db.sh" ]; then
    bash "${SCRIPT_DIR}/fix_db.sh"
    FIX_EXIT=$?
    if [ "$FIX_EXIT" -ne 0 ]; then
      echo "❗ fix_db.sh завершился с ошибкой (код $FIX_EXIT) / fix_db.sh failed (exit code $FIX_EXIT)"
      exit 1
    fi
    echo ""
    echo "🔄 Повторная проверка после автофикса... / Re-checking after auto-fix..."
    VERIFY_DB_FIXED=1 exec bash "${BASH_SOURCE[0]}"
  else
    echo "❗ fix_db.sh не найден в ${SCRIPT_DIR} / fix_db.sh not found in ${SCRIPT_DIR}"
    exit 1
  fi
fi

# ---------- Итог / Summary ----------
echo "=============================="
if [ $ERRORS -eq 0 ]; then
  echo "   ✅ БД в порядке / DB is healthy"
  echo "=============================="
  exit 0
else
  echo "   ⚠️  Найдено проблем / Problems found: ${ERRORS}"
  echo ""
  echo "   Обратитесь в техническую поддержку. / Contact technical support."
  echo "=============================="
  exit 1
fi
