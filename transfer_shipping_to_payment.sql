-- Step 1: Add columns to customerpayment
ALTER TABLE customerpayment 
ADD COLUMN IF NOT EXISTS shipping_street text,
ADD COLUMN IF NOT EXISTS shipping_barangay character varying(100),
ADD COLUMN IF NOT EXISTS shipping_city character varying(100),
ADD COLUMN IF NOT EXISTS shipping_province character varying(100),
ADD COLUMN IF NOT EXISTS shipping_postal_code character varying(20),
ADD COLUMN IF NOT EXISTS courier_name character varying(100),
ADD COLUMN IF NOT EXISTS estimated_delivery_date timestamp without time zone,
ADD COLUMN IF NOT EXISTS shipped_at timestamp without time zone,
ADD COLUMN IF NOT EXISTS delivered_at timestamp without time zone,
ADD COLUMN IF NOT EXISTS tracking_number character varying(100);

-- Step 2: Migrate data from orders to customerpayment
-- We take the first available shipping info from a linked order
UPDATE customerpayment cp
SET 
  shipping_street = o.shipping_street,
  shipping_barangay = o.shipping_barangay,
  shipping_city = o.shipping_city,
  shipping_province = o.shipping_province,
  shipping_postal_code = o.shipping_postal_code,
  courier_name = o.courier_name,
  estimated_delivery_date = o.estimated_delivery_date,
  shipped_at = o.shipped_at,
  delivered_at = o.delivered_at,
  tracking_number = o.tracking_number
FROM customerpayment_orders cpo
JOIN orders o ON o.orderid = cpo.orderid
WHERE cp.customerpaymentid = cpo.customerpaymentid
AND (cp.shipping_street IS NULL OR cp.shipping_street = '');

-- Step 3: Remove columns from orders
ALTER TABLE orders 
DROP COLUMN IF EXISTS shipping_street,
DROP COLUMN IF EXISTS shipping_barangay,
DROP COLUMN IF EXISTS shipping_city,
DROP COLUMN IF EXISTS shipping_province,
DROP COLUMN IF EXISTS shipping_postal_code,
DROP COLUMN IF EXISTS courier_name,
DROP COLUMN IF EXISTS estimated_delivery_date,
DROP COLUMN IF EXISTS shipped_at,
DROP COLUMN IF EXISTS delivered_at,
DROP COLUMN IF EXISTS tracking_number;
