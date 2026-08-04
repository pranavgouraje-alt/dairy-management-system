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
    SELECT COUNT(*) INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = input_table_name
      AND INDEX_NAME = input_index_name;

    IF index_exists = 0 THEN
        SET @index_sql = CONCAT(
            'ALTER TABLE `', input_table_name,
            '` ADD INDEX `', input_index_name,
            '` (', input_index_columns, ')'
        );
        PREPARE index_statement FROM @index_sql;
        EXECUTE index_statement;
        DEALLOCATE PREPARE index_statement;
    END IF;
END$$
DELIMITER ;

CALL add_index_if_missing('bills','idx_bills_history_filter','`bill_month`, `bill_cycle`, `status`, `member_id`');
CALL add_index_if_missing('bills','idx_bills_generated_at','`generated_at`');
CALL add_index_if_missing('bill_payments','idx_bill_payments_number','`payment_number`');
CALL add_index_if_missing('bill_payments','idx_bill_payments_date_method','`payment_date`, `payment_method`');
CALL add_index_if_missing('bill_payments','idx_bill_payments_received_by','`received_by`');

DROP PROCEDURE IF EXISTS add_index_if_missing;
