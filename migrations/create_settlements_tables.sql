-- Create Settlement Master (Direct Pay only, no split)
CREATE TABLE IF NOT EXISTS reservation_settlements (
    settlementid SERIAL PRIMARY KEY,
    reference_code VARCHAR(50) UNIQUE,
    method VARCHAR(50), -- 'cash' or 'gcash'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid'
    paymongo_id VARCHAR(100),
    checkout_url TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- The Link between Settlement and Services
CREATE TABLE IF NOT EXISTS settlement_items (
    itemid SERIAL PRIMARY KEY,
    settlementid INTEGER REFERENCES reservation_settlements(settlementid) ON DELETE CASCADE,
    reservationpaymentid INTEGER REFERENCES reservationpayment(reservationpaymentid) ON DELETE CASCADE
);

-- Clean up reservationpayment (Moving balance logic to the new tables)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservationpayment' AND column_name='balance_fee') THEN
        ALTER TABLE reservationpayment DROP COLUMN balance_fee;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservationpayment' AND column_name='balance_status') THEN
        ALTER TABLE reservationpayment DROP COLUMN balance_status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservationpayment' AND column_name='balance_method') THEN
        ALTER TABLE reservationpayment DROP COLUMN balance_method;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservationpayment' AND column_name='balance_paid_at') THEN
        ALTER TABLE reservationpayment DROP COLUMN balance_paid_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservationpayment' AND column_name='balance_paymongo_id') THEN
        ALTER TABLE reservationpayment DROP COLUMN balance_paymongo_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservationpayment' AND column_name='balance_checkout_url') THEN
        ALTER TABLE reservationpayment DROP COLUMN balance_checkout_url;
    END IF;
END $$;
