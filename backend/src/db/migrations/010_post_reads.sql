CREATE TABLE post_read (
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_post_read PRIMARY KEY (post_id, user_id),
    CONSTRAINT fk_post_read_post FOREIGN KEY (post_id) REFERENCES post (post_id),
    CONSTRAINT fk_post_read_user FOREIGN KEY (user_id) REFERENCES app_user (user_id)
);
