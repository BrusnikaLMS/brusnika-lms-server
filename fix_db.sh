#!/bin/bash
# fix_db.sh — автоматическое исправление схемы БД серверной ЛМС.
# Вызывается из verify_db.sh при обнаружении проблем.
# Создаёт недостающие таблицы, iblock-записи, ключевые переводы.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------- Конфигурация ----------
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
  echo "❗ docker compose не найден"
  exit 1
fi

DB_CONTAINER=$($DC ps -q db 2>/dev/null)
if [ -z "$DB_CONTAINER" ]; then
  echo "❗ fix_db: контейнер db не запущен"
  exit 1
fi

run_sql() {
  echo "$1" | docker exec -i "$DB_CONTAINER" \
    mariadb -uroot -p"${PASS}" "${DB}" 2>/dev/null
}

run_sql_heredoc() {
  docker exec -i "$DB_CONTAINER" \
    mariadb -uroot -p"${PASS}" "${DB}" 2>/dev/null
}

echo ""
echo "=============================="
echo "   🔧 Автофикс схемы БД"
echo "=============================="

# ---------- 1. Недостающие таблицы ----------
echo "1) Создание недостающих таблиц..."

run_sql_heredoc << 'TABLES_SQL'
CREATE TABLE IF NOT EXISTS `uni_hr_poll_template_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `active` char(1) NOT NULL DEFAULT 'Y' COMMENT 'Y/N',
  `title_ru` varchar(512) DEFAULT NULL,
  `title_en` varchar(512) DEFAULT NULL,
  `title_ua` varchar(512) DEFAULT NULL,
  `title_fr` varchar(512) DEFAULT NULL,
  `title_it` varchar(512) DEFAULT NULL,
  `title_de` varchar(512) DEFAULT NULL,
  `title_tr` varchar(512) DEFAULT NULL,
  `title_pl` varchar(512) DEFAULT NULL,
  `title_pt` varchar(512) DEFAULT NULL,
  `title_es` varchar(512) DEFAULT NULL,
  `title_vn` varchar(512) DEFAULT NULL,
  `title_zh` varchar(512) DEFAULT NULL,
  `title_ja` varchar(512) DEFAULT NULL,
  `title_kz` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Категории HR-шаблонов опросов (заголовки по языкам)';

CREATE TABLE IF NOT EXISTS `uni_hr_poll_templates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(10) unsigned NOT NULL,
  `code` varchar(64) NOT NULL COMMENT 'Стабильный id как на фронте (pulse, enps, …)',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `active` char(1) NOT NULL DEFAULT 'Y' COMMENT 'Y/N',
  `title_ru` varchar(512) DEFAULT NULL,
  `title_en` varchar(512) DEFAULT NULL,
  `title_ua` varchar(512) DEFAULT NULL,
  `title_fr` varchar(512) DEFAULT NULL,
  `title_it` varchar(512) DEFAULT NULL,
  `title_de` varchar(512) DEFAULT NULL,
  `title_tr` varchar(512) DEFAULT NULL,
  `title_pl` varchar(512) DEFAULT NULL,
  `title_pt` varchar(512) DEFAULT NULL,
  `title_es` varchar(512) DEFAULT NULL,
  `title_vn` varchar(512) DEFAULT NULL,
  `title_zh` varchar(512) DEFAULT NULL,
  `title_ja` varchar(512) DEFAULT NULL,
  `title_kz` varchar(512) DEFAULT NULL,
  `structure_ru` longtext DEFAULT NULL COMMENT 'JSON: массив секций как на фронте',
  `structure_en` longtext DEFAULT NULL,
  `structure_ua` longtext DEFAULT NULL,
  `structure_fr` longtext DEFAULT NULL,
  `structure_it` longtext DEFAULT NULL,
  `structure_de` longtext DEFAULT NULL,
  `structure_tr` longtext DEFAULT NULL,
  `structure_pl` longtext DEFAULT NULL,
  `structure_pt` longtext DEFAULT NULL,
  `structure_es` longtext DEFAULT NULL,
  `structure_vn` longtext DEFAULT NULL,
  `structure_zh` longtext DEFAULT NULL,
  `structure_ja` longtext DEFAULT NULL,
  `structure_kz` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_code` (`code`),
  KEY `idx_category_sort` (`category_id`,`sort_order`),
  CONSTRAINT `fk_hr_tpl_cat` FOREIGN KEY (`category_id`)
    REFERENCES `uni_hr_poll_template_categories` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='HR-шаблоны опросов: названия и JSON структуры по языкам';
TABLES_SQL

echo "   ✅ Таблицы созданы (если отсутствовали)"

# ---------- 2. Seed-данные: категории шаблонов HR-опросов ----------
echo "2) Seed: uni_hr_poll_template_categories..."

run_sql_heredoc << 'CATS_SQL'
INSERT IGNORE INTO `uni_hr_poll_template_categories`
  (id, sort_order, active, title_ru, title_en, title_ua, title_fr, title_it, title_de, title_tr, title_pl, title_pt, title_es, title_vn, title_zh, title_ja, title_kz)
VALUES
(1,0,'Y','Шаблоны вовлеченности (Engagement)','Engagement survey templates','Шаблони залученості (Engagement)','Modèles d\'enquêtes d\'engagement','Modelli di sondaggi sull\'engagement','Vorlagen für Engagement-Umfragen','Bağlılık anket şablonları','Szablony ankiet zaangażowania','Modelos de pesquisas de engajamento','Plantillas de encuestas de compromiso','Mẫu khảo sát gắn kết nhân viên','敬业度调研模板','エンゲージメントサーベイのテンプレート','Үйлесімділік (Engagement) сұрақнама үлгілері'),
(2,1,'Y','Климат и культура','Climate and Culture','Клімат і культура','Climat et culture','Clima e cultura','Klima und Kultur','İklim ve kültür','Klimat i kultura','Clima e cultura','Clima y cultura','Khí hậu và văn hóa','气候与文化','気候と文化','Климат және мәдениет'),
(3,2,'Y','Wellbeing и рабочая нагрузка','Wellbeing and workload','Wellbeing і робоче навантаження','Bien-être et charge de travail','Benessere e carico di lavoro','Wohlbefinden und Arbeitsbelastung','İyi oluş ve iş yükü','Dobrostan i obciążenie pracą','Bem-estar e carga de trabalho','Bienestar y carga de trabajo','Sức khỏe và khối lượng công việc','身心健康与工作负荷','ウェルビーイングと業務量','Әл-ауқат және жұмыс жүктемесі'),
(4,3,'Y','Онбординг и адаптация','Onboarding and adaptation','Онбординг та адаптація','Intégration et adaptation','Onboarding e integrazione','Onboarding und Einarbeitung','Oryantasyon ve uyum','Onboarding i adaptacja','Integração e adaptação','Incorporación y adaptación','Nhập chức và thích nghi','入职与适应','オンボーディングと適応','Онбординг және бейімделу'),
(5,4,'Y','Оценка обучения','Learning evaluation','Оцінювання навчання','Évaluation des formations','Valutazione dell\'apprendimento','Schulungsbewertung','Öğrenme değerlendirmesi','Ocena szkoleń','Avaliação da aprendizagem','Evaluación del aprendizaje','Đánh giá đào tạo','学习评估','ラーニング評価','Оқытуды бағалау'),
(6,5,'Y','Performance и развитие','Performance and development','Продуктивність і розвиток','Performance et développement','Performance e sviluppo','Leistung und Entwicklung','Performans ve gelişim','Wydajność i rozwój','Desempenho e desenvolvimento','Desempeño y desarrollo','Hiệu suất và phát triển','绩效与发展','パフォーマンスと育成','Өнімділік және даму'),
(7,6,'Y','Жизненный цикл сотрудника','Employee lifecycle','Життєвий цикл співробітника','Cycle de vie du collaborateur','Ciclo di vita del dipendente','Mitarbeiterlebenszyklus','Çalışan yaşam döngüsü','Cykl życia pracownika','Ciclo de vida do colaborador','Ciclo de vida del empleado','Vòng đời nhân viên','员工生命周期','従業員ライフサイクル','Қызметкердің өмірлік циклі'),
(8,7,'Y','Идеи и улучшения','Ideas and improvements','Ідеї та покращення','Idées et améliorations','Idee e miglioramenti','Ideen und Verbesserungen','Fikirler ve iyileştirmeler','Pomysły i usprawnienia','Ideias e melhorias','Ideas y mejoras','Ý tưởng và cải tiến','想法与改进','アイデアと改善','Идеялар мен жақсартулар');
CATS_SQL

echo "   ✅ Категории HR-шаблонов добавлены (INSERT IGNORE)"

# ---------- 3. iblock-записи и свойства (все 45 iblock) ----------
echo "3) Создание iblock-записей и свойств (iblocks_seed.sql)..."

if [ -f "${SCRIPT_DIR}/sql/iblocks_seed.sql" ]; then
  docker exec -i "$DB_CONTAINER" \
    mariadb -uroot -p"${PASS}" "${DB}" \
    < "${SCRIPT_DIR}/sql/iblocks_seed.sql" 2>/dev/null
  echo "   ✅ iblock-записи и свойства добавлены (WHERE NOT EXISTS)"
else
  echo "   ⚠️  sql/iblocks_seed.sql не найден в ${SCRIPT_DIR} — пропускаем"
fi

# ---------- 3б. Колонки OAuth в b24_portal_reg ----------
echo "3б) Колонки OAuth в b24_portal_reg (alter_b24_portal_reg_oauth.sql)..."

if [ -f "${SCRIPT_DIR}/sql/alter_b24_portal_reg_oauth.sql" ]; then
  docker exec -i "$DB_CONTAINER" \
    mariadb -uroot -p"${PASS}" "${DB}" \
    < "${SCRIPT_DIR}/sql/alter_b24_portal_reg_oauth.sql" 2>/dev/null
  echo "   ✅ Колонки OAUTH_CLIENT_ID/OAUTH_CLIENT_SECRET добавлены (IF NOT EXISTS)"
else
  echo "   ⚠️  sql/alter_b24_portal_reg_oauth.sql не найден в ${SCRIPT_DIR} — пропускаем"
fi

# ---------- 4. Фикс dictionary3 ----------
echo "4) Фикс dictionary3..."

run_sql_heredoc << 'D3_SQL'
DELETE FROM dictionary3 WHERE COMPONENT='App' AND `KEY`='typeQuest_options';

INSERT IGNORE INTO dictionary3(LANG,COMPONENT,`KEY`,TEXT) VALUES
('ru','ReportsView','section_report_objects','Объекты отчета'),
('en','ReportsView','section_report_objects','Report objects'),
('ua','ReportsView','section_report_objects','Об''єкти звіту'),
('fr','ReportsView','section_report_objects','Objets du rapport'),
('it','ReportsView','section_report_objects','Oggetti del report'),
('de','ReportsView','section_report_objects','Berichtsobjekte'),
('tr','ReportsView','section_report_objects','Rapor nesneleri'),
('pl','ReportsView','section_report_objects','Obiekty raportu'),
('pt','ReportsView','section_report_objects','Objetos do relatório'),
('es','ReportsView','section_report_objects','Objetos del informe'),
('vn','ReportsView','section_report_objects','Đối tượng báo cáo'),
('zh','ReportsView','section_report_objects','报表对象'),
('ja','ReportsView','section_report_objects','レポートオブジェクト'),
('kz','ReportsView','section_report_objects','Есеп объектілері'),
('ar','ReportsView','section_report_objects','عناصر التقرير'),
('id','ReportsView','section_report_objects','Objek laporan'),
('ms','ReportsView','section_report_objects','Objek laporan'),
('th','ReportsView','section_report_objects','วัตถุรายงาน'),
('ru','ReportsView','btn_add_course','Добавить курс'),
('en','ReportsView','btn_add_course','Add course'),
('ua','ReportsView','btn_add_course','Додати курс'),
('fr','ReportsView','btn_add_course','Ajouter un cours'),
('it','ReportsView','btn_add_course','Aggiungi corso'),
('de','ReportsView','btn_add_course','Kurs hinzufügen'),
('tr','ReportsView','btn_add_course','Kurs ekle'),
('pl','ReportsView','btn_add_course','Dodaj kurs'),
('pt','ReportsView','btn_add_course','Adicionar curso'),
('es','ReportsView','btn_add_course','Añadir curso'),
('vn','ReportsView','btn_add_course','Thêm khóa học'),
('zh','ReportsView','btn_add_course','添加课程'),
('ja','ReportsView','btn_add_course','コースを追加'),
('kz','ReportsView','btn_add_course','Курс қосу'),
('ar','ReportsView','btn_add_course','إضافة دورة'),
('id','ReportsView','btn_add_course','Tambah kursus'),
('ms','ReportsView','btn_add_course','Tambah kursus'),
('th','ReportsView','btn_add_course','เพิ่มหลักสูตร'),
('ru','CreateLessonView','pickVideoFromLibrary','Выбрать видео из медиатеки'),
('en','CreateLessonView','pickVideoFromLibrary','Pick video from media library'),
('ua','CreateLessonView','pickVideoFromLibrary','Вибрати відео з медіатеки'),
('fr','CreateLessonView','pickVideoFromLibrary','Choisir une vidéo dans la médiathèque'),
('it','CreateLessonView','pickVideoFromLibrary','Scegli un video dalla libreria multimediale'),
('de','CreateLessonView','pickVideoFromLibrary','Video aus der Mediathek auswählen'),
('tr','CreateLessonView','pickVideoFromLibrary','Medya kütüphanesinden video seç'),
('pl','CreateLessonView','pickVideoFromLibrary','Wybierz wideo z biblioteki mediów'),
('pt','CreateLessonView','pickVideoFromLibrary','Escolher vídeo da biblioteca de mídia'),
('es','CreateLessonView','pickVideoFromLibrary','Elegir vídeo de la biblioteca de medios'),
('vn','CreateLessonView','pickVideoFromLibrary','Chọn video từ thư viện phương tiện'),
('zh','CreateLessonView','pickVideoFromLibrary','从媒体库选择视频'),
('ja','CreateLessonView','pickVideoFromLibrary','メディアライブラリから動画を選択'),
('kz','CreateLessonView','pickVideoFromLibrary','Медиатекадан бейне таңдаңыз'),
('ar','CreateLessonView','pickVideoFromLibrary','اختر فيديو من مكتبة الوسائط'),
('id','CreateLessonView','pickVideoFromLibrary','Pilih video dari perpustakaan media'),
('ms','CreateLessonView','pickVideoFromLibrary','Pilih video dari perpustakaan media'),
('th','CreateLessonView','pickVideoFromLibrary','เลือกวิดีโอจากคลังสื่อ'),
('ru','PollTakeDialog','take_intro_until','Срок до'),
('en','PollTakeDialog','take_intro_until','Deadline'),
('ua','PollTakeDialog','take_intro_until','Термін до'),
('fr','PollTakeDialog','take_intro_until','Date limite'),
('it','PollTakeDialog','take_intro_until','Scadenza'),
('de','PollTakeDialog','take_intro_until','Frist bis'),
('tr','PollTakeDialog','take_intro_until','Son tarih'),
('pl','PollTakeDialog','take_intro_until','Termin do'),
('pt','PollTakeDialog','take_intro_until','Prazo até'),
('es','PollTakeDialog','take_intro_until','Fecha límite'),
('vn','PollTakeDialog','take_intro_until','Hạn đến'),
('zh','PollTakeDialog','take_intro_until','截止日期'),
('ja','PollTakeDialog','take_intro_until','回答期限'),
('kz','PollTakeDialog','take_intro_until','Мерзімі'),
('ar','PollTakeDialog','take_intro_until','الموعد النهائي'),
('id','PollTakeDialog','take_intro_until','Batas waktu'),
('ms','PollTakeDialog','take_intro_until','Tarikh akhir'),
('th','PollTakeDialog','take_intro_until','กำหนดส่ง'),
('ru','ManageThemeView','page_title','Тема и брендинг'),
('en','ManageThemeView','page_title','Theme & Branding'),
('ua','ManageThemeView','page_title','Тема та брендинг'),
('fr','ManageThemeView','page_title','Thème et image de marque'),
('it','ManageThemeView','page_title','Tema e branding'),
('de','ManageThemeView','page_title','Design und Branding'),
('tr','ManageThemeView','page_title','Tema ve Marka'),
('pl','ManageThemeView','page_title','Motyw i branding'),
('pt','ManageThemeView','page_title','Tema e marca'),
('es','ManageThemeView','page_title','Tema y marca'),
('vn','ManageThemeView','page_title','Giao diện và thương hiệu'),
('zh','ManageThemeView','page_title','主题与品牌'),
('ja','ManageThemeView','page_title','テーマとブランディング'),
('kz','ManageThemeView','page_title','Тақырып және брендинг'),
('ar','ManageThemeView','page_title','السمة والعلامة التجارية'),
('id','ManageThemeView','page_title','Tema & Branding'),
('ms','ManageThemeView','page_title','Tema & Penjenamaan'),
('th','ManageThemeView','page_title','ธีมและแบรนด์'),
('ru','ManageIPRSettingsView','role_moderator','Модератор'),
('en','ManageIPRSettingsView','role_moderator','Moderator'),
('ua','ManageIPRSettingsView','role_moderator','Модератор'),
('fr','ManageIPRSettingsView','role_moderator','Modérateur'),
('it','ManageIPRSettingsView','role_moderator','Moderatore'),
('de','ManageIPRSettingsView','role_moderator','Moderator'),
('tr','ManageIPRSettingsView','role_moderator','Moderatör'),
('pl','ManageIPRSettingsView','role_moderator','Moderator'),
('pt','ManageIPRSettingsView','role_moderator','Moderador'),
('es','ManageIPRSettingsView','role_moderator','Moderador'),
('vn','ManageIPRSettingsView','role_moderator','Người điều hành'),
('zh','ManageIPRSettingsView','role_moderator','管理员'),
('ja','ManageIPRSettingsView','role_moderator','モデレーター'),
('kz','ManageIPRSettingsView','role_moderator','Модератор'),
('ar','ManageIPRSettingsView','role_moderator','مشرف'),
('id','ManageIPRSettingsView','role_moderator','Moderator'),
('ms','ManageIPRSettingsView','role_moderator','Penyederhana'),
('th','ManageIPRSettingsView','role_moderator','ผู้ดูแล');
D3_SQL

echo "   ✅ dictionary3 исправлен"

# ---------- 5. Seed шаблонов HR-опросов ----------
echo "5) Seed шаблонов HR-опросов (survey_templates_seed.sql)..."

if [ -f "${SCRIPT_DIR}/sql/survey_templates_seed.sql" ]; then
  docker exec -i "$DB_CONTAINER" \
    mariadb -uroot -p"${PASS}" "${DB}" \
    < "${SCRIPT_DIR}/sql/survey_templates_seed.sql" 2>/dev/null
  COUNT=$(run_sql "SELECT COUNT(*) FROM uni_hr_poll_templates;" | tail -1)
  echo "   ✅ Шаблоны импортированы: ${COUNT} шт."
else
  echo "   ⚠️  sql/survey_templates_seed.sql не найден — пропускаем"
fi

# ---------- 6. Фикс заголовков карточек быстрого доступа "Отчеты" ----------
echo "6) Фикс mn_report_type_N_title/_desc (fix_report_menu_labels.sql)..."

if [ -f "${SCRIPT_DIR}/sql/fix_report_menu_labels.sql" ]; then
  docker exec -i "$DB_CONTAINER" \
    mariadb -uroot -p"${PASS}" "${DB}" \
    < "${SCRIPT_DIR}/sql/fix_report_menu_labels.sql" 2>/dev/null
  echo "   ✅ Заголовки карточек отчётов синхронизированы"
else
  echo "   ⚠️  sql/fix_report_menu_labels.sql не найден — пропускаем"
fi

# ---------- 7. Отсутствующие переводы карточек "Назначения" ----------
echo "7) Фикс mn_assign_programs_*/mn_monitor_assignments_* (fix_missing_assign_translations.sql)..."

if [ -f "${SCRIPT_DIR}/sql/fix_missing_assign_translations.sql" ]; then
  docker exec -i "$DB_CONTAINER" \
    mariadb -uroot -p"${PASS}" "${DB}" \
    < "${SCRIPT_DIR}/sql/fix_missing_assign_translations.sql" 2>/dev/null
  echo "   ✅ Переводы карточек Назначений добавлены (INSERT IGNORE)"
else
  echo "   ⚠️  sql/fix_missing_assign_translations.sql не найден — пропускаем"
fi

echo ""
echo "=============================="
echo "   ✅ Автофикс завершён"
echo "=============================="
