CREATE TABLE calendar_event (
    event_id        INT IDENTITY(1,1) PRIMARY KEY,
    owner_id        INT NOT NULL,
    title           NVARCHAR(200) NOT NULL,
    start_at        DATETIME2 NOT NULL,
    end_at          DATETIME2 NOT NULL,
    visibility      NVARCHAR(10) NOT NULL CHECK (visibility IN ('self', 'all')),
    is_hidden       BIT NOT NULL DEFAULT 0,
    is_recurring    BIT NOT NULL DEFAULT 0,
    recurrence_rule NVARCHAR(255) NULL,
    event_type      NVARCHAR(30) NOT NULL DEFAULT 'personal' CHECK (event_type IN ('personal', 'company_holiday')),
    CONSTRAINT fk_calendar_event_owner FOREIGN KEY (owner_id) REFERENCES app_user (user_id)
);

CREATE INDEX ix_calendar_event_owner_period ON calendar_event (owner_id, start_at, end_at);
