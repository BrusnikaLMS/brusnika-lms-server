-- OAuth-пара приложения Bitrix24 для локальной установки (status=L).
-- Если поля пустые, используются глобальные APP_ID / APP_SECRET_CODE из constants.php.
-- Идемпотентно: ADD COLUMN IF NOT EXISTS.
--
-- Без этих колонок PHP падает при установке приложения в Bitrix24:
-- "Unknown column 'OAUTH_CLIENT_ID' in 'INSERT INTO'" (safemysql.class.php).
-- Эта миграция раньше жила в lms/local/sql/ (образ), но потерялась при
-- реорганизации репозиториев — перенесена сюда, чтобы verify_db.sh/fix_db.sh
-- чинили её независимо от содержимого образа.

ALTER TABLE `b24_portal_reg`
    ADD COLUMN IF NOT EXISTS `OAUTH_CLIENT_ID` VARCHAR(191) NULL DEFAULT NULL
        COMMENT 'client_id локального приложения; NULL/пусто = константа APP_ID',
    ADD COLUMN IF NOT EXISTS `OAUTH_CLIENT_SECRET` VARCHAR(255) NULL DEFAULT NULL
        COMMENT 'client_secret локального приложения; NULL/пусто = константа APP_SECRET_CODE';
