USE dairy_management_system;



DROP PROCEDURE IF EXISTS add_index_if_missing;

DELIMITER $$

CREATE PROCEDURE add_index_if_missing(
    IN input_table_name VARCHAR(64),
    IN input_index_name VARCHAR(64),
    IN input_index_columns VARCHAR(500)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;

    SELECT COUNT(*)
    INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = input_table_name
      AND INDEX_NAME = input_index_name;

    IF index_exists = 0 THEN
        SET @index_sql = CONCAT(
            'ALTER TABLE `',
            input_table_name,
            '` ADD INDEX `',
            input_index_name,
            '` (',
            input_index_columns,
            ')'
        );

        PREPARE index_statement
        FROM @index_sql;

        EXECUTE index_statement;

        DEALLOCATE PREPARE index_statement;
    END IF;
END$$

DELIMITER ;

-- Bills indexes
CALL add_index_if_missing(
    'bills',
    'idx_bills_member_period',
    '`member_id`, `period_from`, `period_to`'
);

CALL add_index_if_missing(
    'bills',
    'idx_bills_month_cycle',
    '`bill_month`, `bill_cycle`'
);

CALL add_index_if_missing(
    'bills',
    'idx_bills_status',
    '`status`'
);

-- Bill-item indexes
CALL add_index_if_missing(
    'bill_items',
    'idx_bill_items_bill_date',
    '`bill_id`, `collection_date`'
);

CALL add_index_if_missing(
    'bill_items',
    'idx_bill_items_collection',
    '`collection_id`'
);

-- Deduction indexes
CALL add_index_if_missing(
    'bill_deductions',
    'idx_bill_deductions_bill_type',
    '`bill_id`, `deduction_type`'
);

CALL add_index_if_missing(
    'bill_deductions',
    'idx_bill_deductions_source',
    '`source_record_id`'
);

-- Payment indexes
CALL add_index_if_missing(
    'bill_payments',
    'idx_bill_payments_bill_date',
    '`bill_id`, `payment_date`'
);

DROP PROCEDURE IF EXISTS add_index_if_missing;

-- ------------------------------------------------------------
-- Verification
-- ------------------------------------------------------------

SELECT
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(
        COLUMN_NAME
        ORDER BY SEQ_IN_INDEX
        SEPARATOR ', '
    ) AS indexed_columns
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
      'bills',
      'bill_items',
      'bill_deductions',
      'bill_payments'
  )
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;
