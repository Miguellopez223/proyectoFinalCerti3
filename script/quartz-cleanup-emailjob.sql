-- Limpieza de un job/trigger huérfano persistido en el job store JDBC de Quartz.
--
-- Origen del problema: el proyecto del docente registraba un job
-- com.upb.ecommerce.api.jobs.EmailSenderJob (grupo EMAIL_JOB_GROUP). Esa clase
-- ya no existe en este proyecto (ahora hay NotificacionJob en el paquete
-- com.upb.ecommerce.api.job), pero las filas quedaron guardadas en las tablas
-- qrtz_* de la base de datos. Al arrancar, Quartz intenta recuperar el trigger
-- desfasado, no encuentra la clase y lanza ClassNotFoundException.
--
-- Este script borra solo las filas de ese job/trigger. El orden respeta las FKs
-- (primero los triggers/estados, luego el job_detail).
--
-- Uso:
--   psql -U postgres -d ecommerceUPB -f script/quartz-cleanup-emailjob.sql

DELETE FROM qrtz_simple_triggers
 WHERE trigger_group = 'EMAIL_JOB_GROUP';

DELETE FROM qrtz_cron_triggers
 WHERE trigger_group = 'EMAIL_JOB_GROUP';

DELETE FROM qrtz_simprop_triggers
 WHERE trigger_group = 'EMAIL_JOB_GROUP';

DELETE FROM qrtz_blob_triggers
 WHERE trigger_group = 'EMAIL_JOB_GROUP';

DELETE FROM qrtz_fired_triggers
 WHERE job_group = 'EMAIL_JOB_GROUP';

DELETE FROM qrtz_triggers
 WHERE trigger_group = 'EMAIL_JOB_GROUP';

DELETE FROM qrtz_job_details
 WHERE job_group = 'EMAIL_JOB_GROUP';
