-- ============================================================
-- 财务审计与资金管理 SQL 查询示例
-- 对应作品：w06 SOX审计 / w07 现金流压力测试
-- 数据库：通用SQL（MySQL/PostgreSQL兼容）
-- ============================================================

-- 1. 货币资金审计：银行账户余额与总账核对
-- 用途：审计货币资金科目时，核对银行对账单与总账余额
SELECT
    b.bank_account,
    b.bank_name,
    b.statement_balance AS bank_balance,
    g.gl_balance,
    b.statement_balance - g.gl_balance AS difference,
    CASE
        WHEN ABS(b.statement_balance - g.gl_balance) < 0.01 THEN 'MATCH'
        ELSE 'RECONCILE'
    END AS status
FROM bank_statements b
JOIN general_ledger g ON b.bank_account = g.account_code
WHERE g.account_code LIKE '1002%'  -- 银行存款科目
ORDER BY difference DESC;

-- 2. 应收账款账龄分析
-- 用途：评估应收账款回收风险，计提坏账准备
SELECT
    customer_id,
    customer_name,
    COUNT(*) AS invoice_count,
    SUM(amount) AS total_amount,
    SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) <= 30 THEN amount ELSE 0 END) AS current_30d,
    SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 90 THEN amount ELSE 0 END) AS overdue_31_90d,
    SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 91 AND 180 THEN amount ELSE 0 END) AS overdue_91_180d,
    SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 180 THEN amount ELSE 0 END) AS overdue_180d_plus,
    SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 0 THEN amount ELSE 0 END) / NULLIF(SUM(amount), 0) AS overdue_ratio
FROM accounts_receivable
WHERE status = 'OPEN'
GROUP BY customer_id, customer_name
HAVING overdue_ratio > 0.2
ORDER BY total_amount DESC;

-- 3. 资金流水异常检测
-- 用途：SOX审计中检测异常资金流动，识别潜在风险
SELECT
    transaction_id,
    transaction_date,
    from_account,
    to_account,
    amount,
    transaction_type,
    description,
    -- 标记异常：大额、整数、非工作时间
    CASE
        WHEN amount > 1000000 THEN 'LARGE_AMOUNT'
        WHEN amount = ROUND(amount, -3) THEN 'ROUND_NUMBER'
        WHEN HOUR(transaction_time) NOT BETWEEN 9 AND 18 THEN 'OFF_HOURS'
        WHEN WEEKDAY(transaction_date) IN (5, 6) THEN 'WEEKEND'
        ELSE 'NORMAL'
    END AS risk_flag
FROM cash_transactions
WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
HAVING risk_flag != 'NORMAL'
ORDER BY transaction_date DESC;

-- 4. 现金流预测：未来12个月资金缺口分析
-- 用途：资金管理中预测未来现金流，识别资金缺口
WITH monthly_cashflow AS (
    SELECT
        DATE_FORMAT(transaction_date, '%Y-%m') AS month,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS inflow,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS outflow
    FROM cash_transactions
    WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
),
forecast AS (
    SELECT
        month,
        inflow,
        outflow,
        inflow - outflow AS net_flow,
        SUM(inflow - outflow) OVER (ORDER BY month) AS cumulative_balance
    FROM monthly_cashflow
)
SELECT
    month,
    inflow,
    outflow,
    net_flow,
    cumulative_balance,
    CASE
        WHEN cumulative_balance < 2000 THEN 'RED'
        WHEN cumulative_balance < 4000 THEN 'ORANGE'
        ELSE 'GREEN'
    END AS alert_level
FROM forecast
ORDER BY month;

-- 5. 采购付款循环：三方匹配测试
-- 用途：SOX审计中测试采购付款控制，验证PO-收货-发票一致性
SELECT
    i.invoice_id,
    i.po_number,
    i.invoice_amount,
    po.po_amount,
    gr.gr_amount,
    i.invoice_amount - po.po_amount AS po_variance,
    i.invoice_amount - gr.gr_amount AS gr_variance,
    CASE
        WHEN ABS(i.invoice_amount - po.po_amount) > 0.01 THEN 'PO_MISMATCH'
        WHEN ABS(i.invoice_amount - gr.gr_amount) > 0.01 THEN 'GR_MISMATCH'
        ELSE 'MATCH'
    END AS match_status
FROM invoices i
LEFT JOIN purchase_orders po ON i.po_number = po.po_number
LEFT JOIN goods_receipts gr ON i.po_number = gr.po_number
WHERE i.invoice_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
ORDER BY match_status DESC;

-- 6. 银行账户余额变动趋势
-- 用途：资金监控，分析各银行账户余额变动
SELECT
    bank_account,
    bank_name,
    DATE_FORMAT(statement_date, '%Y-%m') AS month,
    AVG(balance) AS avg_balance,
    MIN(balance) AS min_balance,
    MAX(balance) AS max_balance,
    MAX(balance) - MIN(balance) AS balance_volatility,
    STDDEV(balance) AS balance_std
FROM bank_statements
WHERE statement_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY bank_account, bank_name, DATE_FORMAT(statement_date, '%Y-%m')
ORDER BY bank_account, month;

-- 7. 关联方交易识别
-- 用途：审计中识别关联方交易，评估披露完整性
SELECT
    t.transaction_id,
    t.transaction_date,
    t.counterparty,
    t.amount,
    t.description,
    r.relationship_type,
    CASE
        WHEN r.relationship_type IS NOT NULL THEN 'RELATED_PARTY'
        ELSE 'THIRD_PARTY'
    END AS party_type
FROM transactions t
LEFT JOIN related_parties r ON t.counterparty = r.party_name
WHERE t.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
ORDER BY t.amount DESC;

-- 8. 费用报销异常检测
-- 用途：内控测试中检测费用报销异常
SELECT
    employee_id,
    employee_name,
    department,
    COUNT(*) AS claim_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    SUM(CASE WHEN amount > 5000 THEN 1 ELSE 0 END) AS large_claims,
    SUM(CASE WHEN DATE_SUBMITTED > DATE_ADD(expense_date, INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS late_submissions
FROM expense_claims
WHERE status = 'APPROVED'
  AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY employee_id, employee_name, department
HAVING total_amount > 50000 OR large_claims > 5
ORDER BY total_amount DESC;
