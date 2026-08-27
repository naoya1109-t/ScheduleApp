CREATE TABLE holiday (
    holiday_id   INT IDENTITY(1,1) PRIMARY KEY,
    holiday_date DATE NOT NULL,
    name         NVARCHAR(100) NOT NULL,
    fiscal_year  INT NOT NULL,
    CONSTRAINT uq_holiday_date UNIQUE (holiday_date)
);
