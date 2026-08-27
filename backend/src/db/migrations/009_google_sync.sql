CREATE TABLE google_calendar_link (
    user_id                       INT NOT NULL PRIMARY KEY,
    secondary_calendar_id         NVARCHAR(255) NOT NULL,
    oauth_refresh_token_encrypted NVARCHAR(500) NOT NULL,
    webhook_channel_id            NVARCHAR(255) NULL,
    webhook_expiration            DATETIME2 NULL,
    sync_status                   NVARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT fk_google_calendar_link_user FOREIGN KEY (user_id) REFERENCES app_user (user_id)
);
