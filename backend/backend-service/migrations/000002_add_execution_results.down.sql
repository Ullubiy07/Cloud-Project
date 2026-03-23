ALTER TABLE run_requests 
DROP COLUMN error_message,
DROP COLUMN exit_code,
DROP COLUMN stderr,
DROP COLUMN stdout;
