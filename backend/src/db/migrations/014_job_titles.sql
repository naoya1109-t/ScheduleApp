CREATE TABLE job_title (
    job_title_id INT IDENTITY(1,1) PRIMARY KEY,
    name         NVARCHAR(100) NOT NULL
);

ALTER TABLE app_user ADD job_title_id INT NULL;
ALTER TABLE app_user ADD CONSTRAINT fk_app_user_job_title FOREIGN KEY (job_title_id) REFERENCES job_title (job_title_id);
