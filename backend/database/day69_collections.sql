
USE dairy_management_system;


SHOW TABLES LIKE 'members';


CREATE TABLE IF NOT EXISTS collections (
    collection_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    member_id VARCHAR(50) NOT NULL,
    member_name VARCHAR(150) NOT NULL,

    collection_date DATE NOT NULL,
    collection_time VARCHAR(30) NOT NULL,

    milk_type ENUM(
        'Cow',
        'Buffalo'
    ) NOT NULL,

    session ENUM(
        'Morning',
        'Evening'
    ) NOT NULL,

    quantity DECIMAL(10, 2) NOT NULL,
    fat DECIMAL(5, 2) NOT NULL,
    snf DECIMAL(5, 2) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (collection_id),

   
    CONSTRAINT uq_collection_entry UNIQUE (
        member_id,
        collection_date,
        session,
        milk_type
    ),

 
    CONSTRAINT fk_collections_member
        FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_collection_date (
        collection_date
    ),

    INDEX idx_collection_member (
        member_id
    ),

    INDEX idx_collection_session (
        session
    ),

    INDEX idx_collection_milk_type (
        milk_type
    )
)
ENGINE = InnoDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

DESCRIBE collections;

SHOW CREATE TABLE collections;

SELECT * FROM collections;