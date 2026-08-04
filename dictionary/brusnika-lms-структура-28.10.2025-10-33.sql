# ************************************************************
# Sequel Pro SQL dump
# Версия 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Адрес: 91.201.53.10 (MySQL 5.5.5-10.3.29-MariaDB-0+deb10u1)
# Схема: brusnika-lms
# Время создания: 2025-10-28 07:33:54 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Дамп таблицы b24_event_log
# ------------------------------------------------------------

DROP TABLE IF EXISTS `b24_event_log`;

CREATE TABLE `b24_event_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `portal_id` int(11) NOT NULL,
  `severity` char(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT ' UNKNOWN' COMMENT 'Степень важности. Например: SECURITY, ERROR, INFO, DEBUG или WARNING.',
  `module_id` char(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Идентификатор модуля',
  `description` text COLLATE utf8_unicode_ci NOT NULL COMMENT 'Описание записи лога, или техническая информация',
  `date_insert` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Дата создания записи',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_b24_event_log_b24_portal_reg` (`portal_id`) USING BTREE,
  CONSTRAINT `FK_b24_event_log_b24_portal_reg` FOREIGN KEY (`portal_id`) REFERENCES `b24_portal_reg` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Журнал событий';



# Дамп таблицы b24_options
# ------------------------------------------------------------

DROP TABLE IF EXISTS `b24_options`;

CREATE TABLE `b24_options` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `PORTAL_ID` int(11) DEFAULT NULL,
  `USER_ID` int(11) DEFAULT NULL,
  `NAME` char(50) COLLATE utf8_unicode_ci NOT NULL,
  `VALUE` mediumtext COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`ID`) USING BTREE,
  KEY `FK_b24_options_b24_portal_reg` (`PORTAL_ID`) USING BTREE,
  CONSTRAINT `FK_b24_options_b24_portal_reg` FOREIGN KEY (`PORTAL_ID`) REFERENCES `b24_portal_reg` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Опции приложения';



# Дамп таблицы b24_orders
# ------------------------------------------------------------

DROP TABLE IF EXISTS `b24_orders`;

CREATE TABLE `b24_orders` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `PORTAL_ID` int(11) NOT NULL,
  `PRODUCT_ID` int(11) NOT NULL,
  `DISK` char(1) NOT NULL DEFAULT 'N',
  `PRICE` float NOT NULL,
  `PAYMENT_ID` char(255) NOT NULL DEFAULT '',
  `PAYED` char(1) NOT NULL DEFAULT 'N' COMMENT 'Статус оплаты',
  `PAY_METH` char(2) NOT NULL DEFAULT 'P4' COMMENT 'Статус оплаты',
  `DATE_CREATE` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Дата и время создания заказа',
  `DATE_START` date DEFAULT NULL COMMENT 'Дата начала действия расширенной версии',
  `DATE_END` date DEFAULT NULL COMMENT 'Дата окончания действия расширенной версии',
  `LANG_ID` char(8) NOT NULL DEFAULT 'en',
  `PORTAL_NAME` char(255) NOT NULL DEFAULT '',
  `APP_ID` char(16) NOT NULL DEFAULT '',
  `ORDER` mediumtext DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Дамп таблицы b24_portal_reg
# ------------------------------------------------------------

DROP TABLE IF EXISTS `b24_portal_reg`;

