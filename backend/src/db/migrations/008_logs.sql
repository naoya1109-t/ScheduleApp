CREATE TABLE operation_log (
    log_id      BIGINT IDENTITY(1,1) PRIMARY KEY,
    actor_id    INT NOT NULL,
    target_type NVARCHAR(30) NOT NULL,
    target_id   NVARCHAR(50) NOT NULL,
    action      NVARCHAR(30) NOT NULL,
    occurred_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_operation_log_actor FOREIGN KEY (actor_id) REFERENCES app_user (user_id)
);

CREATE INDEX ix_operation_log_target ON operation_log (target_type, target_id);
