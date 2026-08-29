ALTER TABLE meeting_room DROP COLUMN capacity;
ALTER TABLE meeting_room DROP COLUMN equipment;
ALTER TABLE meeting_room ADD memo NVARCHAR(500) NULL;
ALTER TABLE meeting_room ADD display_order INT NOT NULL DEFAULT 0;
