-- Синхронизация заголовков карточек быстрого доступа "Отчеты" (mn_report_type_N_title/_desc, COMPONENT='App')
-- с уже переведёнными названиями отчётов (report_type_N, COMPONENT='ReportsView').
-- Без этого карточки для большинства типов отчётов показывают заглушку "Отчет типа N".

UPDATE dictionary3 mn
JOIN dictionary3 rv
  ON rv.LANG = mn.LANG
  AND rv.COMPONENT = 'ReportsView'
  AND rv.`KEY` = CONCAT('report_type_', SUBSTRING_INDEX(SUBSTRING_INDEX(mn.`KEY`, 'mn_report_type_', -1), '_title', 1))
SET mn.TEXT = rv.TEXT
WHERE mn.COMPONENT = 'App' AND mn.`KEY` LIKE 'mn_report_type_%_title';

UPDATE dictionary3 mn
JOIN dictionary3 rv
  ON rv.LANG = mn.LANG
  AND rv.COMPONENT = 'ReportsView'
  AND rv.`KEY` = CONCAT('report_type_', SUBSTRING_INDEX(SUBSTRING_INDEX(mn.`KEY`, 'mn_report_type_', -1), '_desc', 1))
SET mn.TEXT = CASE mn.LANG
  WHEN 'ru' THEN CONCAT('Отдельный быстрый доступ к отчету «', rv.TEXT, '»')
  WHEN 'en' THEN CONCAT('Direct quick access to the ', rv.TEXT, ' report')
  WHEN 'ua' THEN CONCAT('Окремий швидкий доступ до звіту «', rv.TEXT, '»')
  WHEN 'de' THEN CONCAT('Direkter Schnellzugriff auf den Bericht „', rv.TEXT, '“')
  WHEN 'es' THEN CONCAT('Acceso rápido directo al informe “', rv.TEXT, '”')
  WHEN 'fr' THEN CONCAT('Accès rapide direct au rapport «', rv.TEXT, '»')
  WHEN 'it' THEN CONCAT('Accesso rapido diretto al report «', rv.TEXT, '»')
  WHEN 'pt' THEN CONCAT('Acesso rápido direto ao relatório “', rv.TEXT, '”')
  WHEN 'pl' THEN CONCAT('Szybki bezpośredni dostęp do raportu „', rv.TEXT, '”')
  WHEN 'tr' THEN CONCAT('"', rv.TEXT, '" raporuna doğrudan hızlı erişim')
  WHEN 'ja' THEN CONCAT('「', rv.TEXT, '」レポートへのクイックアクセス')
  WHEN 'zh' THEN CONCAT('直接快速访问"', rv.TEXT, '"报表')
  WHEN 'kz' THEN CONCAT('«', rv.TEXT, '» есебіне тікелей жылдам қолжеткізу')
  WHEN 'id' THEN CONCAT('Akses cepat langsung ke laporan ', rv.TEXT)
  WHEN 'ms' THEN CONCAT('Akses pantas terus ke laporan ', rv.TEXT)
  WHEN 'vn' THEN CONCAT('Truy cập nhanh trực tiếp tới báo cáo "', rv.TEXT, '"')
  WHEN 'th' THEN CONCAT('เข้าถึงรายงาน "', rv.TEXT, '" โดยตรง')
  WHEN 'ar' THEN CONCAT('وصول سريع مباشر إلى تقرير ', rv.TEXT)
  ELSE CONCAT('Direct quick access to the ', rv.TEXT, ' report')
END
WHERE mn.COMPONENT = 'App' AND mn.`KEY` LIKE 'mn_report_type_%_desc';

-- Отчет типа 35 (Программы): короткая подпись в стиле остальных карточек ("Курсы" -> "Отчеты по направлениям курсов")
UPDATE dictionary3 SET TEXT = CASE LANG
  WHEN 'ru' THEN 'Отчеты по программам'
  WHEN 'en' THEN 'Program reports'
  WHEN 'ua' THEN 'Звіти за програмами'
  WHEN 'de' THEN 'Berichte zu Programmen'
  WHEN 'es' THEN 'Informes de programas'
  WHEN 'fr' THEN 'Rapports sur les programmes'
  WHEN 'it' THEN 'Report sui programmi'
  WHEN 'pt' THEN 'Relatórios de programas'
  WHEN 'pl' THEN 'Raporty programów'
  WHEN 'tr' THEN 'Program raporları'
  WHEN 'ja' THEN 'プログラムレポート'
  WHEN 'zh' THEN '项目报告'
  WHEN 'kz' THEN 'Бағдарламалар бойынша есептер'
  WHEN 'id' THEN 'Laporan program'
  WHEN 'ms' THEN 'Laporan program'
  WHEN 'vn' THEN 'Báo cáo chương trình'
  WHEN 'th' THEN 'รายงานโปรแกรม'
  WHEN 'ar' THEN 'تقارير البرامج'
  ELSE 'Program reports'
END
WHERE COMPONENT='App' AND `KEY`='mn_report_type_35_desc';