CREATE TABLE `b24_portal_reg` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `PORTAL` varchar(255) NOT NULL DEFAULT '',
  `ACTIVE` char(1) NOT NULL DEFAULT 'Y',
  `DATE_INSTALL` datetime NOT NULL DEFAULT current_timestamp(),
  `LAST_ACTIVITY` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Дата и время последней активности в приложении',
  `ACCESS_TOKEN` text DEFAULT NULL,
  `EXPIRES_IN` int(11) DEFAULT NULL,
  `REFRESH_TOKEN` text DEFAULT NULL,
  `MEMBER_ID` char(128) NOT NULL,
  `INSTALL_USER_ID` int(4) NOT NULL COMMENT 'Идентификатор пользователя, установившего приложение',
  `APPLICATION_TOKEN` text DEFAULT NULL,
  `UPDATE_TS` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `APP_ID` char(8) DEFAULT 'LMS',
  `MAIN_PORTAL` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID`) USING BTREE,
  UNIQUE KEY `PORTAL` (`PORTAL`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Зарегистрированные порталы';



# Дамп таблицы b24_products
# ------------------------------------------------------------

DROP TABLE IF EXISTS `b24_products`;

CREATE TABLE `b24_products` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `GRP` char(3) DEFAULT NULL,
  `TYPE` char(3) DEFAULT NULL,
  `FROM` int(11) NOT NULL DEFAULT 1,
  `TO` int(11) DEFAULT NULL,
  `DISK` char(1) NOT NULL DEFAULT 'N',
  `NAME` text NOT NULL COMMENT 'Наименование',
  `DESCRIPTION` char(255) NOT NULL DEFAULT '',
  `PRICE` char(255) NOT NULL COMMENT 'Цена',
  `MONTH_QUANTITY` int(11) NOT NULL COMMENT 'Количество месяцев действия расширенной версии',
  `SORT` int(11) NOT NULL DEFAULT 100,
  `APP_ID` char(16) NOT NULL DEFAULT '',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Дамп таблицы dictionary
# ------------------------------------------------------------

DROP TABLE IF EXISTS `dictionary`;

CREATE TABLE `dictionary` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `LANG` char(8) DEFAULT NULL,
  `KEY` char(32) DEFAULT NULL,
  `TEXT` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `KEY` (`KEY`,`LANG`),
  KEY `LANG` (`LANG`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Дамп таблицы dictionary2
# ------------------------------------------------------------

DROP TABLE IF EXISTS `dictionary2`;

CREATE TABLE `dictionary2` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `LANG` char(8) DEFAULT NULL,
  `KEY` char(32) DEFAULT NULL,
  `TEXT` text DEFAULT NULL,
  `MODULE` char(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `KEY` (`KEY`,`LANG`),
  KEY `LANG` (`LANG`),
  KEY `LANG_2` (`LANG`,`MODULE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Дамп таблицы dictionary2_custom
# ------------------------------------------------------------

DROP TABLE IF EXISTS `dictionary2_custom`;

