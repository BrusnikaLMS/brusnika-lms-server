-- Missing dictionary3 row for label_task_mode (COMPONENT='ManageAssessment360View').
-- Same root cause as fix_missing_report_translations.sql: client DB never received it.

INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('ru','ManageAssessment360View','label_task_mode','Постановка задач');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('en','ManageAssessment360View','label_task_mode','Task Assignment');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('ua','ManageAssessment360View','label_task_mode','Постановка завдань');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('fr','ManageAssessment360View','label_task_mode','Attribution des tâches');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('it','ManageAssessment360View','label_task_mode','Assegnazione attività');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('de','ManageAssessment360View','label_task_mode','Aufgabenzuweisung');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('tr','ManageAssessment360View','label_task_mode','Görev Atama');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('pl','ManageAssessment360View','label_task_mode','Przydzielanie zadań');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('pt','ManageAssessment360View','label_task_mode','Atribuição de Tarefas');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('es','ManageAssessment360View','label_task_mode','Asignación de Tareas');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('vn','ManageAssessment360View','label_task_mode','Giao nhiệm vụ');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('zh','ManageAssessment360View','label_task_mode','任务分配');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('ja','ManageAssessment360View','label_task_mode','タスク割り当て');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('kz','ManageAssessment360View','label_task_mode','Тапсырма беру');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('ar','ManageAssessment360View','label_task_mode','تعيين المهام');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('id','ManageAssessment360View','label_task_mode','Penugasan Tugas');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('ms','ManageAssessment360View','label_task_mode','Penugasan Tugasan');
INSERT IGNORE INTO `dictionary3` (LANG, COMPONENT, `KEY`, TEXT) VALUES ('th','ManageAssessment360View','label_task_mode','การมอบหมายงาน');
