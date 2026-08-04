-- ============================================================
-- iblocks_seed.sql — создание всех iblock-записей и свойств
-- Идемпотентно: WHERE NOT EXISTS на code / iblock_id+code
-- ============================================================

SET FOREIGN_KEY_CHECKS=0;

-- ── 1. Создание отсутствующих iblock-записей ───────────────

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Настройки','uni_options','Настройки',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_options');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Файлы','uni_files','Файлы',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_files');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Открытые вопросы','uni_opens','Открытые вопросы',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_opens');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Курсы юзеров','uni_ucourses','Курсы юзеров',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_ucourses');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Тесты юзеров','uni_utests','Тесты юзеров',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_utests');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Комментарии','uni_comments','Комментарии',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_comments');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Анкеты','uni_aos','Анкеты',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_aos');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Оценка 360','uni_meth360180','Оценка 360',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_meth360180');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Тесты','uni_tests','Тесты',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_tests');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Курсы','uni_courses','Курсы',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_courses');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Уроки','uni_lessons','Уроки',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_lessons');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Уроки юзеров','uni_ulessons','Уроки юзеров',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_ulessons');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Назначения','uni_schedules','Назначения',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_schedules');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Уведомления в ЛК','uni_notifs','Уведомления в ЛК',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_notifs');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Заявки','uni_bids','Заявки',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_bids');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Мероприятия','uni_events','Мероприятия',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_events');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Личные назначения','uni_uprogscheds','Личные назначения',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_uprogscheds');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Оценки 360','uni_degree360','Оценки 360',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_degree360');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Назначения Оценки 360','uni_udegree360','Назначения Оценки 360',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_udegree360');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Задания на Оценку 360','uni_tdegree360','Задания на Оценку 360',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_tdegree360');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Субаккаунты','uni_subaccounts','Субаккаунты',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_subaccounts');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Рейтинги сущностей','uni_rating','Рейтинги сущностей',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_rating');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Статистика по юзеру','uni_userstat','Статистика по юзеру',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_userstat');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Опросы в событиях','uni_quizevent','Опросы в событиях',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_quizevent');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Полки','uni_shelves','Полки',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_shelves');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Материалы','uni_items','Материалы',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_items');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Связь Материал-сущность','uni_items_own','Связь Материал-сущность',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_items_own');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Привязки опросов','uni_poll_bindings','Привязки опросов',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_poll_bindings');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Права доступа к сущностям','uni_access_rights','Права доступа к сущностям',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_access_rights');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Подписки на материалы каталога','uni_item_subs','Подписки на материалы каталога',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_item_subs');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Категории магазина подарков','uni_gifts_cats','Категории магазина подарков',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_gifts_cats');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Товары магазина подарков','uni_gifts','Товары магазина подарков',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_gifts');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Шаблоны проверки открытых вопросов (Nika.AI)','uni_opens_templates','Шаблоны проверки открытых вопросов (Nika.AI)',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_opens_templates');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Push-подписки PWA','uni_pushsubs','Push-подписки PWA',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_pushsubs');

-- Эти 11 iblock-записей отсутствовали, хотя CALL add_prop(...) для них ниже уже были —
-- на установке "с нуля" их свойства молча не создавались (JOIN по несуществующему iblock.code).
INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Профиль сотрудника','uni_profile','Профиль сотрудника',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_profile');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Компетенции','uni_competence','Компетенции',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_competence');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Программы','uni_programs','Программы',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_programs');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Назначения из программ','uni_progscheds','Назначения из программ',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_progscheds');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Опросы','uni_quiz','Опросы',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_quiz');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Сообщения в ленту','uni_message','Сообщения в ленту',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_message');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'просмотры Материала','uni_items_checks','просмотры Материала',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_items_checks');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Опросы (новый конструктор)','uni_polls','Опросы (новый конструктор)',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_polls');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Результаты опросов','uni_poll_submissions','Результаты опросов',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_poll_submissions');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT NULL,'Поделились объектом из каталога','uni_catalog_shares','Поделились объектом из каталога',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_catalog_shares');