CREATE TABLE `dictionary2_custom` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `LANG` char(8) DEFAULT NULL,
  `KEY` char(32) DEFAULT NULL,
  `TEXT` text DEFAULT NULL,
  `MEMBER_ID` char(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `KEY` (`KEY`,`LANG`),
  KEY `LANG` (`LANG`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Дамп таблицы iblock
# ------------------------------------------------------------

DROP TABLE IF EXISTS `iblock`;

CREATE TABLE `iblock` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `portal_id` int(11) DEFAULT NULL,
  `title` char(250) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Наменование',
  `code` char(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Символьный код',
  `description` char(250) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Описание',
  `date_create` datetime DEFAULT NULL COMMENT 'Дата создания',
  `date_update` datetime DEFAULT NULL COMMENT 'Дата обновления',
  `create_user` int(11) DEFAULT NULL COMMENT 'Пользователь, создавший элемент',
  `update_user` int(11) DEFAULT NULL COMMENT 'Пользователь, который произвел последние действия с элементом',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_iblock_b24_portal_reg` (`portal_id`) USING BTREE,
  CONSTRAINT `FK_iblock_b24_portal_reg` FOREIGN KEY (`portal_id`) REFERENCES `b24_portal_reg` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Информационные блоки';



# Дамп таблицы iblock_element
# ------------------------------------------------------------

DROP TABLE IF EXISTS `iblock_element`;

CREATE TABLE `iblock_element` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `iblock_id` int(11) NOT NULL COMMENT 'Идентификатор инфоблока',
  `section_id` int(11) DEFAULT NULL COMMENT 'Идентификатор раздела',
  `title` char(250) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Наименование',
  `description` longtext COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Описание',
  `date_create` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Дата и время создания',
  `date_update` datetime DEFAULT NULL COMMENT 'Дата и время обновления',
  `create_user` int(11) DEFAULT NULL COMMENT 'Пользователь, создавший элемент',
  `update_user` int(11) DEFAULT NULL COMMENT 'Пользователь, который произвел последние действия с элементом',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_iblock_elements_iblock` (`iblock_id`) USING BTREE,
  CONSTRAINT `FK_iblock_elements_iblock` FOREIGN KEY (`iblock_id`) REFERENCES `iblock` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы iblock_element_property_values
# ------------------------------------------------------------

DROP TABLE IF EXISTS `iblock_element_property_values`;

CREATE TABLE `iblock_element_property_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `element_id` int(11) DEFAULT NULL,
  `property_id` int(11) DEFAULT NULL,
  `string_value` longtext COLLATE utf8_unicode_ci DEFAULT NULL,
  `int_value` int(11) DEFAULT NULL,
  `double_value` double DEFAULT NULL,
  `enum_value` char(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `link_element_value` int(11) DEFAULT NULL,
  `link_section_value` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_iblock_property_values_iblock_elements` (`element_id`) USING BTREE,
  KEY `FK_iblock_property_values_iblock_property` (`property_id`) USING BTREE,
  CONSTRAINT `FK_iblock_property_values_iblock_elements` FOREIGN KEY (`element_id`) REFERENCES `iblock_element` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_iblock_property_values_iblock_property` FOREIGN KEY (`property_id`) REFERENCES `iblock_property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы iblock_property
# ------------------------------------------------------------

DROP TABLE IF EXISTS `iblock_property`;

CREATE TABLE `iblock_property` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `iblock_id` int(11) NOT NULL DEFAULT 0 COMMENT 'Идентификатор инфоблока',
  `code` char(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Код поля',
  `title` char(250) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Наименование поля',
  `description` text COLLATE utf8_unicode_ci NOT NULL COMMENT 'Описание',
  `type` char(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Тип поля',
  `entity` char(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Тип сущности',
  `multiple` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Множественное',
  `required` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Обязательное',
  `service` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Служебное',
  `link_iblock_id` int(11) DEFAULT NULL COMMENT 'Идентификатор инфоблока (для свойств привязок)',
  `date_create` datetime DEFAULT NULL COMMENT 'Дата и время создания',
  `date_update` datetime DEFAULT NULL COMMENT 'Дата и время обновления',
  `create_user` int(11) DEFAULT NULL COMMENT 'Пользователь, создавший элемент',
  `update_user` int(11) DEFAULT NULL COMMENT 'Пользователь, который произвел последние действия с элементом',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_iblock_property_iblock` (`iblock_id`) USING BTREE,
  CONSTRAINT `FK_iblock_property_iblock` FOREIGN KEY (`iblock_id`) REFERENCES `iblock` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы iblock_property_enum
# ------------------------------------------------------------

DROP TABLE IF EXISTS `iblock_property_enum`;

CREATE TABLE `iblock_property_enum` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` int(11) NOT NULL,
  `name` char(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `value` char(50) COLLATE utf8_unicode_ci NOT NULL,
  `default` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_iblock_property_enum_iblock_property` (`property_id`) USING BTREE,
  CONSTRAINT `FK_iblock_property_enum_iblock_property` FOREIGN KEY (`property_id`) REFERENCES `iblock_property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы iblock_section
# ------------------------------------------------------------

DROP TABLE IF EXISTS `iblock_section`;

CREATE TABLE `iblock_section` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `iblock_id` int(11) NOT NULL COMMENT 'Идентификатор инфоблока',
  `title` char(50) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Наименование',
  `description` text COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Описание',
  `date_create` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Дата и время создания',
  `date_update` datetime DEFAULT NULL COMMENT 'Дата и время обновления',
  `create_user` int(11) DEFAULT NULL COMMENT 'Пользователь, создавший элемент',
  `update_user` int(11) DEFAULT NULL COMMENT 'Пользователь, который произвел последние действия с элементом',
  `left` int(11) NOT NULL COMMENT 'Левая граница',
  `right` int(11) NOT NULL COMMENT 'Правая граница',
  `level` int(11) NOT NULL COMMENT 'Глубина вложенности',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_iblock_section_iblock` (`iblock_id`) USING BTREE,
  CONSTRAINT `FK_iblock_section_iblock` FOREIGN KEY (`iblock_id`) REFERENCES `iblock` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы iblock_section_property_values
# ------------------------------------------------------------

DROP TABLE IF EXISTS `iblock_section_property_values`;

CREATE TABLE `iblock_section_property_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section_id` int(11) DEFAULT NULL,
  `property_id` int(11) DEFAULT NULL,
  `string_value` char(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `int_value` int(11) DEFAULT NULL,
  `double_value` double DEFAULT NULL,
  `enum_value` char(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `link_element_value` int(11) DEFAULT NULL,
  `link_section_value` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_iblock_sections_property_values_iblock_section` (`section_id`) USING BTREE,
  KEY `FK_iblock_sections_property_values_iblock_property` (`property_id`) USING BTREE,
  CONSTRAINT `FK_iblock_sections_property_values_iblock_property` FOREIGN KEY (`property_id`) REFERENCES `iblock_property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_iblock_sections_property_values_iblock_section` FOREIGN KEY (`section_id`) REFERENCES `iblock_section` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы instructions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `instructions`;

CREATE TABLE `instructions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `lang` char(2) DEFAULT NULL,
  `key` char(64) DEFAULT NULL,
  `lang_key` char(32) DEFAULT NULL,
  `href` varchar(1024) DEFAULT NULL,
  `description` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`lang`,`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Дамп таблицы log
# ------------------------------------------------------------

DROP TABLE IF EXISTS `log`;

CREATE TABLE `log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `api` varchar(1024) COLLATE utf8_unicode_ci DEFAULT NULL,
  `severity` char(10) COLLATE utf8_unicode_ci DEFAULT 'info' COMMENT 'Степень важности записи (error, info, debug или warning)',
  `type_id` char(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Произвольный id типа события',
  `description` text COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Описание',
  `datetime` datetime NOT NULL DEFAULT current_timestamp(),
  `filepath` varchar(1024) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Полный путь к файлу (если есть)',
  `filesize` double DEFAULT NULL COMMENT 'Размер файла в мегабайтах',
  `ip` char(15) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'ip-адрес',
  `device` char(250) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Имя устройства',
  `user_id` int(11) NOT NULL,
  `params` text COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы messages
# ------------------------------------------------------------

DROP TABLE IF EXISTS `messages`;

CREATE TABLE `messages` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `lang_code` char(8) DEFAULT 'ru',
  `key` char(32) DEFAULT NULL,
  `value` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lang` (`lang_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Дамп таблицы oauth_access_tokens
# ------------------------------------------------------------

DROP TABLE IF EXISTS `oauth_access_tokens`;

CREATE TABLE `oauth_access_tokens` (
  `access_token` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `client_id` varchar(80) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expires` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `scope` varchar(4000) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`access_token`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы oauth_authorization_codes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `oauth_authorization_codes`;

CREATE TABLE `oauth_authorization_codes` (
  `authorization_code` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `client_id` varchar(80) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `redirect_uri` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expires` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `scope` varchar(4000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `id_token` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`authorization_code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы oauth_clients
# ------------------------------------------------------------

DROP TABLE IF EXISTS `oauth_clients`;

CREATE TABLE `oauth_clients` (
  `client_id` varchar(80) COLLATE utf8_unicode_ci NOT NULL,
  `client_secret` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `redirect_uri` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `grant_types` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `scope` varchar(4000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`client_id`) USING BTREE,
  KEY `FK_oauth_clients_users` (`user_id`) USING BTREE,
  CONSTRAINT `FK_oauth_clients_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы oauth_refresh_tokens
# ------------------------------------------------------------

DROP TABLE IF EXISTS `oauth_refresh_tokens`;

CREATE TABLE `oauth_refresh_tokens` (
  `refresh_token` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `client_id` varchar(80) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expires` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `scope` varchar(4000) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`refresh_token`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы oauth_scopes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `oauth_scopes`;

CREATE TABLE `oauth_scopes` (
  `scope` varchar(80) COLLATE utf8_unicode_ci NOT NULL,
  `is_default` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`scope`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;



# Дамп таблицы reset_password
# ------------------------------------------------------------

DROP TABLE IF EXISTS `reset_password`;

CREATE TABLE `reset_password` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(256) DEFAULT NULL,
  `TIMESTAMP` datetime DEFAULT NULL,
  `token` char(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Дамп таблицы transfer_data
# ------------------------------------------------------------

DROP TABLE IF EXISTS `transfer_data`;

CREATE TABLE `transfer_data` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `transfer_ident` int(11) unsigned DEFAULT NULL,
  `entity` char(16) DEFAULT NULL,
  `src_id` int(11) DEFAULT NULL,
  `target_id` int(11) DEFAULT NULL,
  `demo` char(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_transfer_data_ident` (`transfer_ident`),
  CONSTRAINT `fk_transfer_data_ident` FOREIGN KEY (`transfer_ident`) REFERENCES `transfer_ident` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Дамп таблицы transfer_ident
# ------------------------------------------------------------

DROP TABLE IF EXISTS `transfer_ident`;

CREATE TABLE `transfer_ident` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `src_member_id` varchar(128) DEFAULT NULL,
  `target_member_id` varchar(128) DEFAULT NULL,
  `src_portal` varchar(128) DEFAULT NULL,
  `target_portal` varchar(128) DEFAULT NULL,
  `transfer_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Дамп таблицы transfer_users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `transfer_users`;

CREATE TABLE `transfer_users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `transfer_ident` int(11) unsigned DEFAULT NULL,
  `src_id` int(11) DEFAULT NULL,
  `target_id` int(11) DEFAULT NULL,
  `user` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_transfer_data_ident` (`transfer_ident`),
  CONSTRAINT `transfer_users_ibfk_1` FOREIGN KEY (`transfer_ident`) REFERENCES `transfer_ident` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Дамп таблицы users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` char(50) COLLATE utf8_unicode_ci NOT NULL,
  `password` char(50) COLLATE utf8_unicode_ci NOT NULL,
  `member_id` char(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
