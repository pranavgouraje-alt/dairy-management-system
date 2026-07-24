

CREATE DATABASE IF NOT EXISTS dairy_management_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE  dairy_management_system;


CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    name VARCHAR(100)
        NOT NULL,

    username VARCHAR(50
    )
        NOT NULL,

    email VARCHAR(150)
        NULL,

    password_hash VARCHAR(255)
        NOT NULL,

    role ENUM(
        'Admin',
        'Operator'
    )
        NOT NULL DEFAULT 'Operator',

    status ENUM(
        'Active',
        'Inactive'
    )
        NOT NULL DEFAULT 'Active',

    last_login_at DATETIME
        NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),

    UNIQUE KEY uq_users_username (
        username
    ),

    UNIQUE KEY uq_users_email (
        email
    ),

    INDEX idx_users_role (
        role
    ),

    INDEX idx_users_status (
        status
    )
)
ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS members (
    member_id VARCHAR(30)
        NOT NULL,

    name VARCHAR(120)
        NOT NULL,

    mobile VARCHAR(15)
        NOT NULL,

    village VARCHAR(120)
        NULL,

    status ENUM(
        'Active',
        'Inactive'
    )
        NOT NULL DEFAULT 'Active',

    created_by BIGINT UNSIGNED
        NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (member_id),

    UNIQUE KEY uq_members_mobile (
        mobile
    ),

    INDEX idx_members_name (
        name
    ),

    INDEX idx_members_village (
        village
    ),

    INDEX idx_members_status (
        status
    ),

    CONSTRAINT fk_members_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
)
ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS rates (
    rate_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    milk_type ENUM(
        'Cow',
        'Buffalo'
    )
        NOT NULL,

    fat DECIMAL(4, 1)
        NOT NULL,

    snf DECIMAL(4, 1)
        NOT NULL,

    rate_per_litre DECIMAL(10, 2)
        NOT NULL,

    effective_from DATE
        NOT NULL,

    effective_to DATE
        NULL,

    status ENUM(
        'Active',
        'Inactive'
    )
        NOT NULL DEFAULT 'Active',

    created_by BIGINT UNSIGNED
        NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (rate_id),

    UNIQUE KEY uq_active_rate_combination (
        milk_type,
        fat,
        snf,
        effective_from
    ),

    INDEX idx_rates_lookup (
        milk_type,
        fat,
        snf,
        status
    ),

    CONSTRAINT chk_rates_fat
        CHECK (fat > 0),

    CONSTRAINT chk_rates_snf
        CHECK (snf > 0),

    CONSTRAINT chk_rates_amount
        CHECK (rate_per_litre > 0),

    CONSTRAINT fk_rates_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
)
ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS rate_history (
    history_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    rate_id BIGINT UNSIGNED
        NULL,

    milk_type ENUM(
        'Cow',
        'Buffalo'
    )
        NOT NULL,

    fat DECIMAL(4, 1)
        NOT NULL,

    snf DECIMAL(4, 1)
        NOT NULL,

    old_rate DECIMAL(10, 2)
        NULL,

    new_rate DECIMAL(10, 2)
        NULL,

    action ENUM(
        'Created',
        'Updated',
        'Deleted',
        'Activated',
        'Deactivated'
    )
        NOT NULL,

    changed_by BIGINT UNSIGNED
        NULL,

    changed_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (history_id),

    INDEX idx_rate_history_rate (
        rate_id
    ),

    INDEX idx_rate_history_date (
        changed_at
    ),

    CONSTRAINT fk_rate_history_rate
        FOREIGN KEY (rate_id)
        REFERENCES rates(rate_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_rate_history_user
        FOREIGN KEY (changed_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
)
ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS collections (
    collection_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    member_id VARCHAR(30)
        NOT NULL,

    collection_date DATE
        NOT NULL,

    collection_time TIME
        NOT NULL,

    session ENUM(
        'Morning',
        'Evening'
    )
        NOT NULL,

    milk_type ENUM(
        'Cow',
        'Buffalo'
    )
        NOT NULL,

    quantity DECIMAL(10, 2)
        NOT NULL,

    fat DECIMAL(4, 1)
        NOT NULL,

    snf DECIMAL(4, 1)
        NOT NULL,

    rate_per_litre DECIMAL(10, 2)
        NOT NULL,

    amount DECIMAL(12, 2)
        NOT NULL,

    created_by BIGINT UNSIGNED
        NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (collection_id),


    UNIQUE KEY uq_collection_entry (
        member_id,
        collection_date,
        session,
        milk_type
    ),

    INDEX idx_collections_date (
        collection_date
    ),

    INDEX idx_collections_member_date (
        member_id,
        collection_date
    ),

    INDEX idx_collections_session (
        session
    ),

    INDEX idx_collections_milk_type (
        milk_type
    ),

    CONSTRAINT chk_collection_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_collection_fat
        CHECK (fat > 0),

    CONSTRAINT chk_collection_snf
        CHECK (snf > 0),

    CONSTRAINT chk_collection_rate
        CHECK (rate_per_litre > 0),

    CONSTRAINT chk_collection_amount
        CHECK (amount >= 0),

    CONSTRAINT fk_collections_member
        FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_collections_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
)
ENGINE = InnoDB;



CREATE TABLE IF NOT EXISTS feed_records (
    feed_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    member_id VARCHAR(30)
        NOT NULL,

    feed_type VARCHAR(120)
        NOT NULL,

    quantity DECIMAL(10, 2)
        NOT NULL,

    rate DECIMAL(10, 2)
        NOT NULL,

    amount DECIMAL(12, 2)
        NOT NULL,

    remaining_amount DECIMAL(12, 2)
        NOT NULL,

    feed_date DATE
        NOT NULL,

    status ENUM(
        'Unpaid',
        'Partially Paid',
        'Paid',
        'Deducted'
    )
        NOT NULL DEFAULT 'Unpaid',

    created_by BIGINT UNSIGNED
        NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (feed_id),

    INDEX idx_feed_member (
        member_id
    ),

    INDEX idx_feed_date (
        feed_date
    ),

    INDEX idx_feed_status (
        status
    ),

    CONSTRAINT chk_feed_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_feed_rate
        CHECK (rate > 0),

    CONSTRAINT chk_feed_amount
        CHECK (amount >= 0),

    CONSTRAINT chk_feed_remaining
        CHECK (remaining_amount >= 0),

    CONSTRAINT fk_feed_member
        FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_feed_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
)
ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS advance_records (
    advance_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    member_id VARCHAR(30)
        NOT NULL,

    amount DECIMAL(12, 2)
        NOT NULL,

    remaining_amount DECIMAL(12, 2)
        NOT NULL,

    advance_date DATE
        NOT NULL,

    reason VARCHAR(255)
        NULL,

    status ENUM(
        'Pending',
        'Partially Paid',
        'Cleared'
    )
        NOT NULL DEFAULT 'Pending',

    created_by BIGINT UNSIGNED
        NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (advance_id),

    INDEX idx_advance_member (
        member_id
    ),

    INDEX idx_advance_date (
        advance_date
    ),

    INDEX idx_advance_status (
        status
    ),

    CONSTRAINT chk_advance_amount
        CHECK (amount > 0),

    CONSTRAINT chk_advance_remaining
        CHECK (remaining_amount >= 0),

    CONSTRAINT fk_advance_member
        FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_advance_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
)
ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS bills (
    bill_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    member_id VARCHAR(30)
        NOT NULL,

    bill_month CHAR(7)
        NOT NULL,

    bill_cycle TINYINT UNSIGNED
        NOT NULL,

    from_date DATE
        NOT NULL,

    to_date DATE
        NOT NULL,

    financial_year VARCHAR(9)
        NOT NULL,

    cow_milk DECIMAL(12, 2)
        NOT NULL DEFAULT 0,

    buffalo_milk DECIMAL(12, 2)
        NOT NULL DEFAULT 0,

    total_milk DECIMAL(12, 2)
        NOT NULL DEFAULT 0,

    cow_amount DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    buffalo_amount DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    milk_amount DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    reserve_amount DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    feed_due DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    feed_deducted DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    advance_due DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    advance_deducted DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    total_deduction DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    remaining_due DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    net_payable DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    status ENUM(
        'Generated',
        'Approved',
        'Partially Paid',
        'Paid',
        'Cancelled'
    )
        NOT NULL DEFAULT 'Generated',

    generated_by BIGINT UNSIGNED
        NULL,

    generated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (bill_id),

    UNIQUE KEY uq_member_bill_cycle (
        member_id,
        bill_month,
        bill_cycle
    ),

    INDEX idx_bills_member (
        member_id
    ),

    INDEX idx_bills_period (
        from_date,
        to_date
    ),

    INDEX idx_bills_status (
        status
    ),

    CONSTRAINT chk_bill_cycle
        CHECK (
            bill_cycle BETWEEN 1 AND 3
        ),

    CONSTRAINT chk_bill_dates
        CHECK (
            to_date >= from_date
        ),

    CONSTRAINT fk_bills_member
        FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_bills_user
        FOREIGN KEY (generated_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
)
ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS bill_collection_items (
    bill_item_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    bill_id BIGINT UNSIGNED
        NOT NULL,

    collection_id BIGINT UNSIGNED
        NOT NULL,

    quantity DECIMAL(10, 2)
        NOT NULL,

    rate_per_litre DECIMAL(10, 2)
        NOT NULL,

    amount DECIMAL(12, 2)
        NOT NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (bill_item_id),

    UNIQUE KEY uq_bill_collection (
        bill_id,
        collection_id
    ),

    INDEX idx_bill_items_bill (
        bill_id
    ),

    INDEX idx_bill_items_collection (
        collection_id
    ),

    CONSTRAINT fk_bill_items_bill
        FOREIGN KEY (bill_id)
        REFERENCES bills(bill_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_bill_items_collection
        FOREIGN KEY (collection_id)
        REFERENCES collections(collection_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)
ENGINE = InnoDB;




CREATE TABLE IF NOT EXISTS bill_feed_deductions (
    deduction_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    bill_id BIGINT UNSIGNED
        NOT NULL,

    feed_id BIGINT UNSIGNED
        NOT NULL,

    deducted_amount DECIMAL(12, 2)
        NOT NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (deduction_id),

    UNIQUE KEY uq_bill_feed_deduction (
        bill_id,
        feed_id
    ),

    CONSTRAINT chk_feed_deduction
        CHECK (deducted_amount > 0),

    CONSTRAINT fk_bill_feed_bill
        FOREIGN KEY (bill_id)
        REFERENCES bills(bill_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_bill_feed_record
        FOREIGN KEY (feed_id)
        REFERENCES feed_records(feed_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)
ENGINE = InnoDB;



CREATE TABLE IF NOT EXISTS bill_advance_deductions (
    deduction_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    bill_id BIGINT UNSIGNED
        NOT NULL,

    advance_id BIGINT UNSIGNED
        NOT NULL,

    deducted_amount DECIMAL(12, 2)
        NOT NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (deduction_id),

    UNIQUE KEY uq_bill_advance_deduction (
        bill_id,
        advance_id
    ),

    CONSTRAINT chk_advance_deduction
        CHECK (deducted_amount > 0),

    CONSTRAINT fk_bill_advance_bill
        FOREIGN KEY (bill_id)
        REFERENCES bills(bill_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_bill_advance_record
        FOREIGN KEY (advance_id)
        REFERENCES advance_records(advance_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)
ENGINE = InnoDB;


CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    bill_id BIGINT UNSIGNED
        NOT NULL,

    member_id VARCHAR(30)
        NOT NULL,

    payment_amount DECIMAL(14, 2)
        NOT NULL,

    payment_date DATE
        NOT NULL,

    payment_method ENUM(
        'Cash',
        'Bank Transfer',
        'UPI',
        'Cheque',
        'Other'
    )
        NOT NULL DEFAULT 'Cash',

    reference_number VARCHAR(100)
        NULL,

    status ENUM(
        'Pending',
        'Completed',
        'Failed',
        'Cancelled'
    )
        NOT NULL DEFAULT 'Completed',

    notes VARCHAR(255)
        NULL,

    created_by BIGINT UNSIGNED
        NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (payment_id),

    INDEX idx_payments_bill (
        bill_id
    ),

    INDEX idx_payments_member (
        member_id
    ),

    INDEX idx_payments_date (
        payment_date
    ),

    CONSTRAINT chk_payment_amount
        CHECK (payment_amount > 0),

    CONSTRAINT fk_payments_bill
        FOREIGN KEY (bill_id)
        REFERENCES bills(bill_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_payments_member
        FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_payments_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
)
ENGINE = InnoDB;



CREATE TABLE IF NOT EXISTS reserve_records (
    reserve_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    member_id VARCHAR(30)
        NOT NULL,

    bill_id BIGINT UNSIGNED
        NOT NULL,

    financial_year VARCHAR(9)
        NOT NULL,

    reserve_amount DECIMAL(14, 2)
        NOT NULL,

    interest_rate DECIMAL(6, 3)
        NOT NULL DEFAULT 0,

    interest_amount DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    cow_bonus_rate DECIMAL(6, 3)
        NOT NULL DEFAULT 0,

    buffalo_bonus_rate DECIMAL(6, 3)
        NOT NULL DEFAULT 0,

    bonus_amount DECIMAL(14, 2)
        NOT NULL DEFAULT 0,

    status ENUM(
        'Reserved',
        'Calculated',
        'Paid',
        'Carried Forward'
    )
        NOT NULL DEFAULT 'Reserved',

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (reserve_id),

    UNIQUE KEY uq_reserve_bill (
        bill_id
    ),

    INDEX idx_reserve_member_year (
        member_id,
        financial_year
    ),

    INDEX idx_reserve_status (
        status
    ),

    CONSTRAINT chk_reserve_amount
        CHECK (reserve_amount >= 0),

    CONSTRAINT fk_reserve_member
        FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_reserve_bill
        FOREIGN KEY (bill_id)
        REFERENCES bills(bill_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT UNSIGNED
        NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED
        NULL,

    action VARCHAR(80)
        NOT NULL,

    entity_type VARCHAR(80)
        NOT NULL,

    entity_id VARCHAR(100)
        NULL,

    old_values JSON
        NULL,

    new_values JSON
        NULL,

    ip_address VARCHAR(45)
        NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (audit_id),

    INDEX idx_audit_user (
        user_id
    ),

    INDEX idx_audit_entity (
        entity_type,
        entity_id
    ),

    INDEX idx_audit_date (
        created_at
    ),

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
)
ENGINE = InnoDB;




SHOW TABLES;