INSERT INTO iblock (portal_id, title, code, description, date_create)
SELECT 1,'Заявки магазина подарков','uni_gifts_requests','Заявки магазина подарков',NOW() WHERE NOT EXISTS (SELECT 1 FROM iblock WHERE code='uni_gifts_requests');

-- ── 2. Вспомогательная процедура-макрос: добавить свойство если нет ──
-- Используем INSERT ... SELECT с NOT EXISTS вместо процедур

-- Макрос: INSERT prop WHERE NOT EXISTS
-- Шаблон: CALL add_prop('iblock_code', 'uf_prop_code', 'title');
-- Реализован через повторяющийся INSERT ... SELECT

DROP PROCEDURE IF EXISTS add_prop;
DELIMITER $$
CREATE PROCEDURE add_prop(IN ib_code VARCHAR(50), IN prop_code VARCHAR(64), IN prop_title VARCHAR(255))
BEGIN
  INSERT INTO iblock_property (iblock_id, code, title, description, type, entity, multiple, required, service, link_iblock_id, date_create)
  SELECT ib.id, prop_code, prop_title, prop_title, 'string', 'element', 'N', 'N', 'N', NULL, NOW()
  FROM iblock ib
  WHERE ib.code = ib_code
    AND NOT EXISTS (
      SELECT 1 FROM iblock_property ip
      WHERE ip.iblock_id = ib.id AND ip.code = prop_code
    );
END$$
DELIMITER ;

-- ── 3. Базовые свойства для ВСЕХ iblock (7 полей) ─────────

-- uni_profile
CALL add_prop('uni_profile','uf_key','Client key');
CALL add_prop('uni_profile','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_profile','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_profile','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_profile','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_profile','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_profile','uf_STUFF','STUFF');
CALL add_prop('uni_profile','uf_PROPERTY_points','баллы');
CALL add_prop('uni_profile','uf_PROPERTY_user','сотрудник');
CALL add_prop('uni_profile','uf_PROPERTY_certs','сертификаты');
CALL add_prop('uni_profile','uf_PROPERTY_name','Имя');
CALL add_prop('uni_profile','uf_PROPERTY_second_name','Отчество');
CALL add_prop('uni_profile','uf_PROPERTY_last_name','Фамилия');
CALL add_prop('uni_profile','uf_PROPERTY_departments','Подразделения');
CALL add_prop('uni_profile','uf_PROPERTY_work_position','Должность');
CALL add_prop('uni_profile','uf_PROPERTY_user_origin','Источник пользователя LMS (sa | crm | external)');
CALL add_prop('uni_profile','uf_PROPERTY_custom_profile_fields','Кастомные поля профиля');

-- uni_options
CALL add_prop('uni_options','uf_key','Client key');
CALL add_prop('uni_options','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_options','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_options','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_options','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_options','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_options','uf_STUFF','STUFF');

-- uni_files
CALL add_prop('uni_files','uf_key','Client key');
CALL add_prop('uni_files','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_files','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_files','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_files','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_files','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_files','uf_STUFF','STUFF');
CALL add_prop('uni_files','uf_PROPERTY_type','Тип файла');

-- uni_opens
CALL add_prop('uni_opens','uf_key','Client key');
CALL add_prop('uni_opens','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_opens','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_opens','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_opens','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_opens','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_opens','uf_STUFF','STUFF');

-- uni_ucourses
CALL add_prop('uni_ucourses','uf_key','Client key');
CALL add_prop('uni_ucourses','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_ucourses','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_ucourses','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_ucourses','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_ucourses','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_ucourses','uf_STUFF','STUFF');

-- uni_utests
CALL add_prop('uni_utests','uf_key','Client key');
CALL add_prop('uni_utests','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_utests','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_utests','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_utests','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_utests','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_utests','uf_STUFF','STUFF');

-- uni_comments
CALL add_prop('uni_comments','uf_key','Client key');
CALL add_prop('uni_comments','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_comments','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_comments','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_comments','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_comments','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_comments','uf_STUFF','STUFF');

