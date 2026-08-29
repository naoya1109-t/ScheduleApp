CREATE TABLE incident_report (
    report_id         INT IDENTITY(1,1) PRIMARY KEY,
    customer_code     NVARCHAR(50)  NOT NULL,
    customer_name     NVARCHAR(200) NULL,
    sales_rep_id      INT NOT NULL,
    reporter_id       INT NOT NULL,
    product_name      NVARCHAR(200) NULL,
    customer_info     NVARCHAR(500) NULL,
    incident_category NVARCHAR(50) NULL,
    incident_content  NVARCHAR(MAX) NULL,
    response_status   NVARCHAR(200) NULL,
    action_taken      NVARCHAR(MAX) NULL,
    description       NVARCHAR(MAX) NULL,
    return_warehouse  NVARCHAR(100) NULL,
    check_status      NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (check_status IN ('pending', 'checked')),
    checked_by        INT NULL,
    checked_at        DATETIME2 NULL,
    notified_by       INT NULL,
    notified_at       DATETIME2 NULL,
    occurred_at       DATETIME2 NOT NULL,
    created_at        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_incident_report_sales_rep FOREIGN KEY (sales_rep_id) REFERENCES app_user (user_id),
    CONSTRAINT fk_incident_report_reporter FOREIGN KEY (reporter_id) REFERENCES app_user (user_id),
    CONSTRAINT fk_incident_report_checked_by FOREIGN KEY (checked_by) REFERENCES app_user (user_id),
    CONSTRAINT fk_incident_report_notified_by FOREIGN KEY (notified_by) REFERENCES app_user (user_id)
);

CREATE INDEX ix_incident_report_sales_rep ON incident_report (sales_rep_id);
CREATE INDEX ix_incident_report_customer_code ON incident_report (customer_code);
