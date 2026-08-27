CREATE TABLE app_user (
    user_id        INT IDENTITY(1,1) PRIMARY KEY,
    login_id       NVARCHAR(50)  NOT NULL,
    password_hash  NVARCHAR(255) NOT NULL,
    name           NVARCHAR(100) NOT NULL,
    email          NVARCHAR(255) NULL,
    employee_no    NVARCHAR(50)  NULL,
    role           NVARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'general')),
    status         NVARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired')),
    CONSTRAINT uq_app_user_login_id UNIQUE (login_id)
);

CREATE TABLE app_group (
    group_id INT IDENTITY(1,1) PRIMARY KEY,
    name     NVARCHAR(100) NOT NULL
);

CREATE TABLE user_group (
    user_id  INT NOT NULL,
    group_id INT NOT NULL,
    CONSTRAINT pk_user_group PRIMARY KEY (user_id, group_id),
    CONSTRAINT fk_user_group_user FOREIGN KEY (user_id) REFERENCES app_user (user_id),
    CONSTRAINT fk_user_group_group FOREIGN KEY (group_id) REFERENCES app_group (group_id)
);