-- uni_aos
CALL add_prop('uni_aos','uf_key','Client key');
CALL add_prop('uni_aos','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_aos','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_aos','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_aos','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_aos','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_aos','uf_STUFF','STUFF');

-- uni_competence
CALL add_prop('uni_competence','uf_key','Client key');
CALL add_prop('uni_competence','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_competence','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_competence','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_competence','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_competence','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_competence','uf_STUFF','STUFF');

-- uni_meth360180
CALL add_prop('uni_meth360180','uf_key','Client key');
CALL add_prop('uni_meth360180','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_meth360180','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_meth360180','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_meth360180','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_meth360180','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_meth360180','uf_STUFF','STUFF');
CALL add_prop('uni_meth360180','uf_PROPERTY_persona','Оцениваемый');
CALL add_prop('uni_meth360180','uf_PROPERTY_experts','Оценивающие');
CALL add_prop('uni_meth360180','uf_PROPERTY_scores','Результаты');
CALL add_prop('uni_meth360180','uf_PROPERTY_flags','Флаги');
CALL add_prop('uni_meth360180','uf_PROPERTY_type','Тип');
CALL add_prop('uni_meth360180','uf_DATE_ACTIVE_FROM','Начало');
CALL add_prop('uni_meth360180','uf_DATE_ACTIVE_TO','Начало');

-- uni_tests
CALL add_prop('uni_tests','uf_key','Client key');
CALL add_prop('uni_tests','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_tests','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_tests','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_tests','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_tests','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_tests','uf_STUFF','STUFF');
CALL add_prop('uni_tests','uf_PROPERTY_thematics','Тематика');
CALL add_prop('uni_tests','uf_PROPERTY_description','Описание');
CALL add_prop('uni_tests','uf_PROPERTY_level','Уровень сложности');
CALL add_prop('uni_tests','uf_PROPERTY_interval','Интервал тестирования');
CALL add_prop('uni_tests','uf_PROPERTY_todisplay','Кол-во вопросов к показу');
CALL add_prop('uni_tests','uf_PROPERTY_score','Проходной процент');
CALL add_prop('uni_tests','uf_PROPERTY_time','Время на тест');
CALL add_prop('uni_tests','uf_PROPERTY_type','Тип теста');
CALL add_prop('uni_tests','uf_PROPERTY_questions','устарело');
CALL add_prop('uni_tests','uf_PROPERTY_answers','устарело');
CALL add_prop('uni_tests','uf_PROPERTY_show_results','Как показывать результаты');
CALL add_prop('uni_tests','uf_PROPERTY_no_prev','Не возращаться');
CALL add_prop('uni_tests','uf_PROPERTY_flags','Флаги');
CALL add_prop('uni_tests','uf_PROPERTY_blocks','Блоки');

-- uni_courses
CALL add_prop('uni_courses','uf_key','Client key');
CALL add_prop('uni_courses','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_courses','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_courses','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_courses','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_courses','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_courses','uf_STUFF','STUFF');
CALL add_prop('uni_courses','uf_PROPERTY_target','Цель курса');
CALL add_prop('uni_courses','uf_PROPERTY_duration','Длительность');
CALL add_prop('uni_courses','uf_PROPERTY_program','Программа');
CALL add_prop('uni_courses','uf_PROPERTY_course','Последовательность уроков и тестов');
CALL add_prop('uni_courses','uf_PROPERTY_rating','Рейтинг курса');
CALL add_prop('uni_courses','uf_PROPERTY_thematics','Тематика');
CALL add_prop('uni_courses','uf_PROPERTY_flags','Флаги');

