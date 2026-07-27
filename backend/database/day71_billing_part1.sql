USE dairy_management_system;


CREATE TABLE IF NOT EXISTS bills (
    bill_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    bill_number VARCHAR(50) NOT NULL,

    member_id VARCHAR(50) NOT NULL,

    bill_month CHAR(7) NOT NULL,

    bill_cycle TINYINT UNSIGNED NOT NULL,

    period_from DATE NOT NULL,

    period_to DATE NOT NULL,

    cow_milk DECIMAL(12, 2) NOT NULL DEFAULT 0,

    buffalo_milk DECIMAL(12, 2) NOT NULL DEFAULT 0,

    total_milk DECIMAL(12, 2) NOT NULL DEFAULT 0,

    cow_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,

    buffalo_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,

    milk_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,

    average_fat DECIMAL(7, 2) NOT NULL DEFAULT 0,

    average_snf DECIMAL(7, 2) NOT NULL DEFAULT 0,

    feed_due DECIMAL(14, 2) NOT NULL DEFAULT 0,

    feed_deducted DECIMAL(14, 2) NOT NULL DEFAULT 0,

    advance_due DECIMAL(14, 2) NOT NULL DEFAULT 0,

    advance_deducted DECIMAL(14, 2) NOT NULL DEFAULT 0,

    other_deduction DECIMAL(14, 2) NOT NULL DEFAULT 0,

    reserve_percent DECIMAL(5, 2) NOT NULL DEFAULT 10,

    reserve_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,

    total_deduction DECIMAL(14, 2) NOT NULL DEFAULT 0,

    net_payable DECIMAL(14, 2) NOT NULL DEFAULT 0,

    paid_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,

    balance_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,

    status ENUM(
        'Pending',
        'Partially Paid',
        'Paid',
        'Cancelled'
    ) NOT NULL DEFAULT 'Pending',

    generated_by VARCHAR(100) NULL,

    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (bill_id),

    UNIQUE KEY uq_bill_number (
        bill_number
    ),

    UNIQUE KEY uq_member_billing_period (
        member_id,
        bill_month,
        bill_cycle
    ),

    INDEX idx_bills_member (
        member_id
    ),

    INDEX idx_bills_month_cycle (
        bill_month,
        bill_cycle
    ),

    INDEX idx_bills_status (
        status
    ),

    INDEX idx_bills_period (
        period_from,
        period_to
    ),

    CONSTRAINT fk_bills_member
        FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_bill_cycle
        CHECK (bill_cycle IN (1, 2, 3))
);


CREATE TABLE IF NOT EXISTS bill_items (
    bill_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    bill_id BIGINT UNSIGNED NOT NULL,

    collection_id BIGINT UNSIGNED NOT NULL,

    collection_date DATE NOT NULL,

    collection_time TIME NOT NULL,

    milk_type ENUM(
        'Cow',
        'Buffalo'
    ) NOT NULL,

    session ENUM(
        'Morning',
        'Evening'
    ) NOT NULL,

    quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,

    fat DECIMAL(7, 2) NOT NULL DEFAULT 0,

    snf DECIMAL(7, 2) NOT NULL DEFAULT 0,

    rate DECIMAL(12, 2) NOT NULL DEFAULT 0,

    amount DECIMAL(14, 2) NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

    INDEX idx_bill_items_date (
        collection_date
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
);



CREATE TABLE IF NOT EXISTS bill_payments (
    payment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    bill_id BIGINT UNSIGNED NOT NULL,

    payment_number VARCHAR(50) NOT NULL,

    payment_date DATE NOT NULL,

    amount DECIMAL(14, 2) NOT NULL,

    payment_method ENUM(
        'Cash',
        'Bank Transfer',
        'UPI',
        'Cheque',
        'Other'
    ) NOT NULL DEFAULT 'Cash',

    reference_number VARCHAR(100) NULL,

    note VARCHAR(500) NULL,

    received_by VARCHAR(100) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (payment_id),

    UNIQUE KEY uq_payment_number (
        payment_number
    ),

    INDEX idx_bill_payments_bill (
        bill_id
    ),

    INDEX idx_bill_payments_date (
        payment_date
    ),

    CONSTRAINT fk_bill_payments_bill
        FOREIGN KEY (bill_id)
        REFERENCES bills(bill_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0)
);



CREATE TABLE IF NOT EXISTS bill_deductions (
    deduction_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    bill_id BIGINT UNSIGNED NOT NULL,

    deduction_type ENUM(
        'Feed',
        'Advance',
        'Other',
        'Reserve'
    ) NOT NULL,

    source_record_id VARCHAR(100) NULL,

    description VARCHAR(255) NULL,

    due_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,

    deducted_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,

    remaining_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (deduction_id),

    INDEX idx_bill_deductions_bill (
        bill_id
    ),

    INDEX idx_bill_deductions_type (
        deduction_type
    ),

    CONSTRAINT fk_bill_deductions_bill
        FOREIGN KEY (bill_id)
        REFERENCES bills(bill_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);



SHOW TABLES;

DESCRIBE bills;

DESCRIBE bill_items;

DESCRIBE bill_payments;

DESCRIBE bill_deductions;