CREATE TABLE top_page_setting (
    setting_id          INT IDENTITY(1,1) PRIMARY KEY,
    board_display_count INT NOT NULL DEFAULT 5,
    file_display_count  INT NOT NULL DEFAULT 5
);

-- 全社員共通の設定値を1行だけ保持する(要件定義書3-3章)
INSERT INTO top_page_setting (board_display_count, file_display_count) VALUES (5, 5);

CREATE TABLE group_member_order (
    group_id      INT NOT NULL,
    user_id       INT NOT NULL,
    display_order INT NOT NULL,
    CONSTRAINT pk_group_member_order PRIMARY KEY (group_id, user_id),
    CONSTRAINT fk_group_member_order_group FOREIGN KEY (group_id) REFERENCES app_group (group_id),
    CONSTRAINT fk_group_member_order_user FOREIGN KEY (user_id) REFERENCES app_user (user_id)
);