-- uni_lessons
CALL add_prop('uni_lessons','uf_key','Client key');
CALL add_prop('uni_lessons','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_lessons','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_lessons','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_lessons','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_lessons','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_lessons','uf_STUFF','STUFF');
CALL add_prop('uni_lessons','uf_PROPERTY_youtube','youtube');
CALL add_prop('uni_lessons','uf_PROPERTY_files','Файлы');
CALL add_prop('uni_lessons','uf_PROPERTY_flags','Флаги');
CALL add_prop('uni_lessons','uf_PROPERTY_link1','link1');
CALL add_prop('uni_lessons','uf_PROPERTY_link2','link2');
CALL add_prop('uni_lessons','uf_PROPERTY_link3','link3');
CALL add_prop('uni_lessons','uf_PROPERTY_link4','link4');
CALL add_prop('uni_lessons','uf_PROPERTY_link5','link5');
CALL add_prop('uni_lessons','uf_PROPERTY_link6','link6');
CALL add_prop('uni_lessons','uf_PROPERTY_link7','link7');
CALL add_prop('uni_lessons','uf_PROPERTY_link8','link8');
CALL add_prop('uni_lessons','uf_PROPERTY_link9','link9');
CALL add_prop('uni_lessons','uf_PROPERTY_link10','link10');

-- uni_ulessons
CALL add_prop('uni_ulessons','uf_key','Client key');
CALL add_prop('uni_ulessons','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_ulessons','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_ulessons','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_ulessons','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_ulessons','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_ulessons','uf_STUFF','STUFF');

-- uni_schedules
CALL add_prop('uni_schedules','uf_key','Client key');
CALL add_prop('uni_schedules','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_schedules','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_schedules','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_schedules','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_schedules','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_schedules','uf_STUFF','STUFF');

-- uni_notifs
CALL add_prop('uni_notifs','uf_key','Client key');
CALL add_prop('uni_notifs','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_notifs','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_notifs','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_notifs','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_notifs','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_notifs','uf_STUFF','STUFF');

-- uni_bids
CALL add_prop('uni_bids','uf_key','Client key');
CALL add_prop('uni_bids','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_bids','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_bids','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_bids','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_bids','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_bids','uf_STUFF','STUFF');

-- uni_events
CALL add_prop('uni_events','uf_key','Client key');
CALL add_prop('uni_events','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_events','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_events','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_events','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_events','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_events','uf_STUFF','STUFF');
CALL add_prop('uni_events','uf_PROPERTY_id','id в календаре');
CALL add_prop('uni_events','uf_PROPERTY_type','тип');
CALL add_prop('uni_events','uf_PROPERTY_kind','вид');
CALL add_prop('uni_events','uf_PROPERTY_organizer','организатор');
CALL add_prop('uni_events','uf_PROPERTY_responsible','ответственный');
CALL add_prop('uni_events','uf_PROPERTY_attendees','участники');
CALL add_prop('uni_events','uf_PROPERTY_location','место');
CALL add_prop('uni_events','uf_PROPERTY_meeting','приглашение');
CALL add_prop('uni_events','uf_PROPERTY_color','цвет в календаре');
CALL add_prop('uni_events','uf_PROPERTY_text_color','цвет текста');
CALL add_prop('uni_events','uf_PROPERTY_flags','Флаги');
CALL add_prop('uni_events','uf_PROPERTY_activity_class','Класс активности (event|task)');
CALL add_prop('uni_events','uf_PROPERTY_in_catalog','Отображать в каталоге (Y|N)');
CALL add_prop('uni_events','uf_PROPERTY_task_deadline','Крайний срок задачи (строка даты/ISO)');
CALL add_prop('uni_events','uf_PROPERTY_checklist','Чек-лист (JSON)');
CALL add_prop('uni_events','uf_PROPERTY_checklist_progress','Прогресс чек-листа (JSON)');
CALL add_prop('uni_events','uf_PROPERTY_attachments','Вложения задачи (JSON)');
CALL add_prop('uni_events','uf_PROPERTY_participation','Факт участия в мероприятии (JSON)');

-- uni_progscheds
CALL add_prop('uni_progscheds','uf_key','Client key');
CALL add_prop('uni_progscheds','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_progscheds','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_progscheds','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_progscheds','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_progscheds','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_progscheds','uf_STUFF','STUFF');

-- uni_uprogscheds
CALL add_prop('uni_uprogscheds','uf_key','Client key');
CALL add_prop('uni_uprogscheds','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_uprogscheds','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_uprogscheds','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_uprogscheds','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_uprogscheds','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_uprogscheds','uf_STUFF','STUFF');

