#!/bin/bash

# ============================================================
# SETUP.SH — Интерактивная настройка Brusnika LMS server-version
# SETUP.SH — Interactive configuration for Brusnika LMS (server-version)
# ============================================================
#   Запрашивает 3 домена (LMS, H5P, cforj), БД, опционально
#   копирует сгенерированные nginx-конфиги в /etc/nginx и
#   перезагружает nginx.
#   Prompts for 3 domains (LMS, H5P, cforj) and DB credentials,
#   optionally copies the generated nginx configs into /etc/nginx
#   and reloads nginx.
# ============================================================

set -e

# --- Пути / Paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

# --- Цвета / Colors ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error()   { echo -e "${RED}❌ $1${NC}"; }

echo ""
echo "=============================================="
echo "   🔧 Brusnika LMS — интерактивная настройка"
echo "   🔧 Brusnika LMS — interactive setup"
echo "=============================================="
echo ""

# ============================================================
# 1. ДОМЕНЫ / DOMAINS
# ============================================================
echo "📌 ШАГ 1. Домены / STEP 1. Domains"
echo "-------------------------------------------"
info "Для закрытого контура Банка указывайте внутренние домены. / For an air-gapped Bank perimeter, use internal domain names."
info "Все три домена должны резолвиться и иметь SSL-сертификаты. / All three domains must resolve and must have SSL certificates."
echo ""

read -p "Домен LMS (например: lms.bank.local) / LMS domain (e.g. lms.bank.local): " DOMAIN
[ -z "$DOMAIN" ] && { error "Домен LMS обязателен / LMS domain is required"; exit 1; }

read -p "Домен H5P  (например: h5p.bank.local) / H5P domain (e.g. h5p.bank.local): " H5P_DOMAIN
[ -z "$H5P_DOMAIN" ] && { error "Домен H5P обязателен / H5P domain is required"; exit 1; }

read -p "Домен cforj (например: cforj.bank.local) / cforj domain (e.g. cforj.bank.local): " CFORJ_DOMAIN
[ -z "$CFORJ_DOMAIN" ] && { error "Домен cforj обязателен / cforj domain is required"; exit 1; }

echo ""
success "LMS   = ${DOMAIN}"
success "H5P   = ${H5P_DOMAIN}"
success "cforj = ${CFORJ_DOMAIN}"
echo ""

# ============================================================
# 2. БД / DATABASE
# ============================================================
echo "📌 ШАГ 2. База данных LMS (MariaDB) / STEP 2. LMS database (MariaDB)"
echo "-------------------------------------------"

read -p "Использовать настройки БД по умолчанию? / Use default DB settings? (Y/n): " USE_DEFAULT_DB
USE_DEFAULT_DB=${USE_DEFAULT_DB:-Y}

if [[ "$USE_DEFAULT_DB" =~ ^[Yy]$ ]]; then
    MYSQL_ROOT_PASSWORD="root"
    MYSQL_DATABASE="brusnika-lms-server"
    MYSQL_USER="lms"
    MYSQL_PASSWORD="lms"
    info "Используются настройки по умолчанию / Using default settings"
else
    read -p "MYSQL_ROOT_PASSWORD [root]: " MYSQL_ROOT_PASSWORD
    MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-root}
    read -p "MYSQL_DATABASE [brusnika-lms-server]: " MYSQL_DATABASE
    MYSQL_DATABASE=${MYSQL_DATABASE:-brusnika-lms-server}
    read -p "MYSQL_USER [lms]: " MYSQL_USER
    MYSQL_USER=${MYSQL_USER:-lms}
    read -p "MYSQL_PASSWORD [lms]: " MYSQL_PASSWORD
    MYSQL_PASSWORD=${MYSQL_PASSWORD:-lms}
fi

# Секреты cforj / cforj secrets
CFORJ_POSTGRES_PASSWORD=$(openssl rand -hex 16 2>/dev/null || echo "cforjpass$RANDOM")
CFORJ_SECRET_KEY=$(openssl rand -hex 32 2>/dev/null || echo "cforjsecret$RANDOM$RANDOM")

echo ""

# ============================================================
# 3. КОРНЕВОЙ .env / ROOT .env
# ============================================================
echo "📌 ШАГ 3. Генерация .env и конфигов / STEP 3. Generating .env and config files"
echo "-------------------------------------------"

