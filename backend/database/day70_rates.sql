USE dairy_management_system;



CREATE TABLE IF NOT EXISTS rates (
    rate_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    milk_type ENUM(
        'Cow',
        'Buffalo'
    ) NOT NULL,

    fat DECIMAL(5, 2) NOT NULL,

    snf DECIMAL(5, 2) NOT NULL,

    rate DECIMAL(10, 2) NOT NULL,

    status ENUM(
        'Active',
        'Inactive'
    ) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (rate_id),

    CONSTRAINT unique_active_rate_combination
        UNIQUE (
            milk_type,
            fat,
            snf
        ),

    INDEX idx_rates_milk_type (
        milk_type
    ),

    INDEX idx_rates_fat (
        fat
    ),

    INDEX idx_rates_snf (
        snf
    ),

    INDEX idx_rates_status (
        status
    )
);


CREATE TABLE IF NOT EXISTS rate_history (
    history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    rate_id BIGINT UNSIGNED NULL,

    action ENUM(
        'Created',
        'Updated',
        'Deleted'
    ) NOT NULL,

    milk_type ENUM(
        'Cow',
        'Buffalo'
    ) NOT NULL,

    fat DECIMAL(5, 2) NOT NULL,

    snf DECIMAL(5, 2) NOT NULL,

    old_rate DECIMAL(10, 2) NULL,

    new_rate DECIMAL(10, 2) NULL,

    changed_date DATE NOT NULL,

    changed_time TIME NOT NULL,

    changed_by VARCHAR(100) NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (history_id),

    INDEX idx_rate_history_rate (
        rate_id
    ),

    INDEX idx_rate_history_date (
        changed_date
    ),

    INDEX idx_rate_history_milk_type (
        milk_type
    )
);



INSERT INTO rates (
    milk_type,
    fat,
    snf,
    rate,
    status
)
VALUES
(
    'Cow',
    2.10,
    8.50,
    30.00,
    'Active'
),
(
    'Cow',
    4.00,
    8.50,
    38.00,
    'Active'
),
(
    'Cow',
    5.00,
    8.50,
    40.00,
    'Active'
),
(
    'Buffalo',
    6.50,
    9.00,
    55.00,
    'Active'
),
(
    'Buffalo',
    8.00,
    9.00,
    62.00,
    'Active'
),
(
    'Buffalo',
    11.00,
    9.00,
    70.00,
    'Active'
)
ON DUPLICATE KEY UPDATE
    rate = VALUES(rate),
    status = 'Active';


SELECT * FROM rates;

SELECT * FROM rate_history;