-- uni_programs
CALL add_prop('uni_programs','uf_key','Client key');
CALL add_prop('uni_programs','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_programs','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_programs','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_programs','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_programs','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_programs','uf_STUFF','STUFF');
CALL add_prop('uni_programs','uf_PROPERTY_modules','Модули');
CALL add_prop('uni_programs','uf_PROPERTY_type','Как открывать SP');
CALL add_prop('uni_programs','uf_PROPERTY_flags','Флаги');

-- uni_degree360
CALL add_prop('uni_degree360','uf_key','Client key');
CALL add_prop('uni_degree360','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_degree360','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_degree360','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_degree360','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_degree360','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_degree360','uf_STUFF','STUFF');
CALL add_prop('uni_degree360','uf_PROPERTY_agreeID','Согласующий ID');
CALL add_prop('uni_degree360','uf_PROPERTY_approved','Согласовано Y|N');
CALL add_prop('uni_degree360','uf_PROPERTY_flags','Флаги');

-- uni_udegree360
CALL add_prop('uni_udegree360','uf_key','Client key');
CALL add_prop('uni_udegree360','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_udegree360','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_udegree360','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_udegree360','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_udegree360','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_udegree360','uf_STUFF','STUFF');

-- uni_tdegree360
CALL add_prop('uni_tdegree360','uf_key','Client key');
CALL add_prop('uni_tdegree360','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_tdegree360','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_tdegree360','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_tdegree360','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_tdegree360','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_tdegree360','uf_STUFF','STUFF');

-- uni_subaccounts
CALL add_prop('uni_subaccounts','uf_key','Client key');
CALL add_prop('uni_subaccounts','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_subaccounts','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_subaccounts','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_subaccounts','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_subaccounts','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_subaccounts','uf_STUFF','STUFF');

-- uni_quiz
CALL add_prop('uni_quiz','uf_key','Client key');
CALL add_prop('uni_quiz','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_quiz','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_quiz','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_quiz','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_quiz','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_quiz','uf_STUFF','STUFF');
CALL add_prop('uni_quiz','uf_PROPERTY_list','Вопросы и ответы');
CALL add_prop('uni_quiz','uf_PROPERTY_users','Юзеры');
CALL add_prop('uni_quiz','uf_PROPERTY_deps','Отделы');
CALL add_prop('uni_quiz','uf_PROPERTY_allaccess','Доступ для всех');
CALL add_prop('uni_quiz','uf_PROPERTY_flags','Флаги');
CALL add_prop('uni_quiz','uf_PROPERTY_owner','Создатель');

-- uni_rating
CALL add_prop('uni_rating','uf_key','Client key');
CALL add_prop('uni_rating','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_rating','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_rating','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_rating','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_rating','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_rating','uf_STUFF','STUFF');

-- uni_message
CALL add_prop('uni_message','uf_key','Client key');
CALL add_prop('uni_message','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_message','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_message','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_message','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_message','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_message','uf_STUFF','STUFF');
CALL add_prop('uni_message','uf_PROPERTY_users','Юзеры');
CALL add_prop('uni_message','uf_PROPERTY_deps','Отделы');
CALL add_prop('uni_message','uf_PROPERTY_allaccess','Доступ для всех');
CALL add_prop('uni_message','uf_PROPERTY_flags','Флаги');
CALL add_prop('uni_message','uf_PROPERTY_owner','Создатель');

-- uni_userstat
CALL add_prop('uni_userstat','uf_key','Client key');
CALL add_prop('uni_userstat','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_userstat','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_userstat','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_userstat','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_userstat','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_userstat','uf_STUFF','STUFF');