cat > "$SCRIPT_DIR/.env" << EOF
# ============================================================
# База данных LMS (MariaDB) / LMS database (MariaDB)
# ============================================================
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_DATABASE=${MYSQL_DATABASE}
MYSQL_USER=${MYSQL_USER}
MYSQL_PASSWORD=${MYSQL_PASSWORD}

# ============================================================
# Домены (закрытый контур банка) / Domains (Bank air-gapped perimeter)
# ============================================================
DOMAIN=${DOMAIN}
H5P_DOMAIN=${H5P_DOMAIN}
CFORJ_DOMAIN=${CFORJ_DOMAIN}

# ============================================================
# Build-args для Quasar-сборки LMS / Build-args for the Quasar LMS build
# ============================================================
SERVER_VERSION=Y
SHOW_NEW_UI=Y
APIURL=https://${DOMAIN}/
APP_SERVER_URL=https://${DOMAIN}/
H5P_BASE=https://${H5P_DOMAIN}/
CFORJ_DEFAULT_BASE_URL=https://${CFORJ_DOMAIN}/

# ============================================================
# cforj
# ============================================================
CFORJ_POSTGRES_PASSWORD=${CFORJ_POSTGRES_PASSWORD}
CFORJ_SECRET_KEY=${CFORJ_SECRET_KEY}
EOF
success "Создан / Created: .env"

# ============================================================
# 4. lms/.env
# ============================================================
mkdir -p "$SCRIPT_DIR/lms"
cat > "$SCRIPT_DIR/lms/.env" << EOF
HOST=${DOMAIN}
LMS_SERVICE=lms-service

APIURL=https://${DOMAIN}/
APP_SERVER_URL=https://${DOMAIN}/
H5P_BASE=https://${H5P_DOMAIN}/
CFORJ_DEFAULT_BASE_URL=https://${CFORJ_DOMAIN}/

SERVER_VERSION=Y
SHOW_NEW_UI=Y
EOF
success "Создан / Created: lms/.env"

# ============================================================
# 5. lms/local/include/constants.php
# ============================================================
mkdir -p "$SCRIPT_DIR/lms/local/include"
APP_AUTH_CODE=$(openssl rand -hex 16 2>/dev/null || echo "authcode$RANDOM$RANDOM")

cat > "$SCRIPT_DIR/lms/local/include/constants.php" << EOF
<?php
/**
 * Constants configuration — сгенерировано setup.sh / generated by setup.sh
 * ВАЖНО: заполните APP_ID и APP_SECRET_CODE из Битрикс24!
 * IMPORTANT: fill in APP_ID and APP_SECRET_CODE from Bitrix24!
 */

// ============================================================
// ЗАПОЛНИТЕ ВРУЧНУЮ — данные локального приложения Битрикс24
// FILL IN MANUALLY — Bitrix24 local application credentials
// ============================================================
define('APP_ID', 'ВАШ_CLIENT_ID');
define('APP_SECRET_CODE', 'ВАШ_CLIENT_SECRET');

// ============================================================
// АВТОМАТИЧЕСКИ / AUTO-GENERATED
// ============================================================
define('APP_REG_URL', 'https://${DOMAIN}/index.php');
define('APP_AUTH_CODE', '${APP_AUTH_CODE}');
define('APP_DEBUG_MODE', 'N');

define('APP_SERVER_URL', 'https://${DOMAIN}/');
define('APP_TARIFF_URL', 'https://${DOMAIN}/');
define('APP_SERVER_NAME', 'LMS');

define('H5P_BASE', 'https://${H5P_DOMAIN}/');
define('CFORJ_DEFAULT_BASE_URL', 'https://${CFORJ_DOMAIN}/');

define('TARIFF_AUTH_CODE', '');
define('EXT_URL', 'https://${DOMAIN}/');
define('EXT_AUTH_CODE', '');
define('EXT_APP_ID', 'LMS');

define('LMS_URLS', [
    'server'  => 'https://${DOMAIN}/',
    'h5p'     => 'https://${H5P_DOMAIN}/',
    'cforj'   => 'https://${CFORJ_DOMAIN}/',
    'ext_url' => 'https://${DOMAIN}/',
]);

define('TARIFF_URLS', []);
define('LMS_AUTH',    ['ext_auth'    => '']);
define('TARIFF_AUTH', ['tariff_auth' => '']);
define('PRE_INSTALL_ACCOUNTS', []);
EOF
success "Создан / Created: lms/local/include/constants.php"
warning "Не забудьте заполнить APP_ID и APP_SECRET_CODE в constants.php! / Do not forget to fill in APP_ID and APP_SECRET_CODE in constants.php!"

