CREATE TABLE post (
    post_id          INT IDENTITY(1,1) PRIMARY KEY,
    author_id        INT NOT NULL,
    title            NVARCHAR(200) NOT NULL,
    body_html        NVARCHAR(MAX) NOT NULL,
    visibility_scope NVARCHAR(20) NOT NULL CHECK (visibility_scope IN ('company', 'group')),
    group_id         INT NULL,
    updated_at       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    permalink_slug   NVARCHAR(50) NOT NULL,
    CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES app_user (user_id),
    CONSTRAINT fk_post_group FOREIGN KEY (group_id) REFERENCES app_group (group_id),
    CONSTRAINT uq_post_permalink_slug UNIQUE (permalink_slug)
);

CREATE TABLE post_comment (
    comment_id INT IDENTITY(1,1) PRIMARY KEY,
    post_id    INT NOT NULL,
    author_id  INT NOT NULL,
    body       NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_post_comment_post FOREIGN KEY (post_id) REFERENCES post (post_id),
    CONSTRAINT fk_post_comment_author FOREIGN KEY (author_id) REFERENCES app_user (user_id)
);

CREATE TABLE post_attachment (
    attachment_id INT IDENTITY(1,1) PRIMARY KEY,
    post_id       INT NOT NULL,
    file_path     NVARCHAR(500) NOT NULL,
    file_name     NVARCHAR(255) NOT NULL,
    CONSTRAINT fk_post_attachment_post FOREIGN KEY (post_id) REFERENCES post (post_id)
);