-- uni_quizevent
CALL add_prop('uni_quizevent','uf_key','Client key');
CALL add_prop('uni_quizevent','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_quizevent','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_quizevent','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_quizevent','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_quizevent','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_quizevent','uf_STUFF','STUFF');
CALL add_prop('uni_quizevent','uf_PROPERTY_list','Вопросы и ответы');
CALL add_prop('uni_quizevent','uf_PROPERTY_users','Юзеры');
CALL add_prop('uni_quizevent','uf_PROPERTY_deps','Отделы');
CALL add_prop('uni_quizevent','uf_PROPERTY_allaccess','Доступ для всех');
CALL add_prop('uni_quizevent','uf_PROPERTY_flags','Флаги');
CALL add_prop('uni_quizevent','uf_PROPERTY_owner','Создатель');

-- uni_shelves
CALL add_prop('uni_shelves','uf_key','Client key');
CALL add_prop('uni_shelves','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_shelves','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_shelves','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_shelves','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_shelves','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_shelves','uf_STUFF','STUFF');
CALL add_prop('uni_shelves','uf_PROPERTY_competence','Компетенции');
CALL add_prop('uni_shelves','uf_PROPERTY_allowedDepartments','Отделы');
CALL add_prop('uni_shelves','uf_PROPERTY_flags','Флаги');
CALL add_prop('uni_shelves','uf_PROPERTY_owner','Создатель');
CALL add_prop('uni_shelves','uf_PROPERTY_editor','Редактор');

-- uni_items
CALL add_prop('uni_items','uf_key','Client key');
CALL add_prop('uni_items','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_items','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_items','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_items','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_items','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_items','uf_STUFF','STUFF');
CALL add_prop('uni_items','uf_PROPERTY_competence','Компетенции');
CALL add_prop('uni_items','uf_PROPERTY_allowedDepartments','Отделы');
CALL add_prop('uni_items','uf_PROPERTY_flags','Флаги');
CALL add_prop('uni_items','uf_PROPERTY_owner','Создатель');
CALL add_prop('uni_items','uf_PROPERTY_editor','Редактор');

-- uni_items_own
CALL add_prop('uni_items_own','uf_key','Client key');
CALL add_prop('uni_items_own','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_items_own','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_items_own','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_items_own','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_items_own','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_items_own','uf_STUFF','STUFF');

-- uni_items_checks
CALL add_prop('uni_items_checks','uf_key','Client key');
CALL add_prop('uni_items_checks','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_items_checks','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_items_checks','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_items_checks','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_items_checks','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_items_checks','uf_STUFF','STUFF');

-- uni_polls
CALL add_prop('uni_polls','uf_key','Client key');
CALL add_prop('uni_polls','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_polls','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_polls','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_polls','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_polls','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_polls','uf_STUFF','STUFF');
CALL add_prop('uni_polls','uf_PROPERTY_list','Вопросы и ответы');
CALL add_prop('uni_polls','uf_PROPERTY_sections','Секции опроса');
CALL add_prop('uni_polls','uf_PROPERTY_users','Юзеры');
CALL add_prop('uni_polls','uf_PROPERTY_deps','Отделы');
CALL add_prop('uni_polls','uf_PROPERTY_allaccess','Доступ для всех');
CALL add_prop('uni_polls','uf_PROPERTY_flags','Флаги');
CALL add_prop('uni_polls','uf_PROPERTY_owner','Создатель');
CALL add_prop('uni_polls','uf_PROPERTY_ra_type','Тип ограничения доступа');
CALL add_prop('uni_polls','uf_PROPERTY_time_limit','Ограничение по времени');
CALL add_prop('uni_polls','uf_PROPERTY_subaccs','Выбранные субаккаунты');
CALL add_prop('uni_polls','uf_PROPERTY_subacc_grps','Выбранные группы субаккаунтов');
CALL add_prop('uni_polls','uf_PROPERTY_score_ranges','Диапазоны результатов');
CALL add_prop('uni_polls','uf_PROPERTY_post_completion_actions','Действия после прохождения');

