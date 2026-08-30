ALTER TABLE calendar_event ADD created_by INT NULL;
ALTER TABLE calendar_event ADD CONSTRAINT fk_calendar_event_created_by FOREIGN KEY (created_by) REFERENCES app_user (user_id);
UPDATE calendar_event SET created_by = owner_id WHERE created_by IS NULL;
