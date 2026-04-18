-- Table: public.reservationpayment
-- Tracks payment for appointment reservation fees (25% of total service cost)

CREATE TABLE IF NOT EXISTS public.reservationpayment
(
    reservationpaymentid SERIAL PRIMARY KEY,
    appointmentid INTEGER NOT NULL,
    reference_code VARCHAR(50),
    method TEXT DEFAULT 'gcash',
    status VARCHAR(20) DEFAULT 'pending',
    currency VARCHAR(10) DEFAULT 'PHP',
    reservation_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    checkout_url TEXT,
    paymongo_id VARCHAR(100),
    paid_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservation_appointment FOREIGN KEY (appointmentid)
        REFERENCES public.appointment (appointmentid)
        ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE IF EXISTS public.reservationpayment OWNER TO postgres;