-- uni_poll_bindings
CALL add_prop('uni_poll_bindings','uf_key','Client key');
CALL add_prop('uni_poll_bindings','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_poll_bindings','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_poll_bindings','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_poll_bindings','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_poll_bindings','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_poll_bindings','uf_STUFF','STUFF');
CALL add_prop('uni_poll_bindings','uf_PROPERTY_poll_id','ID опроса');
CALL add_prop('uni_poll_bindings','uf_PROPERTY_entity_type','Тип сущности');
CALL add_prop('uni_poll_bindings','uf_PROPERTY_entity_id','ID сущности');
CALL add_prop('uni_poll_bindings','uf_PROPERTY_scope','Контекст размещения');
CALL add_prop('uni_poll_bindings','uf_PROPERTY_settings','Настройки привязки (JSON)');
CALL add_prop('uni_poll_bindings','uf_PROPERTY_is_active','Активность');

-- uni_poll_submissions
CALL add_prop('uni_poll_submissions','uf_key','Client key');
CALL add_prop('uni_poll_submissions','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_poll_submissions','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_poll_submissions','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_poll_submissions','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_poll_submissions','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_poll_submissions','uf_STUFF','STUFF');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_binding_id','ID привязки');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_poll_id','ID опроса');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_user_id','ID пользователя');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_attempt_no','Номер попытки');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_answers','Ответы (JSON)');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_status','Статус попытки');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_started_at','Дата начала');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_submitted_at','Дата отправки');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_score','Баллы');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_passed','Пройден');
CALL add_prop('uni_poll_submissions','uf_PROPERTY_is_latest','Последняя попытка');

-- uni_access_rights
CALL add_prop('uni_access_rights','uf_key','Client key');
CALL add_prop('uni_access_rights','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_access_rights','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_access_rights','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_access_rights','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_access_rights','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_access_rights','uf_STUFF','STUFF');
CALL add_prop('uni_access_rights','uf_PROPERTY_resource_type','Тип ресурса (код сущности)');
CALL add_prop('uni_access_rights','uf_PROPERTY_resource_id','ID ресурса');
CALL add_prop('uni_access_rights','uf_PROPERTY_principal_type','Тип субъекта (user|department|group)');
CALL add_prop('uni_access_rights','uf_PROPERTY_principal_id','ID субъекта');
CALL add_prop('uni_access_rights','uf_PROPERTY_permission','Право (R|W)');

-- uni_catalog_shares
CALL add_prop('uni_catalog_shares','uf_key','Client key');
CALL add_prop('uni_catalog_shares','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_catalog_shares','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_catalog_shares','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_catalog_shares','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_catalog_shares','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_catalog_shares','uf_STUFF','STUFF');
CALL add_prop('uni_catalog_shares','uf_PROPERTY_resource_type','Тип объекта (код сущности, как в uni_access_rights)');
CALL add_prop('uni_catalog_shares','uf_PROPERTY_resource_id','ID объекта в этой сущности');
CALL add_prop('uni_catalog_shares','uf_PROPERTY_recipient_user_id','ID пользователя-получателя');
CALL add_prop('uni_catalog_shares','uf_PROPERTY_shared_by_user_id','ID пользователя-отправителя');
CALL add_prop('uni_catalog_shares','uf_PROPERTY_seen_at','Дата просмотра получателем (ISO-строка, пусто = не открывал)');

-- uni_item_subs
CALL add_prop('uni_item_subs','uf_key','Client key');
CALL add_prop('uni_item_subs','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_item_subs','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_item_subs','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_item_subs','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_item_subs','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_item_subs','uf_STUFF','STUFF');
CALL add_prop('uni_item_subs','uf_PROPERTY_resource_type','Тип ресурса (код сущности, напр. uni_items)');
CALL add_prop('uni_item_subs','uf_PROPERTY_resource_id','ID ресурса (материала)');
CALL add_prop('uni_item_subs','uf_PROPERTY_subscriber_user_id','ID пользователя-подписчика');
CALL add_prop('uni_item_subs','uf_PROPERTY_subscribed_at','Дата подписки (ISO-строка)');
CALL add_prop('uni_item_subs','uf_PROPERTY_last_change_at','Дата последнего изменения материала (ISO-строка)');
CALL add_prop('uni_item_subs','uf_PROPERTY_last_seen_at','Дата последнего просмотра после изменения (ISO-строка)');
CALL add_prop('uni_item_subs','uf_PROPERTY_last_change_kind','Тип последнего изменения (content|meta|create)');

