-- ============================================================
-- missing_tables.sql — создание таблиц, отсутствующих в БД
-- но присутствующих в дампе dump-uni24-demo-*.sql
-- Применяется через fix_db.sh при verify_db.sh
-- ============================================================

SET FOREIGN_KEY_CHECKS=0;

-- ── Standalone таблицы ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS `b24_perf_proposals` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `PORTAL` varchar(255) DEFAULT NULL,
  `MEMBER_ID` char(128) NOT NULL,
  `user_id` int(11) NOT NULL,
  `period_from` date DEFAULT NULL,
  `period_to` date DEFAULT NULL,
  `period_preset` varchar(64) DEFAULT NULL,
  `payload` longtext NOT NULL,
  `alerts_fired` varchar(1024) NOT NULL DEFAULT '',
  `status` enum('pending','applied','cancelled') NOT NULL DEFAULT 'pending',
  `mode` varchar(16) NOT NULL DEFAULT 'semi_auto',
  `created_by` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `applied_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_member_user` (`MEMBER_ID`,`user_id`),
  KEY `idx_member_user_status` (`MEMBER_ID`,`user_id`,`status`),
  KEY `idx_member_user_created` (`MEMBER_ID`,`user_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `events` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `domain` varchar(128) DEFAULT NULL,
  `member_id` char(32) DEFAULT NULL,
  `application_token` char(72) DEFAULT NULL,
  `app_id` char(8) DEFAULT NULL,
  `event` char(16) DEFAULT NULL,
  `data` text DEFAULT NULL,
  `ts` int(11) DEFAULT NULL,
  `active` char(1) NOT NULL DEFAULT 'Y',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE IF NOT EXISTS `invites` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `code` int(11) DEFAULT NULL,
  `MEMBER_ID` char(128) DEFAULT NULL,
  `invite_date` date DEFAULT NULL,
  `lms_type` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `nika_cache` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `PORTAL` varchar(255) DEFAULT NULL,
  `MEMBER_ID` char(128) DEFAULT NULL,
  `cache_key` char(64) NOT NULL,
  `lang` varchar(16) DEFAULT NULL,
  `payload` longtext NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_nika_cache` (`PORTAL`,`MEMBER_ID`,`cache_key`),
  KEY `idx_nika_cache_member` (`MEMBER_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `uni_user_month_login` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `member_id` varchar(128) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_name` varchar(512) NOT NULL DEFAULT '',
  `year` smallint(5) unsigned NOT NULL,
  `month` tinyint(3) unsigned NOT NULL,
  `last_login` datetime NOT NULL,
  `login_count` int(10) unsigned NOT NULL DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_member_user_year_month` (`member_id`,`user_id`,`year`,`month`),
  KEY `idx_member_year_month` (`member_id`,`year`,`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Public API (порядок: subscriptions → delivery_log, seen_state) ─

CREATE TABLE IF NOT EXISTS `public_api_keys` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `KEY_ID` varchar(32) NOT NULL,
  `MEMBER_ID` varchar(128) NOT NULL,
  `PORTAL_REG_ID` int(10) unsigned DEFAULT NULL,
  `PORTAL` varchar(255) DEFAULT NULL,
  `KEY_HASH` varchar(255) NOT NULL,
  `KEY_PREFIX` varchar(64) NOT NULL,
  `KEY_LAST4` varchar(8) NOT NULL,
  `NAME` varchar(191) NOT NULL DEFAULT '',
  `SCOPES` text DEFAULT NULL,
  `ALLOWED_ENDPOINTS` text DEFAULT NULL,
  `CREATED_BY_USER_ID` int(10) unsigned NOT NULL DEFAULT 0,
  `ACTOR_USER_ID` int(10) unsigned NOT NULL DEFAULT 0,
  `CREATED_AT` datetime NOT NULL,
  `LAST_USED_AT` datetime DEFAULT NULL,
  `REVOKED_AT` datetime DEFAULT NULL,
  `EXPIRES_AT` datetime DEFAULT NULL,
  `LAST_USED_IP` varchar(64) DEFAULT NULL,
  `LAST_USED_USER_AGENT` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uq_public_api_keys_key_id` (`KEY_ID`),
  KEY `idx_public_api_keys_member_active` (`MEMBER_ID`,`REVOKED_AT`,`EXPIRES_AT`),
  KEY `idx_public_api_keys_portal_reg` (`PORTAL_REG_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `public_api_migrations` (
  `name` varchar(191) NOT NULL,
  `checksum` char(64) NOT NULL,
  `applied_at` bigint(20) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `public_api_request_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ts` bigint(20) NOT NULL,
  `instance_id` varchar(64) NOT NULL,
  `portal` varchar(255) NOT NULL,
  `member_id` varchar(128) NOT NULL,
  `key_id` varchar(64) NOT NULL,
  `app_id` varchar(128) NOT NULL,
  `method` varchar(10) NOT NULL,
  `route` varchar(255) NOT NULL,
  `scope` varchar(191) NOT NULL,
  `status` smallint(5) unsigned NOT NULL,
  `duration_ms` int(10) unsigned NOT NULL,
  `error_code` varchar(128) DEFAULT NULL,
  `error_source` varchar(32) DEFAULT NULL,
  `error_kind` varchar(32) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `res_items` int(10) unsigned DEFAULT NULL,
  `correlation_id` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_log_ts` (`ts`),
  KEY `idx_log_portal_ts` (`portal`,`ts`),
  KEY `idx_log_status_ts` (`status`,`ts`),
  KEY `idx_log_instance_ts` (`instance_id`,`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `public_api_webhook_subscriptions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `public_id` varchar(64) NOT NULL,
  `instance_id` varchar(64) NOT NULL,
  `portal` varchar(255) NOT NULL,
  `member_id` varchar(128) NOT NULL,
  `callback_url` varchar(512) NOT NULL,
  `secret` varchar(191) NOT NULL,
  `events` text NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wh_public_id` (`public_id`),
  KEY `idx_wh_member` (`member_id`),
  KEY `idx_wh_instance_active` (`instance_id`,`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `public_api_webhook_delivery_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `subscription_id` bigint(20) unsigned NOT NULL,
  `event_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `event_type` varchar(64) NOT NULL,
  `entity_key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `attempt` smallint(5) unsigned NOT NULL,
  `http_status` smallint(5) unsigned DEFAULT NULL,
  `ok` tinyint(1) NOT NULL,
  `error` text DEFAULT NULL,
  `ts` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_whlog_sub_ts` (`subscription_id`,`ts`),
  KEY `idx_whlog_ts` (`ts`),
  CONSTRAINT `fk_wh_log_sub` FOREIGN KEY (`subscription_id`) REFERENCES `public_api_webhook_subscriptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `public_api_webhook_seen_state` (
  `subscription_id` bigint(20) unsigned NOT NULL,
  `entity_key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status_hash` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` varchar(64) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`subscription_id`,`entity_key`),
  CONSTRAINT `fk_wh_seen_sub` FOREIGN KEY (`subscription_id`) REFERENCES `public_api_webhook_subscriptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── Competency Library (порядок: locale → category → item/indicator → i18n) ─

CREATE TABLE IF NOT EXISTS `uni_hr_comp_lib_locale` (
  `code` varchar(8) NOT NULL,
  `label` varchar(64) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `uni_hr_comp_lib_category` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(16) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_hrcl_cat_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `uni_hr_comp_lib_item` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(10) unsigned NOT NULL,
  `code` varchar(32) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_hrcl_item_code` (`code`),
  KEY `idx_hrcl_item_category` (`category_id`),
  CONSTRAINT `fk_hrcl_item_category` FOREIGN KEY (`category_id`) REFERENCES `uni_hr_comp_lib_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `uni_hr_comp_lib_indicator` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `item_id` int(10) unsigned NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_hrcl_ind_item` (`item_id`),
  CONSTRAINT `fk_hrcl_ind_item` FOREIGN KEY (`item_id`) REFERENCES `uni_hr_comp_lib_item` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `uni_hr_comp_lib_cat_i18n` (
  `category_id` int(10) unsigned NOT NULL,
  `lang` varchar(8) NOT NULL,
  `title` varchar(512) NOT NULL,
  PRIMARY KEY (`category_id`,`lang`),
  KEY `fk_hrcl_cat_i18n_lang` (`lang`),
  CONSTRAINT `fk_hrcl_cat_i18n_cat` FOREIGN KEY (`category_id`) REFERENCES `uni_hr_comp_lib_category` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hrcl_cat_i18n_lang` FOREIGN KEY (`lang`) REFERENCES `uni_hr_comp_lib_locale` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `uni_hr_comp_lib_item_i18n` (
  `item_id` int(10) unsigned NOT NULL,
  `lang` varchar(8) NOT NULL,
  `title` varchar(512) NOT NULL,
  PRIMARY KEY (`item_id`,`lang`),
  KEY `fk_hrcl_item_i18n_lang` (`lang`),
  CONSTRAINT `fk_hrcl_item_i18n_item` FOREIGN KEY (`item_id`) REFERENCES `uni_hr_comp_lib_item` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hrcl_item_i18n_lang` FOREIGN KEY (`lang`) REFERENCES `uni_hr_comp_lib_locale` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `uni_hr_comp_lib_ind_i18n` (
  `indicator_id` int(10) unsigned NOT NULL,
  `lang` varchar(8) NOT NULL,
  `line_text` text NOT NULL,
  PRIMARY KEY (`indicator_id`,`lang`),
  KEY `fk_hrcl_ind_i18n_lang` (`lang`),
  CONSTRAINT `fk_hrcl_ind_i18n_ind` FOREIGN KEY (`indicator_id`) REFERENCES `uni_hr_comp_lib_indicator` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hrcl_ind_i18n_lang` FOREIGN KEY (`lang`) REFERENCES `uni_hr_comp_lib_locale` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
