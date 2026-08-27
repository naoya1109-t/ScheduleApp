CREATE TABLE meeting_room (
    room_id   INT IDENTITY(1,1) PRIMARY KEY,
    name      NVARCHAR(100) NOT NULL,
    capacity  INT NULL,
    equipment NVARCHAR(255) NULL
);

CREATE TABLE room_reservation (
    reservation_id  INT IDENTITY(1,1) PRIMARY KEY,
    room_id         INT NOT NULL,
    reserver_id     INT NOT NULL,
    start_at        DATETIME2 NOT NULL,
    end_at          DATETIME2 NOT NULL,
    linked_event_id INT NULL,
    CONSTRAINT fk_room_reservation_room FOREIGN KEY (room_id) REFERENCES meeting_room (room_id),
    CONSTRAINT fk_room_reservation_reserver FOREIGN KEY (reserver_id) REFERENCES app_user (user_id),
    CONSTRAINT fk_room_reservation_event FOREIGN KEY (linked_event_id) REFERENCES calendar_event (event_id)
);

-- 二重予約防止は、同一room_idでの時間帯重複チェックをアプリ層のトランザクション内で行う。
-- 重複判定を高速化するための索引。
CREATE INDEX ix_room_reservation_room_period ON room_reservation (room_id, start_at, end_at);