-- uni_gifts_cats
CALL add_prop('uni_gifts_cats','uf_key','Client key');
CALL add_prop('uni_gifts_cats','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_gifts_cats','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_gifts_cats','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_gifts_cats','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_gifts_cats','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_gifts_cats','uf_STUFF','STUFF');

-- uni_gifts
CALL add_prop('uni_gifts','uf_key','Client key');
CALL add_prop('uni_gifts','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_gifts','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_gifts','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_gifts','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_gifts','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_gifts','uf_STUFF','STUFF');
CALL add_prop('uni_gifts','uf_PROPERTY_price','Цена (баллы)');
CALL add_prop('uni_gifts','uf_PROPERTY_image_url','URL изображения');
CALL add_prop('uni_gifts','uf_PROPERTY_category_id','ID категории (элемент uni_gifts_cats)');
CALL add_prop('uni_gifts','uf_PROPERTY_stock','Остаток (пусто = без лимита)');

-- uni_opens_templates
CALL add_prop('uni_opens_templates','uf_key','Client key');
CALL add_prop('uni_opens_templates','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_opens_templates','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_opens_templates','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_opens_templates','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_opens_templates','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_opens_templates','uf_STUFF','STUFF');
CALL add_prop('uni_opens_templates','uf_PROPERTY_owner','Создатель шаблона (ID пользователя B24)');
CALL add_prop('uni_opens_templates','uf_PROPERTY_criteria','Критерии оценки (JSON)');
CALL add_prop('uni_opens_templates','uf_PROPERTY_pass_score','Проходной балл (число)');
CALL add_prop('uni_opens_templates','uf_PROPERTY_reference_answer','Эталонный ответ (опционально)');
CALL add_prop('uni_opens_templates','uf_PROPERTY_check_mode','Режим: strict | partial | expert');
CALL add_prop('uni_opens_templates','uf_PROPERTY_sources','Источники данных (JSON: text, hint)');
CALL add_prop('uni_opens_templates','uf_PROPERTY_flags','Флаги');

-- uni_gifts_requests
CALL add_prop('uni_gifts_requests','uf_key','Client key');
CALL add_prop('uni_gifts_requests','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_gifts_requests','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_gifts_requests','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_gifts_requests','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_gifts_requests','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_gifts_requests','uf_STUFF','STUFF');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_user_id','ID сотрудника');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_user_name','Имя сотрудника');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_user_avatar','Аватар сотрудника');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_gift_id','ID подарка');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_gift_title','Название подарка на момент заявки');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_price_paid','Цена на момент заявки');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_status','Статус заявки');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_request_date','Дата создания заявки');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_updated_at','Дата обновления заявки');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_moderator_id','ID модератора');
CALL add_prop('uni_gifts_requests','uf_PROPERTY_moderator_name','Имя модератора');

-- uni_pushsubs
CALL add_prop('uni_pushsubs','uf_key','Client key');
CALL add_prop('uni_pushsubs','uf_PREVIEW_TEXT','PREVIEW_TEXT');
CALL add_prop('uni_pushsubs','uf_ACTIVE','ACTIVE');
CALL add_prop('uni_pushsubs','uf_DETAIL_PICTURE','DETAIL_PICTURE');
CALL add_prop('uni_pushsubs','uf_DATE_ACTIVE_FROM','DATE_ACTIVE_FROM');
CALL add_prop('uni_pushsubs','uf_DATE_ACTIVE_TO','DATE_ACTIVE_TO');
CALL add_prop('uni_pushsubs','uf_STUFF','STUFF');

DROP PROCEDURE IF EXISTS add_prop;

SET FOREIGN_KEY_CHECKS=1;

SELECT CONCAT('Всего iblock: ', COUNT(*)) AS result FROM iblock;
SELECT CONCAT('Всего iblock_property: ', COUNT(*)) AS result FROM iblock_property;
