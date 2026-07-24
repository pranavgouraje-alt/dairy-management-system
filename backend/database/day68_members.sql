
CREATE DATABASE IF NOT EXISTS dairy_management_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE dairy_management_system;


CREATE TABLE IF NOT EXISTS members (
    member_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    village VARCHAR(150) NULL,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (member_id),

    INDEX idx_members_name (name),
    INDEX idx_members_mobile (mobile),
    INDEX idx_members_village (village),
    INDEX idx_members_status (status)
);


INSERT INTO members (
    member_id,
    name,
    mobile,
    village,
    status
)
VALUES
(
    '1',
    'Pranav Rajendra Gouraje',
    '9876543210',
    'Kolhapur',
    'Active'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name);


SELECT * FROM members;