# ============================================================
# 6. lms/local/include/config.php
# ============================================================
cat > "$SCRIPT_DIR/lms/local/include/config.php" << 'CONFIGEOF'
<?php
// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

global $config;
$config = array(
    "db" => array(
CONFIGEOF

cat >> "$SCRIPT_DIR/lms/local/include/config.php" << EOF
        "host" => "db",
        "user" => "${MYSQL_USER}",
        "pass" => "${MYSQL_PASSWORD}",
        "db"   => "${MYSQL_DATABASE}",
        "port" => "3306"
EOF

cat >> "$SCRIPT_DIR/lms/local/include/config.php" << 'CONFIGEOF'
    ),
    "routes" => array (
        "_404"         => "404.php",
        "/index.php"   => "main",
        "/install.php" => "install",
    ),
    "events" => array(
        "OnAppUninstall",
        "OnAppPayment",
        "onuseradd",
        "ONSONETGROUPDELETE",
        "ONSONETGROUPUPDATE",
        "ONSONETGROUPADD"
    )
);
CONFIGEOF
success "Создан / Created: lms/local/include/config.php"

# ============================================================
# 7. ВНЕШНИЕ NGINX-КОНФИГИ (nginx-external/) / EXTERNAL NGINX CONFIGS (nginx-external/)
# ============================================================
mkdir -p "$SCRIPT_DIR/nginx-external"

