USE dairy_management_system;



CREATE TABLE IF NOT EXISTS financial_ledger (
  ledger_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id VARCHAR(50) NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id VARCHAR(100) NULL,
  description VARCHAR(500) NOT NULL,
  debit DECIMAL(14,2) NOT NULL DEFAULT 0,
  credit DECIMAL(14,2) NOT NULL DEFAULT 0,
  reversal_of_id BIGINT UNSIGNED NULL,
  is_reversal TINYINT(1) NOT NULL DEFAULT 0,
  created_by VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ledger_id),
  INDEX idx_ledger_member_date (member_id, transaction_date, ledger_id),
  INDEX idx_ledger_reference (reference_type, reference_id),
  INDEX idx_ledger_type (transaction_type),
  INDEX idx_ledger_reversal (reversal_of_id),
  CONSTRAINT fk_ledger_member
    FOREIGN KEY (member_id) REFERENCES members(member_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ledger_reversal
    FOREIGN KEY (reversal_of_id) REFERENCES financial_ledger(ledger_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_ledger_amounts
    CHECK (
      debit >= 0 AND credit >= 0 AND
      NOT (debit > 0 AND credit > 0)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Day 78 financial ledger table is ready' AS message;
