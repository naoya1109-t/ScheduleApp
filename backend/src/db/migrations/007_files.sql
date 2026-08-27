CREATE TABLE folder (
    folder_id        INT IDENTITY(1,1) PRIMARY KEY,
    parent_folder_id INT NULL,
    name             NVARCHAR(255) NOT NULL,
    CONSTRAINT fk_folder_parent FOREIGN KEY (parent_folder_id) REFERENCES folder (folder_id)
);

CREATE TABLE file_item (
    file_id        INT IDENTITY(1,1) PRIMARY KEY,
    folder_id      INT NOT NULL,
    file_name      NVARCHAR(255) NOT NULL,
    current_path   NVARCHAR(500) NOT NULL,
    updated_by     INT NOT NULL,
    updated_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    permalink_slug NVARCHAR(50) NOT NULL,
    CONSTRAINT fk_file_item_folder FOREIGN KEY (folder_id) REFERENCES folder (folder_id),
    CONSTRAINT fk_file_item_updated_by FOREIGN KEY (updated_by) REFERENCES app_user (user_id),
    CONSTRAINT uq_file_item_permalink_slug UNIQUE (permalink_slug)
);

CREATE TABLE file_version (
    version_id INT IDENTITY(1,1) PRIMARY KEY,
    file_id    INT NOT NULL,
    version_no INT NOT NULL,
    file_path  NVARCHAR(500) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_file_version_file FOREIGN KEY (file_id) REFERENCES file_item (file_id),
    CONSTRAINT uq_file_version_file_version UNIQUE (file_id, version_no)
);