make_nginx_conf() {
    local name="$1"     # домен / domain
    local upstream="$2" # backend (LMS: https://127.0.0.1:8443, cforj/h5p тоже 8443 — всё через внутренний nginx по SNI)
                        # backend (LMS/cforj/h5p are all multiplexed via the internal nginx on :8443 by SNI)
    cat > "$SCRIPT_DIR/nginx-external/${name}.conf" << EOF
# ${name} — внешний nginx -> внутренний контейнер lms на 8443
# ${name} — external nginx -> internal lms container on :8443
server {
    listen 80;
    server_name ${name};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${name};

    ssl_certificate     /etc/nginx/ssl/${name}.crt;
    ssl_certificate_key /etc/nginx/ssl/${name}.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    client_max_body_size 512M;

    location / {
        proxy_pass         ${upstream};
        proxy_ssl_server_name on;
        proxy_ssl_name     ${name};
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port  443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
EOF
    success "Сгенерирован / Generated: nginx-external/${name}.conf"
}

make_nginx_conf "${DOMAIN}"       "https://127.0.0.1:8443"
make_nginx_conf "${H5P_DOMAIN}"   "https://127.0.0.1:8443"
make_nginx_conf "${CFORJ_DOMAIN}" "https://127.0.0.1:8443"

# ============================================================
# 8. АВТОКОПИРОВАНИЕ В СИСТЕМНЫЙ NGINX / AUTO-COPY TO SYSTEM NGINX
# ============================================================
echo ""
if [ -d "$NGINX_SITES_AVAILABLE" ] && [ -d "$NGINX_SITES_ENABLED" ]; then
    read -p "Скопировать конфиги в ${NGINX_SITES_AVAILABLE} и активировать? / Copy configs into ${NGINX_SITES_AVAILABLE} and enable them? (Y/n): " DO_NGINX
    DO_NGINX=${DO_NGINX:-Y}
    if [[ "$DO_NGINX" =~ ^[Yy]$ ]]; then
        if [ "$EUID" -ne 0 ]; then
            warning "Нужны права root — перезапустите setup.sh под sudo, либо скопируйте конфиги вручную. / Root privileges required — re-run setup.sh with sudo, or copy the configs manually."
        else
            for d in "${DOMAIN}" "${H5P_DOMAIN}" "${CFORJ_DOMAIN}"; do
                cp -f "$SCRIPT_DIR/nginx-external/${d}.conf" "${NGINX_SITES_AVAILABLE}/${d}.conf"
                ln -sf "${NGINX_SITES_AVAILABLE}/${d}.conf" "${NGINX_SITES_ENABLED}/${d}.conf"
                success "Активирован / Enabled: ${d}.conf"
            done
            if nginx -t 2>/dev/null; then
                systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
                success "nginx перезагружен / nginx reloaded"
            else
                warning "nginx -t завершился с ошибкой — проверьте конфиги вручную / nginx -t failed — please check the configs manually"
            fi
        fi
    fi
else
    info "Системный nginx не обнаружен (${NGINX_SITES_AVAILABLE} отсутствует) — пропускаю автокопирование. / System nginx not detected (${NGINX_SITES_AVAILABLE} missing) — skipping auto-copy."
    info "Внутренний nginx в docker-compose всё равно будет работать на :8443. / The internal docker-compose nginx will still serve on :8443."
fi

# ============================================================
# 8.5. ПАТЧ КОНФИГОВ В conf.d — добавить client_max_body_size
# 8.5. PATCH conf.d CONFIGS — add client_max_body_size
# ============================================================
if [ -d "/etc/nginx/conf.d" ] && [ "$EUID" -eq 0 ]; then
    PATCHED_COUNT=0
    for conf in /etc/nginx/conf.d/*.conf; do
        [ -f "$conf" ] || continue
        MATCHED=false
        for d in "${DOMAIN}" "${H5P_DOMAIN}" "${CFORJ_DOMAIN}"; do
            if grep -qF "$d" "$conf"; then
                MATCHED=true
                break
            fi
        done
        if $MATCHED; then
            if grep -q "client_max_body_size" "$conf"; then
                info "$(basename "$conf"): client_max_body_size уже задан — пропускаем / already set — skipping"
            else
                awk '!inserted && /^[[:space:]]*location[[:space:]]/ { print "    client_max_body_size 512M;" ; inserted=1 } { print }' \
                    "$conf" > "${conf}.tmp" && mv "${conf}.tmp" "$conf"
                success "Добавлен client_max_body_size 512M в $(basename "$conf") / Added client_max_body_size 512M to $(basename "$conf")"
                PATCHED_COUNT=$((PATCHED_COUNT + 1))
            fi
        fi
    done
    if [ "$PATCHED_COUNT" -gt 0 ]; then
        if nginx -t 2>/dev/null; then
            systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
            success "nginx перезагружен (обновлены conf.d конфиги) / nginx reloaded (conf.d configs updated)"
        else
            warning "nginx -t завершился с ошибкой после патча conf.d — проверьте конфиги вручную / nginx -t failed after patching conf.d — please check the configs manually"
        fi
    fi
fi

# ============================================================
# 9. SSL-ПРОВЕРКА / SSL CHECK
# ============================================================
echo ""
echo "📌 ШАГ 4. Проверка SSL-сертификатов / STEP 4. SSL certificate check"
echo "-------------------------------------------"

SSL_OK=true
for d in "${DOMAIN}" "${H5P_DOMAIN}" "${CFORJ_DOMAIN}"; do
    if [ -f "$SCRIPT_DIR/ssl/${d}.crt" ] && [ -f "$SCRIPT_DIR/ssl/${d}.key" ]; then
        success "SSL ${d}: OK"
    else
        warning "SSL ${d}: НЕТ (ожидается ssl/${d}.crt и ssl/${d}.key) / MISSING (expected ssl/${d}.crt and ssl/${d}.key)"
        SSL_OK=false
    fi
done

# ============================================================
# 10. ИТОГО / SUMMARY
# ============================================================
echo ""
echo "=============================================="
echo "   📋 ИТОГО / SUMMARY"
echo "=============================================="
echo ""
echo "Созданные файлы / Files created:"
echo "  ✅ .env"
echo "  ✅ lms/.env"
echo "  ✅ lms/local/include/constants.php"
echo "  ✅ lms/local/include/config.php"
echo "  ✅ nginx-external/${DOMAIN}.conf"
echo "  ✅ nginx-external/${H5P_DOMAIN}.conf"
echo "  ✅ nginx-external/${CFORJ_DOMAIN}.conf"
echo ""

if [ "$SSL_OK" = false ]; then
    warning "SSL-сертификаты не найдены — положите их в ssl/ до запуска install.sh / SSL certificates are missing — place them in ssl/ before running install.sh"
fi

echo "Следующие шаги / Next steps:"
echo "  1. Заполните APP_ID/APP_SECRET_CODE: nano lms/local/include/constants.php / Fill in APP_ID/APP_SECRET_CODE: nano lms/local/include/constants.php"
echo "  2. Положите ssl/${DOMAIN}.{crt,key}, ssl/${H5P_DOMAIN}.{crt,key}, ssl/${CFORJ_DOMAIN}.{crt,key} / Place the same SSL files"
echo "  3. Запустите: ./install.sh / Run: ./install.sh"
echo ""
success "Настройка завершена / Setup complete"
echo "=============================================="
