ALTER TABLE run_requests 
ADD COLUMN stdout TEXT,
ADD COLUMN stderr TEXT,
ADD COLUMN exit_code INT,
ADD COLUMN error_message TEXT;
