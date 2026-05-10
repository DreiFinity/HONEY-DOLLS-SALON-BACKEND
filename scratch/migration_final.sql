-- FINAL SUPABASE MIGRATION
-- Generated on 2026-05-10T13:37:41.559Z
BEGIN;
CREATE TABLE IF NOT EXISTS announcement (
  id SERIAL PRIMARY KEY,
  title character varying NOT NULL,
  category character varying,
  content text NOT NULL,
  priority character varying,
  audience character varying,
  status character varying,
  start_date date,
  start_time time without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  customerid SERIAL PRIMARY KEY,
  firstname text NOT NULL,
  lastname text NOT NULL,
  contact character varying,
  userid integer,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  profileimage character varying DEFAULT NULL::character varying
);

CREATE TABLE IF NOT EXISTS admin (
  adminid SERIAL PRIMARY KEY,
  firstname text NOT NULL,
  lastname text NOT NULL,
  contact character varying,
  userid integer,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  image text
);

CREATE TABLE IF NOT EXISTS customerpayment (
  customerpaymentid SERIAL PRIMARY KEY,
  reference_code character varying,
  method text,
  status character varying DEFAULT 'pending'::character varying,
  currency character varying DEFAULT 'PHP'::character varying,
  checkout_url text,
  paymongo_id character varying,
  delivery_fee numeric NOT NULL DEFAULT 0.00,
  customerid integer,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  shipping_street text,
  shipping_barangay character varying,
  shipping_city character varying,
  shipping_province character varying,
  shipping_postal_code character varying,
  courier_name character varying,
  estimated_delivery_date timestamp without time zone,
  shipped_at timestamp without time zone,
  delivered_at timestamp without time zone,
  tracking_number character varying,
  refunded_at timestamp without time zone,
  refund_receipt_image character varying,
  fulfillment_branchid integer
);

CREATE TABLE IF NOT EXISTS customerpayment_orders (
  id SERIAL PRIMARY KEY,
  customerpaymentid integer NOT NULL,
  orderid integer NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  orderid SERIAL PRIMARY KEY,
  customerid integer,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  order_channel character varying NOT NULL DEFAULT 'online'::character varying,
  status character varying NOT NULL DEFAULT 'pending'::character varying
);

CREATE TABLE IF NOT EXISTS orderdetails (
  orderdetailsid SERIAL PRIMARY KEY,
  orderid integer,
  productid integer,
  quantity integer,
  unit_price numeric
);

CREATE TABLE IF NOT EXISTS branch (
  branchid integer NOT NULL,
  branchname character varying NOT NULL,
  location character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS appointment (
  appointmentid SERIAL PRIMARY KEY,
  customerid integer,
  starttime timestamp without time zone NOT NULL,
  endtime timestamp without time zone NOT NULL,
  notes text,
  priority character varying,
  status character varying,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  cancellationreason text,
  checkedin boolean DEFAULT false,
  arrivedat timestamp without time zone,
  noshow boolean DEFAULT false,
  branchid integer,
  staffid integer
);

CREATE TABLE IF NOT EXISTS appointmentservice (
  appointmentserviceid SERIAL PRIMARY KEY,
  appointmentid integer NOT NULL,
  serviceid integer NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  addressid SERIAL PRIMARY KEY,
  customerid integer,
  street text NOT NULL,
  barangay character varying,
  city character varying NOT NULL,
  province character varying NOT NULL,
  postal_code character varying,
  is_default boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS active_sessions (
  user_id integer NOT NULL,
  login_id uuid NOT NULL,
  last_route character varying,
  updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_transfers (
  transferid SERIAL PRIMARY KEY,
  productid integer NOT NULL,
  from_branchid integer NOT NULL,
  to_branchid integer NOT NULL,
  quantity integer NOT NULL,
  transfer_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  adminid integer,
  remarks text,
  status character varying DEFAULT 'PENDING'::character varying,
  reference_code character varying
);

CREATE TABLE IF NOT EXISTS product_adjustments (
  adjustmentid SERIAL PRIMARY KEY,
  type character varying NOT NULL,
  productid integer,
  userid integer,
  quantity integer,
  reason character varying,
  remarks text,
  datetime timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  branchid integer,
  reference_code character varying
);

CREATE TABLE IF NOT EXISTS product_returns (
  returnid SERIAL PRIMARY KEY,
  orderid integer,
  customerid integer,
  productid integer,
  quantity integer NOT NULL,
  reason text,
  reason_type character varying DEFAULT 'others'::character varying,
  status character varying DEFAULT 'pending'::character varying,
  customer_evidence_image character varying,
  createdat timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  refund_proof character varying,
  refund_at timestamp without time zone,
  reference_code character varying
);

CREATE TABLE IF NOT EXISTS products (
  productid SERIAL PRIMARY KEY,
  prodname character varying NOT NULL,
  prodcat character varying NOT NULL,
  price numeric,
  prodimage character varying,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  supplier_price numeric DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS supplier (
  supplierid SERIAL PRIMARY KEY,
  suppliername character varying,
  contactperson character varying,
  contacts integer,
  address character varying,
  remarks character varying,
  productid integer
);

CREATE TABLE IF NOT EXISTS queueservice (
  queueserviceid integer NOT NULL,
  queueid integer NOT NULL,
  serviceid integer NOT NULL
);

CREATE TABLE IF NOT EXISTS queue (
  queueid integer NOT NULL,
  queuedate date NOT NULL DEFAULT CURRENT_DATE,
  customerid integer,
  appointmentid integer,
  staffid integer,
  customername character varying NOT NULL,
  source character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'waiting'::character varying,
  arrivaltime timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  calledat timestamp without time zone,
  servicestartat timestamp without time zone,
  serviceendat timestamp without time zone,
  priorityweight integer NOT NULL DEFAULT 0,
  positionoverride integer,
  notes text,
  createdat timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  isarrived boolean NOT NULL DEFAULT false,
  branchid integer
);

CREATE TABLE IF NOT EXISTS purchaseorderdetails (
  purchasedetailid SERIAL PRIMARY KEY,
  purchaseid integer,
  productid integer,
  unit_price numeric,
  quantity integer
);

CREATE TABLE IF NOT EXISTS purchaseorder (
  purchaseid SERIAL PRIMARY KEY,
  supplierid integer,
  status text,
  branchid integer,
  dateordered timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservationpayment (
  reservationpaymentid SERIAL PRIMARY KEY,
  appointmentid integer,
  customerid integer,
  reference_code character varying,
  method text DEFAULT 'gcash'::text,
  status character varying DEFAULT 'pending'::character varying,
  currency character varying DEFAULT 'PHP'::character varying,
  reservation_fee numeric NOT NULL DEFAULT 0.00,
  checkout_url text,
  paymongo_id character varying,
  paid_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  queueid integer,
  paymongo_payment_id text
);

CREATE TABLE IF NOT EXISTS service (
  serviceid SERIAL PRIMARY KEY,
  servicetype text NOT NULL,
  servicename text NOT NULL,
  amount numeric NOT NULL,
  image character varying
);

CREATE TABLE IF NOT EXISTS supplierpurchasedetails (
  purchasedetailid SERIAL PRIMARY KEY,
  purchaseid integer,
  productid integer,
  quantity integer,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone
);

CREATE TABLE IF NOT EXISTS staff (
  staffid SERIAL PRIMARY KEY,
  firstname text NOT NULL,
  lastname text NOT NULL,
  contact character varying,
  userid integer,
  branchid integer,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  image text,
  role text[] DEFAULT '{}'::text[]
);

CREATE TABLE IF NOT EXISTS users (
  userid SERIAL PRIMARY KEY,
  username character varying NOT NULL,
  password character varying NOT NULL,
  role character varying,
  email character varying NOT NULL,
  isactive boolean DEFAULT true,
  accountcreated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservation_settlements (
  settlementid SERIAL PRIMARY KEY,
  reference_code character varying,
  method character varying,
  status character varying DEFAULT 'pending'::character varying,
  paymongo_id character varying,
  checkout_url text,
  paid_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settlement_items (
  itemid SERIAL PRIMARY KEY,
  settlementid integer,
  reservationpaymentid integer
);

CREATE TABLE IF NOT EXISTS supplierpayment (
  supplierpaymentid SERIAL PRIMARY KEY,
  purchaseid integer,
  partialamountpaid numeric,
  method text,
  paymongo_id text,
  checkout_url text,
  status text DEFAULT 'PENDING'::text,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  reference_code text,
  payment_type text DEFAULT 'IMMEDIATE'::text,
  payment_term_days integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS supplierpurchase (
  purchaseid SERIAL PRIMARY KEY,
  supplierid integer,
  status character varying,
  createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updatedat timestamp without time zone,
  branchid integer
);

-- Data for announcement
INSERT INTO announcement (id, title, category, content, priority, audience, status, start_date, start_time, created_at) VALUES (1, 'wrlgjoergerg', 'General', 'welfjiewofoiewfowe', 'high', 'All Users', 'Published', '2026-04-23T16:00:00.000Z', '12:24:00', '2026-04-24T04:24:04.742Z') ON CONFLICT DO NOTHING;
INSERT INTO announcement (id, title, category, content, priority, audience, status, start_date, start_time, created_at) VALUES (2, 'haha mga staff mahina', 'General', 'uhoihik', 'medium', 'Staff Only', 'Published', '2026-04-23T16:00:00.000Z', '12:35:00', '2026-04-24T04:35:56.604Z') ON CONFLICT DO NOTHING;
-- Data for customers
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (1, 'Vladimir', 'Cruz', '09123456789', 3, '2025-11-17T02:18:19.321Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (2, 'Vladimir', 'Cruz', '09171234567', 4, '2025-11-17T03:14:46.571Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (3, 'dreii', 'nagba', '09505416671', 5, '2025-11-17T03:18:32.250Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (4, 'Vlad', 'C', '09123456789', 2, '2025-11-17T11:58:44.876Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (5, 'Vladimir', 'Cruz', '09171234567', 6, '2025-11-23T02:43:51.772Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (6, 'Vladimir', 'Cruz', '09171234567', 7, '2025-11-23T02:47:07.187Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (7, 'ANDREI ', 'NAGBA', '09545146647', 8, '2025-11-24T15:26:13.820Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (8, 'Jakerz', 'Jakejake', '123912930912', 9, '2025-11-26T10:07:33.237Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (10, 'John', 'Doe', '09123456789', 14, '2025-11-27T02:07:57.729Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (11, 'John', 'Doe', '09123456789', 15, '2025-11-27T02:11:58.309Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (12, 'Vladimir', 'Cruz', '09171234567', 17, '2026-02-03T14:22:03.838Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (13, 'WEW', 'nagba', '09505416671', 18, '2026-02-03T14:23:34.477Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (14, 'ASH ', 'ITOM', '09505416671', 19, '2026-02-04T16:57:35.478Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (15, 'wez', 'wez', '095641001664', 20, '2026-02-06T03:07:34.913Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (16, 'nagba', 'drew', '1156461331', 21, '2026-02-06T03:09:20.040Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (17, 'Vladimir', 'Cruz', '09171234567', 22, '2026-02-06T03:38:02.044Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (18, 'skie', 'Andrei', '09505416671', 23, '2026-02-06T05:53:38.463Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (19, 'drei', 'skie', '0950541661', 24, '2026-02-06T05:55:03.200Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (20, 'wat', 'wat', '09505416671', 25, '2026-02-06T05:58:35.926Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (21, 'Vladimir', 'Cruz', '09171234567', 26, '2026-02-06T06:57:16.863Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (22, 'Vladimir', 'Cruz', '09171234567', 27, '2026-02-06T07:11:28.488Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (23, 'Vladimir', 'Cruz', '09171234567', 28, '2026-02-06T11:36:56.044Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (24, 'Vladimir', 'Cruz', '09171234567', 29, '2026-02-06T11:43:20.593Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (25, 'Vladimir', 'Cruz', '09171234567', 30, '2026-02-06T11:44:46.452Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (26, 'Ray', 'DeLeon', '09465161', 31, '2026-02-18T09:11:29.498Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (28, 'troy', 'Doe', '09123456789', 33, '2026-03-10T01:08:14.067Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (29, 'troy', 'Doe', '09123456789', 34, '2026-03-10T01:11:12.127Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (30, 'troy', 'Doe', '09123456789', 35, '2026-03-10T01:13:14.290Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (31, 'John', 'Doe', '09123456789', 36, '2026-03-10T01:24:43.956Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (32, 'aikeee', 'Doe', '09123456789', 37, '2026-03-10T01:26:42.948Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (33, 'dreiskie', 'nagba', '09505416671', 38, '2026-03-10T02:00:33.179Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (34, '', '', '', 39, '2026-03-10T02:17:25.422Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (35, 'andrei', 'karl', '09505416671', 40, '2026-03-10T02:18:32.461Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (27, 'Vladimir', 'C.', NULL, 32, '2026-03-26T12:49:42.475Z', '1774529376279-Sb 11 (1).png') ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (36, 'johnny', 'bravo', '0950546413', 43, '2026-03-30T13:39:11.113Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (37, 'WEW', 'santos', '0954654132', 44, '2026-03-30T13:57:09.931Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (38, 'wet', 'wew', '09546133', 45, '2026-03-30T14:02:24.755Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (customerid, firstname, lastname, contact, userid, updatedat, profileimage) VALUES (9, 'Ashicakes', '', '09123456789', 10, '2026-04-24T07:31:19.711Z', '1777015879672-pic-4.jpg') ON CONFLICT DO NOTHING;
-- Data for admin
INSERT INTO admin (adminid, firstname, lastname, contact, userid, updatedat, image) VALUES (1, 'Alice', 'Admin', '09123456787', 12, '2026-05-03T22:50:36.702Z', '1777848636698-OIP (9).webp') ON CONFLICT DO NOTHING;
-- Data for customerpayment
INSERT INTO customerpayment (customerpaymentid, reference_code, method, status, currency, checkout_url, paymongo_id, delivery_fee, customerid, updated_at, shipping_street, shipping_barangay, shipping_city, shipping_province, shipping_postal_code, courier_name, estimated_delivery_date, shipped_at, delivered_at, tracking_number, refunded_at, refund_receipt_image, fulfillment_branchid) VALUES (234, 'GCASH-161841', 'gcash', 'paid', 'PHP', 'https://checkout.paymongo.com/f4182a6d75cd76e714f8dac1', 'cs_f4182a6d75cd76e714f8dac1', '150.00', 9, '2026-05-10T06:26:22.153Z', '456 Roxas Avenue', 'Barangay Poblacion', 'Davao City', 'Davao del Sur', '8000', 'J&T Express', '2026-05-11T22:25:35.149Z', '2026-05-10T06:26:16.696Z', '2026-05-10T06:26:22.153Z', '12313131', NULL, NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO customerpayment (customerpaymentid, reference_code, method, status, currency, checkout_url, paymongo_id, delivery_fee, customerid, updated_at, shipping_street, shipping_barangay, shipping_city, shipping_province, shipping_postal_code, courier_name, estimated_delivery_date, shipped_at, delivered_at, tracking_number, refunded_at, refund_receipt_image, fulfillment_branchid) VALUES (235, 'GCASH-668173', 'gcash', 'paid', 'PHP', 'https://checkout.paymongo.com/f72b7f7e2ce4866f8592826c', 'cs_f72b7f7e2ce4866f8592826c', '150.00', 9, '2026-05-10T12:11:57.909Z', '456 Roxas Avenue', 'Barangay Poblacion', 'Davao City', 'Davao del Sur', '8000', 'J&T Express', '2026-05-12T04:08:58.901Z', '2026-05-10T12:10:00.651Z', '2026-05-10T12:11:57.909Z', '123456', NULL, NULL, 2) ON CONFLICT DO NOTHING;
-- Data for customerpayment_orders
INSERT INTO customerpayment_orders (id, customerpaymentid, orderid) VALUES (248, 234, 254) ON CONFLICT DO NOTHING;
INSERT INTO customerpayment_orders (id, customerpaymentid, orderid) VALUES (249, 235, 255) ON CONFLICT DO NOTHING;
INSERT INTO customerpayment_orders (id, customerpaymentid, orderid) VALUES (250, 235, 256) ON CONFLICT DO NOTHING;
-- Data for orders
INSERT INTO orders (orderid, customerid, createdat, updatedat, order_channel, status) VALUES (254, 9, '2026-05-10T06:25:31.084Z', '2026-05-10T06:26:22.153Z', 'online', 'delivered') ON CONFLICT DO NOTHING;
INSERT INTO orders (orderid, customerid, createdat, updatedat, order_channel, status) VALUES (255, 9, '2026-05-10T12:08:40.177Z', '2026-05-10T12:11:57.909Z', 'online', 'delivered') ON CONFLICT DO NOTHING;
INSERT INTO orders (orderid, customerid, createdat, updatedat, order_channel, status) VALUES (256, 9, '2026-05-10T12:08:43.115Z', '2026-05-10T12:11:57.909Z', 'online', 'delivered') ON CONFLICT DO NOTHING;
-- Data for orderdetails
INSERT INTO orderdetails (orderdetailsid, orderid, productid, quantity, unit_price) VALUES (299, 254, 37, 1, '250.00') ON CONFLICT DO NOTHING;
INSERT INTO orderdetails (orderdetailsid, orderid, productid, quantity, unit_price) VALUES (300, 255, 6, 1, '560.00') ON CONFLICT DO NOTHING;
INSERT INTO orderdetails (orderdetailsid, orderid, productid, quantity, unit_price) VALUES (301, 256, 4, 1, '520.00') ON CONFLICT DO NOTHING;
-- Data for branch
INSERT INTO branch (branchid, branchname, location) VALUES (1, 'Main Branch', '123 Main St, Manila') ON CONFLICT DO NOTHING;
INSERT INTO branch (branchid, branchname, location) VALUES (2, 'Cebu Branch', '456 Side St, Cebu') ON CONFLICT DO NOTHING;
INSERT INTO branch (branchid, branchname, location) VALUES (3, 'Davao Branch', '789 High St, Davao') ON CONFLICT DO NOTHING;
-- Data for appointment
INSERT INTO appointment (appointmentid, customerid, starttime, endtime, notes, priority, status, createdat, updatedat, cancellationreason, checkedin, arrivedat, noshow, branchid, staffid) VALUES (116, 9, '2026-05-08T01:30:00.000Z', '2026-05-08T03:30:00.000Z', '', 'high', 'completed', '2026-05-08T15:42:07.976Z', '2026-05-08T15:43:21.921Z', NULL, false, NULL, false, 2, 6) ON CONFLICT DO NOTHING;
INSERT INTO appointment (appointmentid, customerid, starttime, endtime, notes, priority, status, createdat, updatedat, cancellationreason, checkedin, arrivedat, noshow, branchid, staffid) VALUES (117, 9, '2026-05-09T02:00:00.000Z', '2026-05-09T04:00:00.000Z', '', 'high', 'completed', '2026-05-08T16:21:36.984Z', '2026-05-08T16:22:55.608Z', NULL, false, NULL, false, 2, 6) ON CONFLICT DO NOTHING;
INSERT INTO appointment (appointmentid, customerid, starttime, endtime, notes, priority, status, createdat, updatedat, cancellationreason, checkedin, arrivedat, noshow, branchid, staffid) VALUES (118, 9, '2026-05-09T02:00:00.000Z', '2026-05-09T04:00:00.000Z', '', 'high', 'completed', '2026-05-08T16:24:22.694Z', '2026-05-08T16:25:30.823Z', NULL, false, NULL, false, 2, 6) ON CONFLICT DO NOTHING;
-- Data for appointmentservice
INSERT INTO appointmentservice (appointmentserviceid, appointmentid, serviceid) VALUES (278, 116, 3) ON CONFLICT DO NOTHING;
INSERT INTO appointmentservice (appointmentserviceid, appointmentid, serviceid) VALUES (279, 116, 4) ON CONFLICT DO NOTHING;
INSERT INTO appointmentservice (appointmentserviceid, appointmentid, serviceid) VALUES (280, 117, 3) ON CONFLICT DO NOTHING;
INSERT INTO appointmentservice (appointmentserviceid, appointmentid, serviceid) VALUES (281, 117, 4) ON CONFLICT DO NOTHING;
INSERT INTO appointmentservice (appointmentserviceid, appointmentid, serviceid) VALUES (282, 118, 2) ON CONFLICT DO NOTHING;
INSERT INTO appointmentservice (appointmentserviceid, appointmentid, serviceid) VALUES (283, 118, 3) ON CONFLICT DO NOTHING;
-- Data for customer_addresses
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (9, 25, '123 Rizal Street', 'Barangay 5', 'Davao', 'Davao del Sur', '8000', true, '2026-02-16T00:32:12.304Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (10, 25, 'Blk 4 Lot 12 Emerald Homes', 'Matina', 'Davao', 'Davao del Sur', '8000', false, '2026-02-16T00:32:12.304Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (11, 1, '45 Mabini Ave', 'Poblacion', 'Cebu', 'Cebu', '6000', true, '2026-02-16T00:32:12.304Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (12, 1, 'Sunrise Village Phase 2', 'Talamban', 'Cebu', 'Cebu', '6000', false, '2026-02-16T00:32:12.304Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (13, NULL, '123 Rizal Street', 'Barangay 5', 'Davao', 'Davao del Sur', '8000', true, '2026-02-16T01:39:15.869Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (16, NULL, '123 Rizal Street', 'Barangay 5', 'Davao', 'Davao del Sur', '8000', true, '2026-02-16T02:29:38.644Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (17, NULL, '123 Rizal Street', 'Barangay 5', 'Davao', 'Davao del Sur', '8000', true, '2026-02-16T02:32:38.170Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (18, 25, '123 Rizal Street', 'Barangay 5', 'Davao', 'Davao del Sur', '8000', true, '2026-02-16T02:37:29.254Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (22, 9, '123 Osmeña Boulevard', 'Barangay Capitol Site', 'Cebu City', 'Cebu', '6000', true, '2026-02-18T08:42:42.345Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (23, 9, '456 Roxas Avenue', 'Barangay Poblacion', 'Davao City', 'Davao del Sur', '8000', false, '2026-02-18T08:42:42.345Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (30, 32, 'Purok 3', 'Obrero', 'Davao City', 'Davao del Sur', '8000', true, '2026-03-10T01:26:42.952Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (31, 33, 'st.ignatius', 'Indangan', '112402000', '112400000', '8000', true, '2026-03-10T02:00:33.183Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (36, 34, '456 Second St', 'Barangay 2', 'City B', 'Province Y', '2000', false, '2026-03-10T19:21:46.899Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (37, 35, '123 New Street', 'New Barangay', 'New City', 'New Province', '1234', false, '2026-03-10T19:28:40.620Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (38, 35, 'adawda', 'Cuantacla', '012905000', '012900000', '4000', true, '2026-03-10T19:35:06.710Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (24, 27, '123 Rizal Street', 'Poblacion', 'Davao City', 'Davao del Sur', '8000', false, '2026-03-06T14:09:34.521Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (43, 27, 'wewaew', 'Alaska', 'Aringay', 'La Union', '13131312', true, '2026-03-12T07:38:51.420Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (44, 36, 'rizal', 'Guribang', 'Diffun', 'Quirino', '8000', true, '2026-03-30T13:39:11.145Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (45, 37, 'rizal', 'Malingeb', 'Bantay', 'Ilocos Sur', '8000', true, '2026-03-30T13:57:09.948Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (46, 38, 'lambo', 'Zamora', 'Cabarroguis', 'Quirino', '8000', true, '2026-03-30T14:02:24.772Z') ON CONFLICT DO NOTHING;
INSERT INTO customer_addresses (addressid, customerid, street, barangay, city, province, postal_code, is_default, created_at) VALUES (47, 27, 'lambo', 'Duale', 'Limay', 'Bataan', '8000', false, '2026-04-21T14:58:11.887Z') ON CONFLICT DO NOTHING;
-- Data for active_sessions
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (30, 'b3451e5a-779f-4b9f-b53f-f3ef413fa0db', '/api/online-orders', '2026-02-17T05:56:50.723Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (38, '0144ebcb-7a52-440d-bcb5-cfb5bbc22c7d', '/api/online-orders', '2026-03-10T02:05:55.309Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (31, '47ffd4a9-9141-4d6b-9337-510583a0a229', '/api/online-orders', '2026-02-18T09:12:03.209Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (39, '831471cd-7541-496c-861f-37c332b37fa7', '/api/online-orders', '2026-03-10T14:56:34.001Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (40, '93c4f053-541b-44c7-8faa-a3123985373a', '/api/online-orders', '2026-03-15T04:25:53.770Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (45, '58a2fb75-72c2-42e5-a4fa-5f102caf9819', '/dashboard', '2026-03-30T14:02:24.785Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (50, 'be287a36-9ec4-44f0-aac7-626b6c940438', '/api/online-orders', '2026-04-24T02:48:47.177Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (51, '9fa44d04-c873-458f-b880-e89e3c46c0d5', '/dashboard', '2026-04-29T08:18:51.611Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (11, '9e40b2d0-f8ae-4aeb-a1e9-e3f1b466e7f6', '/api/online-orders', '2026-04-24T06:56:25.957Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (53, 'f610dec8-9e5d-411f-b935-21fcd6411aa6', '/api/online-orders', '2026-04-30T20:27:49.413Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (32, 'cc925ff5-79a7-41f3-8e02-ce2d6813ac62', '/api/online-orders', '2026-05-04T07:13:03.609Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (12, '40c3e67d-80cb-4faa-9944-e6d03c5a5a96', '/api/online-orders', '2026-05-10T11:40:48.835Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (56, 'afc95ab6-0337-4ae7-97c5-032c8b4c6079', '/dashboard', '2026-05-10T11:43:23.557Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (52, '3f415028-05bd-4a41-891f-196a9fca549d', '/api/online-orders', '2026-05-04T03:43:36.090Z') ON CONFLICT DO NOTHING;
INSERT INTO active_sessions (user_id, login_id, last_route, updated_at) VALUES (10, 'e05f24f2-c49d-4f6f-a7ec-19ad177a700e', '/api/online-orders', '2026-05-10T12:14:19.716Z') ON CONFLICT DO NOTHING;
-- Data for product_transfers
INSERT INTO product_transfers (transferid, productid, from_branchid, to_branchid, quantity, transfer_date, adminid, remarks, status, reference_code) VALUES (7, 26, 2, 3, 1, '2026-05-10T06:27:30.799Z', 1, 'Transfer from Cebu Branch', 'ARRIVED', NULL) ON CONFLICT DO NOTHING;
INSERT INTO product_transfers (transferid, productid, from_branchid, to_branchid, quantity, transfer_date, adminid, remarks, status, reference_code) VALUES (8, 23, 3, 2, 1, '2026-05-10T11:47:38.784Z', 1, 'Transfer from Davao Branch', 'ARRIVED', 'TRF-287486') ON CONFLICT DO NOTHING;
-- Data for product_adjustments
INSERT INTO product_adjustments (adjustmentid, type, productid, userid, quantity, reason, remarks, datetime, branchid, reference_code) VALUES (8, 'Usage', 27, 52, 2, 'Used in service', '', '2026-05-04T07:27:17.994Z', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO product_adjustments (adjustmentid, type, productid, userid, quantity, reason, remarks, datetime, branchid, reference_code) VALUES (9, 'Usage', 31, 54, 2, 'Used in service', '', '2026-05-04T07:27:35.716Z', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO product_adjustments (adjustmentid, type, productid, userid, quantity, reason, remarks, datetime, branchid, reference_code) VALUES (10, 'Usage', 3, 52, 1, 'Used in service', '', '2026-05-10T06:08:11.262Z', 2, 'USE-291261-NGE') ON CONFLICT DO NOTHING;
INSERT INTO product_adjustments (adjustmentid, type, productid, userid, quantity, reason, remarks, datetime, branchid, reference_code) VALUES (11, 'Waste', 3, 52, NULL, 'Contaminated', '', '2026-05-10T06:08:21.385Z', 2, 'WASTE-301384-NC0') ON CONFLICT DO NOTHING;
INSERT INTO product_adjustments (adjustmentid, type, productid, userid, quantity, reason, remarks, datetime, branchid, reference_code) VALUES (12, 'Damage', 4, 52, NULL, 'Leakage', '', '2026-05-10T06:08:29.272Z', 2, 'DMG-309272-AZM') ON CONFLICT DO NOTHING;
INSERT INTO product_adjustments (adjustmentid, type, productid, userid, quantity, reason, remarks, datetime, branchid, reference_code) VALUES (13, 'Usage', 1, 53, 10, 'Used in service', '', '2026-05-10T06:59:01.403Z', 2, 'USE-341199-9QN') ON CONFLICT DO NOTHING;
INSERT INTO product_adjustments (adjustmentid, type, productid, userid, quantity, reason, remarks, datetime, branchid, reference_code) VALUES (14, 'Usage', 23, 53, 5, 'Used in service', '', '2026-05-10T12:07:43.880Z', 2, 'USE-863737-BIR') ON CONFLICT DO NOTHING;
-- Data for product_returns
INSERT INTO product_returns (returnid, orderid, customerid, productid, quantity, reason, reason_type, status, customer_evidence_image, createdat, updated_at, refund_proof, refund_at, reference_code) VALUES (13, 254, 9, 37, 1, 'weadwa', 'Damaged Product', 'completed', '1778394413492-71b56p2pn6L._AC_.jpg', '2026-05-10T06:26:53.535Z', '2026-05-10T06:30:35.202Z', NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO product_returns (returnid, orderid, customerid, productid, quantity, reason, reason_type, status, customer_evidence_image, createdat, updated_at, refund_proof, refund_at, reference_code) VALUES (14, 255, 9, 6, 1, 'awdwad', 'Damaged Product', 'completed', '1778415160290-OIP (8).webp', '2026-05-10T12:12:40.301Z', '2026-05-10T12:13:39.678Z', NULL, NULL, 'RET-889155') ON CONFLICT DO NOTHING;
-- Data for products
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (18, 'honeyglow serum', 'Skincare', '1212.00', '1774182275543-Honey Glow Serum.jfif', '2026-03-22T12:24:35.605Z', '1100.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (1, 'Updated Serum', 'Hair Care', '400.00', '1764082531432-grandelan.PNG', '2025-11-23T12:18:15.455Z', '300.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (3, 'Luxe Nail Polish Set', 'Nail Care', '299.00', '1764149023343-luxe nail polish.jpg', '2025-11-23T12:18:15.455Z', '250.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (4, 'Body Glow Lotion', 'Body', '520.00', '1764149069000-body glow lotion.jpg', '2025-11-23T12:18:15.455Z', '400.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (5, 'Hydra Mist Toner', 'Skin Care', '420.00', '1764149107336-hydra mist toner.jfif', '2025-11-23T12:18:15.455Z', '350.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (6, 'Honey Spa Scrub', 'Body', '560.00', '1764149148308-honey scrub.jpg', '2025-11-23T12:18:15.455Z', '500.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (22, 'Honey Glow Facial Serum', 'Skin Care', '899.00', '1777014449283-61Aqxv7CyfL._AC_SL1500_.jpg', '2026-04-24T07:06:08.402Z', '450.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (23, 'Organic Aloe Cleanser', 'Skin Care', '450.00', '1777014483710-71tkX9raBYL._AC_.jpg', '2026-04-24T07:06:08.402Z', '200.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (24, 'Vitamin C Brightening Mask', 'Skin Care', '650.00', '1777014528635-OIP (7).jfif', '2026-04-24T07:06:08.402Z', '300.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (25, 'Retinol Night Cream', 'Skin Care', '1200.00', '1777014758698-OlayRegeneristRetinol24NightFacialMoisturizer-eb0dcaed2e484feca0df647a70e7d36d.jpg', '2026-04-24T07:06:08.402Z', '600.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (26, 'Hydrating Rose Water Toner', 'Skin Care', '350.00', '1777014805904-03f8397f1880d53aa46a62b765e36a6c.jpg', '2026-04-24T07:06:08.402Z', '150.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (27, 'Argan Oil Repair Shampoo', 'Hair Care', '550.00', '1777014847345-OIP (3).webp', '2026-04-24T07:06:08.402Z', '250.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (28, 'Keratin Infusion Conditioner', 'Hair Care', '550.00', '1777014901734-OIP (8).jfif', '2026-04-24T07:06:08.402Z', '250.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (29, 'Deep Sea Minerals Hair Mask', 'Hair Care', '750.00', '1777014936682-D-H-HMCH-325_main_61099245_20210315163247_01_1200.jpg', '2026-04-24T07:06:08.402Z', '350.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (30, 'Heat Protectant Styling Spray', 'Hair Care', '400.00', '1777014999577-redken-hair-styling-thermal-spray-11-low-hold-heat-protection-spray.webp', '2026-04-24T07:06:08.402Z', '180.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (31, 'Anti-Frizz Silk Serum', 'Hair Care', '680.00', '1777015070785-R.jfif', '2026-04-24T07:06:08.402Z', '320.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (32, 'Velvet Matte Lipstick (Rose)', 'Cosmetics', '450.00', '1777015110557-OIP (4).webp', '2026-04-24T07:06:08.402Z', '200.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (33, 'HD Liquid Foundation', 'Cosmetics', '950.00', '1777015173279-catrice-hd-liquid-coverage-foundation-036-hazelnut-beige-30ml_1.webp', '2026-04-24T07:06:08.402Z', '400.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (34, 'Volume Max Waterproof Mascara', 'Cosmetics', '380.00', '1777015218092-OIP (5).webp', '2026-04-24T07:06:08.402Z', '160.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (35, 'Blush & Glow Palette', 'Cosmetics', '1100.00', '1777015248348-OIP (6).webp', '2026-04-24T07:06:08.402Z', '500.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (36, 'Long-wear Gel Eyeliner', 'Cosmetics', '320.00', '1777015278266-OIP (9).jfif', '2026-04-24T07:06:08.402Z', '140.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (37, 'Quick-Dry Top Coat', 'Nail Care', '250.00', '1777015374670-51k968+2xmL._AC_UL160_SR160,160_.jpg', '2026-04-24T07:06:08.402Z', '100.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (38, 'Cuticle Revitalizing Oil', 'Nail Care', '180.00', '1777015403829-OIP (7).webp', '2026-04-24T07:06:08.402Z', '80.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (39, 'Professional Gel Polish (Nude)', 'Nail Care', '450.00', '1777015431621-OIP (10).jfif', '2026-04-24T07:06:08.402Z', '200.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (40, 'Non-Acetone Polish Remover', 'Nail Care', '150.00', '1777015544217-OIP (8).webp', '2026-04-24T07:06:08.402Z', '60.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (41, 'Hardening Nail Base', 'Nail Care', '280.00', '1777015573665-OIP (11).jfif', '2026-04-24T07:06:08.402Z', '120.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (42, 'Professional Ionic Hair Dryer', 'Tools', '3500.00', '1777015602208-71b56p2pn6L._AC_.jpg', '2026-04-24T07:06:08.402Z', '1800.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (43, 'Ceramic Tourmaline Flat Iron', 'Tools', '2800.00', '1777015643805-OIP (12).jfif', '2026-04-24T07:06:08.402Z', '1400.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (44, 'Detangling Paddle Brush', 'Tools', '350.00', '1777015692097-OIP (9).webp', '2026-04-24T07:06:08.402Z', '150.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (45, 'Stainless Steel Manicure Set', 'Tools', '1200.00', '1777015722974-46ec6de2841d52f4fdaeb191da0f4565.jpg', '2026-04-24T07:06:08.402Z', '550.00') ON CONFLICT DO NOTHING;
INSERT INTO products (productid, prodname, prodcat, price, prodimage, createdat, supplier_price) VALUES (48, 'adaw', 'Hair Care', '2131.00', '1778387187026-OIP (11).jfif', '2026-05-10T04:26:27.118Z', '111313.00') ON CONFLICT DO NOTHING;
-- Data for supplier
INSERT INTO supplier (supplierid, suppliername, contactperson, contacts, address, remarks, productid) VALUES (4, 'New Supplier', 'David', 945678901, '101 New St, Manila', 'Test Supplier', 1) ON CONFLICT DO NOTHING;
INSERT INTO supplier (supplierid, suppliername, contactperson, contacts, address, remarks, productid) VALUES (5, 'Glow Cosmetics', 'Alice', 912345678, '123 Main St, Manila', 'Top supplier', 1) ON CONFLICT DO NOTHING;
INSERT INTO supplier (supplierid, suppliername, contactperson, contacts, address, remarks, productid) VALUES (6, 'Glow Cosmetics', 'Alice', 912345678, '123 Main St, Manila', 'Top supplier', 1) ON CONFLICT DO NOTHING;
INSERT INTO supplier (supplierid, suppliername, contactperson, contacts, address, remarks, productid) VALUES (7, 'Hair Care Co.', 'Bob', 923456789, '456 Side St, Cebu', 'Reliable supplier', NULL) ON CONFLICT DO NOTHING;
-- Data for queueservice
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (99, 172, 3) ON CONFLICT DO NOTHING;
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (100, 172, 4) ON CONFLICT DO NOTHING;
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (101, 173, 3) ON CONFLICT DO NOTHING;
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (102, 174, 7) ON CONFLICT DO NOTHING;
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (103, 175, 1) ON CONFLICT DO NOTHING;
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (104, 176, 2) ON CONFLICT DO NOTHING;
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (105, 177, 3) ON CONFLICT DO NOTHING;
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (106, 177, 4) ON CONFLICT DO NOTHING;
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (107, 178, 2) ON CONFLICT DO NOTHING;
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (108, 178, 3) ON CONFLICT DO NOTHING;
INSERT INTO queueservice (queueserviceid, queueid, serviceid) VALUES (109, 179, 1) ON CONFLICT DO NOTHING;
-- Data for queue
INSERT INTO queue (queueid, queuedate, customerid, appointmentid, staffid, customername, source, status, arrivaltime, calledat, servicestartat, serviceendat, priorityweight, positionoverride, notes, createdat, updatedat, isarrived, branchid) VALUES (177, '2026-05-08T16:00:00.000Z', 9, 117, 6, 'Ashicakes ', 'appointment', 'done', '2026-05-08T16:21:57.217Z', '2026-05-08T16:22:01.840Z', '2026-05-08T16:22:01.840Z', '2026-05-08T16:22:03.055Z', 0, NULL, NULL, '2026-05-08T16:21:57.217Z', '2026-05-08T16:22:55.608Z', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO queue (queueid, queuedate, customerid, appointmentid, staffid, customername, source, status, arrivaltime, calledat, servicestartat, serviceendat, priorityweight, positionoverride, notes, createdat, updatedat, isarrived, branchid) VALUES (178, '2026-05-08T16:00:00.000Z', 9, 118, 6, 'Ashicakes ', 'appointment', 'done', '2026-05-08T16:24:42.428Z', '2026-05-08T16:24:56.220Z', '2026-05-08T16:24:56.220Z', '2026-05-08T16:25:00.541Z', 0, NULL, NULL, '2026-05-08T16:24:42.428Z', '2026-05-08T16:25:30.823Z', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO queue (queueid, queuedate, customerid, appointmentid, staffid, customername, source, status, arrivaltime, calledat, servicestartat, serviceendat, priorityweight, positionoverride, notes, createdat, updatedat, isarrived, branchid) VALUES (179, '2026-05-08T16:00:00.000Z', NULL, NULL, 1, 'undertaker', 'walkin', 'done', '2026-05-08T16:24:52.051Z', '2026-05-08T16:24:59.260Z', '2026-05-08T16:24:59.260Z', '2026-05-08T16:25:01.260Z', 0, NULL, NULL, '2026-05-08T16:24:52.051Z', '2026-05-08T16:25:30.823Z', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO queue (queueid, queuedate, customerid, appointmentid, staffid, customername, source, status, arrivaltime, calledat, servicestartat, serviceendat, priorityweight, positionoverride, notes, createdat, updatedat, isarrived, branchid) VALUES (172, '2026-05-07T16:00:00.000Z', 9, 116, 6, 'Ashicakes ', 'appointment', 'done', '2026-05-08T15:42:31.833Z', '2026-05-08T15:42:47.702Z', '2026-05-08T15:42:47.702Z', '2026-05-08T15:42:49.558Z', 0, NULL, NULL, '2026-05-08T15:42:31.833Z', '2026-05-08T15:43:21.921Z', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO queue (queueid, queuedate, customerid, appointmentid, staffid, customername, source, status, arrivaltime, calledat, servicestartat, serviceendat, priorityweight, positionoverride, notes, createdat, updatedat, isarrived, branchid) VALUES (173, '2026-05-07T16:00:00.000Z', NULL, NULL, 1, 'drew', 'walkin', 'done', '2026-05-08T15:42:41.667Z', '2026-05-08T15:42:48.232Z', '2026-05-08T15:42:48.232Z', '2026-05-08T15:42:50.223Z', 0, NULL, NULL, '2026-05-08T15:42:41.667Z', '2026-05-08T15:43:21.921Z', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO queue (queueid, queuedate, customerid, appointmentid, staffid, customername, source, status, arrivaltime, calledat, servicestartat, serviceendat, priorityweight, positionoverride, notes, createdat, updatedat, isarrived, branchid) VALUES (174, '2026-05-08T16:00:00.000Z', NULL, NULL, 6, 'wassup', 'walkin', 'done', '2026-05-08T16:03:57.842Z', '2026-05-08T16:03:59.074Z', '2026-05-08T16:03:59.074Z', '2026-05-08T16:04:00.159Z', 0, NULL, NULL, '2026-05-08T16:03:57.842Z', '2026-05-08T16:04:10.967Z', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO queue (queueid, queuedate, customerid, appointmentid, staffid, customername, source, status, arrivaltime, calledat, servicestartat, serviceendat, priorityweight, positionoverride, notes, createdat, updatedat, isarrived, branchid) VALUES (175, '2026-05-08T16:00:00.000Z', NULL, NULL, 6, 'wetwew', 'walkin', 'done', '2026-05-08T16:19:31.520Z', '2026-05-08T16:19:32.547Z', '2026-05-08T16:19:32.547Z', '2026-05-08T16:19:33.751Z', 0, NULL, NULL, '2026-05-08T16:19:31.520Z', '2026-05-08T16:19:37.250Z', true, 2) ON CONFLICT DO NOTHING;
INSERT INTO queue (queueid, queuedate, customerid, appointmentid, staffid, customername, source, status, arrivaltime, calledat, servicestartat, serviceendat, priorityweight, positionoverride, notes, createdat, updatedat, isarrived, branchid) VALUES (176, '2026-05-08T16:00:00.000Z', NULL, NULL, 6, 'wewew', 'walkin', 'done', '2026-05-08T16:20:25.194Z', '2026-05-08T16:20:27.096Z', '2026-05-08T16:20:27.096Z', '2026-05-08T16:20:28.950Z', 0, NULL, NULL, '2026-05-08T16:20:25.194Z', '2026-05-08T16:20:53.160Z', true, 2) ON CONFLICT DO NOTHING;
-- Data for purchaseorderdetails
INSERT INTO purchaseorderdetails (purchasedetailid, purchaseid, productid, unit_price, quantity) VALUES (1, 2, 1, '450.00', 2) ON CONFLICT DO NOTHING;
-- Data for purchaseorder
INSERT INTO purchaseorder (purchaseid, supplierid, status, branchid, dateordered) VALUES (2, 4, 'Pending', 1, '2025-11-24T05:19:56.386Z') ON CONFLICT DO NOTHING;
-- Data for reservationpayment
INSERT INTO reservationpayment (reservationpaymentid, appointmentid, customerid, reference_code, method, status, currency, reservation_fee, checkout_url, paymongo_id, paid_at, created_at, updated_at, queueid, paymongo_payment_id) VALUES (152, 116, 9, 'RES-809313', 'gcash', 'paid', 'PHP', '475.00', 'https://checkout.paymongo.com/b94b4ba0070d5c4efbd7aad4', 'cs_b94b4ba0070d5c4efbd7aad4', '2026-05-08T15:42:15.095Z', '2026-05-08T15:42:08.460Z', '2026-05-08T15:42:15.095Z', NULL, 'pay_Ue1Bc6cVWCh1uaeg3fywWpxS') ON CONFLICT DO NOTHING;
INSERT INTO reservationpayment (reservationpaymentid, appointmentid, customerid, reference_code, method, status, currency, reservation_fee, checkout_url, paymongo_id, paid_at, created_at, updated_at, queueid, paymongo_payment_id) VALUES (153, NULL, NULL, 'WALK-700989', 'gcash', 'paid', 'PHP', '400.00', 'https://checkout.paymongo.com/8184871a00f5bb4e76bb6574', 'cs_8184871a00f5bb4e76bb6574', '2026-05-08T15:43:21.921Z', '2026-05-08T15:42:41.667Z', '2026-05-08T15:42:41.667Z', 173, NULL) ON CONFLICT DO NOTHING;
INSERT INTO reservationpayment (reservationpaymentid, appointmentid, customerid, reference_code, method, status, currency, reservation_fee, checkout_url, paymongo_id, paid_at, created_at, updated_at, queueid, paymongo_payment_id) VALUES (154, NULL, NULL, 'WALK-505778', 'gcash', 'paid', 'PHP', '3500.00', 'https://checkout.paymongo.com/7cf94992c9adf93de87604c6', 'cs_7cf94992c9adf93de87604c6', '2026-05-08T16:04:10.967Z', '2026-05-08T16:03:57.842Z', '2026-05-08T16:03:57.842Z', 174, NULL) ON CONFLICT DO NOTHING;
INSERT INTO reservationpayment (reservationpaymentid, appointmentid, customerid, reference_code, method, status, currency, reservation_fee, checkout_url, paymongo_id, paid_at, created_at, updated_at, queueid, paymongo_payment_id) VALUES (155, NULL, NULL, 'WALK-378352', 'cash', 'paid', 'PHP', '0.00', NULL, NULL, '2026-05-08T16:19:37.250Z', '2026-05-08T16:19:31.520Z', '2026-05-08T16:19:31.520Z', 175, NULL) ON CONFLICT DO NOTHING;
INSERT INTO reservationpayment (reservationpaymentid, appointmentid, customerid, reference_code, method, status, currency, reservation_fee, checkout_url, paymongo_id, paid_at, created_at, updated_at, queueid, paymongo_payment_id) VALUES (156, NULL, NULL, 'WALK-693906', 'cash', 'paid', 'PHP', '0.00', NULL, NULL, '2026-05-08T16:20:53.160Z', '2026-05-08T16:20:25.194Z', '2026-05-08T16:20:25.194Z', 176, NULL) ON CONFLICT DO NOTHING;
INSERT INTO reservationpayment (reservationpaymentid, appointmentid, customerid, reference_code, method, status, currency, reservation_fee, checkout_url, paymongo_id, paid_at, created_at, updated_at, queueid, paymongo_payment_id) VALUES (157, 117, 9, 'RES-354784', 'gcash', 'paid', 'PHP', '475.00', 'https://checkout.paymongo.com/a91333c4a0b3b27bb1d70e4d', 'cs_a91333c4a0b3b27bb1d70e4d', '2026-05-08T16:21:44.098Z', '2026-05-08T16:21:37.390Z', '2026-05-08T16:21:44.098Z', NULL, 'pay_9DqnbA8Y5yutuMKJw7fVfTG1') ON CONFLICT DO NOTHING;
INSERT INTO reservationpayment (reservationpaymentid, appointmentid, customerid, reference_code, method, status, currency, reservation_fee, checkout_url, paymongo_id, paid_at, created_at, updated_at, queueid, paymongo_payment_id) VALUES (158, 118, 9, 'RES-250195', 'gcash', 'paid', 'PHP', '225.00', 'https://checkout.paymongo.com/a9daa529a2efd06bd6dd4a50', 'cs_a9daa529a2efd06bd6dd4a50', '2026-05-08T16:24:29.130Z', '2026-05-08T16:24:23.007Z', '2026-05-08T16:24:29.130Z', NULL, 'pay_XN6bCgQ59KznstZYg7WbYKV9') ON CONFLICT DO NOTHING;
INSERT INTO reservationpayment (reservationpaymentid, appointmentid, customerid, reference_code, method, status, currency, reservation_fee, checkout_url, paymongo_id, paid_at, created_at, updated_at, queueid, paymongo_payment_id) VALUES (159, NULL, NULL, 'WALK-153788', 'cash', 'paid', 'PHP', '0.00', NULL, NULL, '2026-05-08T16:25:30.823Z', '2026-05-08T16:24:52.051Z', '2026-05-08T16:24:52.051Z', 179, NULL) ON CONFLICT DO NOTHING;
-- Data for service
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (2, 'Hair Services', 'Women''s Haircut', '500.00', '1776989636854-images.jfif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (3, 'Hair Services', 'Blow-dry & Style', '400.00', '1776989736078-199853554_824562655164518_8421093783201492488_n-500x628.jpeg') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (4, 'Hair Services', 'Full Hair Color', '1500.00', '1776989771376-5a2206614338fce94cc76f0bbb4615fe.jpg') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (5, 'Hair Services', 'Highlights / Balayage', '2500.00', '1776989824475-balayage-1.jpeg') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (6, 'Hair Services', 'Keratin Treatment', '2000.00', '1776989873612-gettyimages-464575644-1595615606.avif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (7, 'Hair Services', 'Rebonding', '3500.00', '1776989918914-images (1).jfif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (8, 'Nail Services', 'Basic Manicure', '300.00', '1776989950233-images (2).jfif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (9, 'Nail Services', 'Basic Pedicure', '350.00', '1776990012581-ohora-pedi-p-basic-pedicure-no-3-30305713455309.webp') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (10, 'Nail Services', 'Gel Polish Application', '600.00', '1776990260042-OIP.webp') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (11, 'Nail Services', 'Acrylic Extensions', '1200.00', '1776990342914-OIP.jfif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (12, 'Nail Services', 'Nail Art (Per Finger)', '200.00', '1776990365216-OIP (1).jfif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (13, 'Skin & Facial Services', 'Basic Facial', '800.00', '1776990389762-OIP (1).webp') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (14, 'Skin & Facial Services', 'Anti-Aging Treatment', '1500.00', '1776990427336-OIP (2).jfif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (15, 'Skin & Facial Services', 'Acne Treatment Facial', '1200.00', '1776990458189-OIP (2).webp') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (16, 'Skin & Facial Services', 'Whitening Mask', '600.00', '1776990497121-OIP (3).jfif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (17, 'Spa & Body Services', 'Relaxing Body Massage', '1200.00', '1776990527003-OIP (4).jfif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (18, 'Spa & Body Services', 'Full Body Scrub', '1000.00', '1776990586680-Screenshot+2024-07-29+193158.webp') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (19, 'Spa & Body Services', 'Underarm Waxing', '400.00', '1776990630021-OIP (5).jfif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (21, 'Beauty Enhancement Services', 'Eyebrow Threading', '200.00', '1776990755068-OIP (6).jfif') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (22, 'Beauty Enhancement Services', 'Eyelash Extensions (Classic)', '1500.00', '1776990784027-Classic-Lash-Extensions.jpg') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (23, 'Beauty Enhancement Services', 'Lash Lift & Tint', '1200.00', '1776990813155-Lash-Lift-and-Tint-Before-and-After.webp') ON CONFLICT DO NOTHING;
INSERT INTO service (serviceid, servicetype, servicename, amount, image) VALUES (1, 'Hair Services', 'Men''s Haircut', '250.00', '1776999167855-images (1).jfif') ON CONFLICT DO NOTHING;
-- Data for supplierpurchasedetails
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (172, 83, 4, 1, '2026-05-10T04:27:53.948Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (173, 83, 5, 1, '2026-05-10T04:27:53.948Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (174, 84, 38, 1, '2026-05-10T04:28:53.710Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (175, 84, 39, 1, '2026-05-10T04:28:53.710Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (176, 84, 42, 1, '2026-05-10T04:28:53.710Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (177, 85, 41, 1, '2026-05-10T04:40:53.522Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (178, 85, 42, 1, '2026-05-10T04:40:53.522Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (179, 86, 25, 1, '2026-05-10T04:41:31.785Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (180, 86, 26, 1, '2026-05-10T04:41:31.785Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (181, 86, 42, 1, '2026-05-10T04:41:31.785Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (182, 87, 18, 1, '2026-05-10T04:43:25.258Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (183, 87, 22, 1, '2026-05-10T04:43:25.258Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (184, 88, 22, 1, '2026-05-10T04:50:13.827Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (185, 88, 23, 1, '2026-05-10T04:50:13.827Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (186, 89, 4, 1, '2026-05-10T04:51:06.239Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (187, 89, 5, 1, '2026-05-10T04:51:06.239Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (188, 90, 26, 1, '2026-05-10T04:52:00.047Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (189, 90, 27, 1, '2026-05-10T04:52:00.047Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (190, 91, 5, 1, '2026-05-10T04:53:03.151Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (191, 91, 4, 1, '2026-05-10T04:53:03.151Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (192, 92, 3, 1, '2026-05-10T04:57:38.399Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (193, 92, 4, 1, '2026-05-10T04:57:38.399Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (194, 93, 34, 1, '2026-05-10T04:59:14.284Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (195, 93, 35, 1, '2026-05-10T04:59:14.284Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (196, 94, 4, 1, '2026-05-10T05:00:38.326Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (197, 94, 5, 1, '2026-05-10T05:00:38.326Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (198, 95, 22, 1, '2026-05-10T05:01:02.332Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (199, 95, 23, 1, '2026-05-10T05:01:02.332Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (200, 96, 5, 1, '2026-05-10T05:13:36.852Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (201, 96, 4, 1, '2026-05-10T05:13:36.852Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (202, 97, 4, 1, '2026-05-10T05:20:04.244Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (203, 97, 5, 1, '2026-05-10T05:20:04.244Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (204, 98, 5, 10, '2026-05-10T11:45:59.647Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (205, 98, 23, 10, '2026-05-10T11:45:59.647Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (206, 99, 23, 10, '2026-05-10T11:46:36.361Z', NULL) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchasedetails (purchasedetailid, purchaseid, productid, quantity, createdat, updatedat) VALUES (207, 99, 22, 2, '2026-05-10T11:46:36.361Z', NULL) ON CONFLICT DO NOTHING;
-- Data for staff
INSERT INTO staff (staffid, firstname, lastname, contact, userid, branchid, updatedat, image, role) VALUES (2, 'Jane', 'Smith', '09123456788', 11, 1, '2026-03-30T06:03:54.765Z', '1774850634759-pic-5.jpg', ARRAY['Spa Therapist','Beauty Specialist','Makeup Artist','Esthetician','Hair Stylist','Nail Technician']) ON CONFLICT DO NOTHING;
INSERT INTO staff (staffid, firstname, lastname, contact, userid, branchid, updatedat, image, role) VALUES (3, 'Maria', 'Santos', '0917-123-4567', 16, 1, '2025-11-27T03:23:12.173Z', NULL, ARRAY['Esthetician','Hair Stylist','Nail Technician','Makeup Artist']) ON CONFLICT DO NOTHING;
INSERT INTO staff (staffid, firstname, lastname, contact, userid, branchid, updatedat, image, role) VALUES (1, 'Anna', 'Stylist', '09123456789', 3, 2, '2025-11-17T12:06:12.286Z', NULL, ARRAY['Esthetician','Makeup Artist','Beauty Specialist','Spa Therapist','Hair Stylist','Nail Technician','Queue Monitoring']) ON CONFLICT DO NOTHING;
INSERT INTO staff (staffid, firstname, lastname, contact, userid, branchid, updatedat, image, role) VALUES (6, 'adaskie', 'asda', '09505416671', 50, 2, '2026-04-23T05:49:56.931Z', '1776923396818-pic-3.jpg', ARRAY['Nail Technician','Hair Stylist','Esthetician','Makeup Artist','Spa Therapist','Beauty Specialist','Queue Monitoring','Receptionist']) ON CONFLICT DO NOTHING;
INSERT INTO staff (staffid, firstname, lastname, contact, userid, branchid, updatedat, image, role) VALUES (8, 'qwerty', 'weqeq', '09505416671', 52, 2, '2026-04-23T06:58:00.640Z', NULL, ARRAY['Receptionist']) ON CONFLICT DO NOTHING;
INSERT INTO staff (staffid, firstname, lastname, contact, userid, branchid, updatedat, image, role) VALUES (7, 'wew', 'santos', '09505416671', 51, 3, '2026-04-23T05:32:12.486Z', NULL, ARRAY['Esthetician']) ON CONFLICT DO NOTHING;
INSERT INTO staff (staffid, firstname, lastname, contact, userid, branchid, updatedat, image, role) VALUES (9, 'Karen', 'Nerak', '09123456789', 53, 2, '2026-04-29T13:07:13.027Z', NULL, ARRAY['Manager']) ON CONFLICT DO NOTHING;
INSERT INTO staff (staffid, firstname, lastname, contact, userid, branchid, updatedat, image, role) VALUES (10, 'andrei', 'wadwa', '09505416741', 54, 2, '2026-05-03T22:54:40.204Z', NULL, ARRAY['Beauty Specialist']) ON CONFLICT DO NOTHING;
INSERT INTO staff (staffid, firstname, lastname, contact, userid, branchid, updatedat, image, role) VALUES (12, 'andrei', 'branch', '09505416671', 56, 3, '2026-05-10T11:43:08.025Z', NULL, ARRAY['Manager','Receptionist']) ON CONFLICT DO NOTHING;
-- Data for users
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (1, 'testuser', 'mypassword', 'user', 'test@example.com', true, '2025-11-13T14:38:21.337Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (4, 'vlad', '12345', 'user', 'vlad456@gmail.com', true, '2025-11-17T03:14:46.557Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (5, 'dreifinity', '123456', 'user', 'dreifinity08@gmail.com', true, '2025-11-17T03:18:32.242Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (2, 'vlad', '12345', 'user', 'vlad@gmail.com', true, '2025-11-14T15:59:06.698Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (6, 'vlad', '12345', 'user', 'vlad4214@gmail.com', true, '2025-11-23T02:43:51.757Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (7, 'vlad', '12345', 'user', 'vlad4213@gmail.com', true, '2025-11-23T02:47:07.184Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (8, 'nagba02', '12345', 'user', 'nagbaandrei@gmail.com', true, '2025-11-24T15:26:13.803Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (9, 'jake.p', '12345', 'user', 'basta@gmail.com', true, '2025-11-26T10:07:33.231Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (10, 'john_doe', '$2b$10$MMu1Llqy4NEOshS1t4XWsemkKVThHgzb5f7nspkQuuc8ZMD0dKSrm', 'customer', 'john@example.com', true, '2025-11-27T01:43:13.258Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (12, 'admin1', '$2b$10$pRTDz.IlEdROPp0vWnS2xeAbp0ckOt53PBjREz377VOWBxUs6Kv1i', 'admin', 'admin1@example.com', true, '2025-11-27T01:58:00.445Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (14, 'john_doe', '$2b$10$229xU71DQjBYCJy6csLwWeIyUFZbCeqNuQUd81XIQMN60TLPQrQLy', 'customer', 'john2@example.com', true, '2025-11-27T02:07:57.724Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (15, 'john_doe', '$2b$10$8CoLzMJHI0hOAHHpxIZk4e808Dca1tAbx6.BK4euchKVL.XTClJde', 'customer', 'john3@example.com', true, '2025-11-27T02:11:58.300Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (17, 'vlad', '$2b$10$IJCdlc.DgOM6Wy1KEcr/PeHmBufUMjUe.zfnvcdhDW3U.E9u0WYJ.', 'customer', 'vlad567@gmail.com', true, '2026-02-03T14:22:03.823Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (18, 'wew', '$2b$10$NdkvrSLNMx4QnUtpG.5nHuOKm8jBULBHAs7A0hNq3ejJGZXOvdNYW', 'customer', 'WEW@email.com', true, '2026-02-03T14:23:34.470Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (19, 'ASHITON', '$2b$10$NV2NhvawvK.aSZoNRolCVODQGdV8mx3cNDD65mYWdgS/WnsDZt4hu', 'customer', 'ashitom@email.com', true, '2026-02-04T16:57:35.460Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (20, 'wez', '$2b$10$WB6pltpf.KxFBWItjM3eOe9m3ojX.4AyJ35SLcmBgpGqjnlStQ/hy', 'customer', 'wez@email.com', true, '2026-02-06T03:07:34.897Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (21, 'dreifinity', '$2b$10$U21WlA.UZ1uAzDvBcqL9S.S8VnzhNH7AsoZuKVPbL80gY7K2WgSB6', 'customer', 'drewnagba@email.com', true, '2026-02-06T03:09:20.037Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (22, 'customer', '$2b$10$yVy9e8.2/3jQajNSx8MNjeXNDbm0qXepHvfr8tcbNhOmFkp/mObGS', 'customer', 'customer@gmail.com', true, '2026-02-06T03:38:02.031Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (23, 'Andreiskie', '$2b$10$gE2W6ySK0vWRYGAAHqQwxuQcRjqAVlEx41wjEijFOLIVyufU5O/iq', 'customer', 'Andreiskie15@gmail.com', true, '2026-02-06T05:53:38.451Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (24, 'dreiskie', '$2b$10$NldDI7fAkubrkkO/0e.Wq.JDFVoTyiKv7koWmMTeBggu23Ym/5gfG', 'customer', 'dreiskie@gmail.com', true, '2026-02-06T05:55:03.198Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (25, 'wat', '$2b$10$IpvsNm/Gs4aoR4bPN5eWO.EJZVi8hu1tXMPzLXq8iWMBgk/HSyxSu', 'customer', 'wat@gmail.com', true, '2026-02-06T05:58:35.917Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (26, 'customer', '$2b$10$FHG2fNaFUsv.OCC/lrkzauGS6mkQ9BFrq.41KK2hMavUZIBNOPYD2', 'customer', 'customer1@gmail.com', true, '2026-02-06T06:57:16.852Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (27, 'hey', '$2b$10$AhvqzkFxZQXPbtN7sK1Do.r4EJMFB792Wql1NIQB6cMlgKmmzvxhy', 'customer', 'hey@email.com', true, '2026-02-06T07:11:28.474Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (28, 'hey', '$2b$10$VDJtdpDnCJK7akTNZiWT7uEfszQEBghrRJt1Tt48hW9/XI7WK8hf.', 'customer', 'hey1@email.com', true, '2026-02-06T11:36:56.021Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (29, 'hey', '$2b$10$6lKxwX2kfq1wshxdlHIYcu8ILPxGASSwxKpHTJdTgHcjBuXi47pje', 'customer', 'hey2@email.com', true, '2026-02-06T11:43:20.574Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (30, 'hey', '$2b$10$T5rblV2flUtx/gul5WgvE.mO.tOG6GtU.vjhC4ZqA3zxypaHsiVtq', 'customer', 'watdahel@email.com', true, '2026-02-06T11:44:46.445Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (31, 'Ray', '$2b$10$EVzk8.ROrXyuh4BmQrn8KeR8qiGWh50KzTQ.41XgQjMhQ.Vb7Ms0S', 'customer', 'ray@email.com', true, '2026-02-18T09:11:29.492Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (32, 'imaizumi', '$2b$10$FXKM.LQPE0ie9/CNdhKJXO8MnezOlP1pjmPU9i8MO/dyRicMYBRlC', 'customer', 'vladimaizumi@gmail.com', true, '2026-03-06T14:06:26.355Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (33, 'john123', '$2b$10$X5t53/XW4bdMFtqc77WakezXqYntWRM.VwhqvbYL0XVrRb0CxuVxy', 'customer', 'troy@email.com', true, '2026-03-10T01:08:14.050Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (34, 'troy', '$2b$10$63w7OqawMTDHjJxat8Fdbun42xULAnqSlV054KLDt/wQPySrMwjpu', 'customer', 'troy', true, '2026-03-10T01:11:12.124Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (35, 'troy', '$2b$10$CLB7YN/QAi0FTLqyZHCDi.yEO/FsZtvMz2HmXVXa3mUpGcC8SWtHK', 'customer', 'troy@gmail.com', true, '2026-03-10T01:13:14.286Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (36, 'john123', '$2b$10$zgSxKs/g5Gtbpv8kVA/tLed43XyGTF9FltATCJ8Tx94186jFdyTcO', 'customer', 'john143@gmail.com', true, '2026-03-10T01:24:43.944Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (37, 'aikee', '$2b$10$h2z0YBrWLYBdSiBZZW0K6OiAATvNk.0UTOO9GSb4mo1tFsC/B3rsC', 'customer', 'at@gmail.com', true, '2026-03-10T01:26:42.943Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (38, 'dreii', '$2b$10$72Fc0IEcXmkOWVNFRh9f7eubwVolMH/5prfFZa0otUaoyvElGhgiC', 'customer', 'kingdrewexe@gmail.com', true, '2026-03-10T02:00:33.167Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (39, 'pahak81', '$2b$10$1Sb0ZgRtcf2J0ijhQw2pHuMldmIN/zNiSfIzp2As6kNeN6OdU7wyO', 'customer', 'lazytrader15@gmail.com', true, '2026-03-10T02:17:25.413Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (40, 'pahak81', '$2b$10$WDeKbD3YQvbDvrpFMZb0QeIAdSUJFskNTSW5VjUpWx15OmgssW3jm', 'customer', 'finitydrei@gmail.com', true, '2026-03-10T02:18:32.458Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (41, 'dadaw', '$2b$10$hiY1ko7RXDvkeKoX52W7T.1DijKPJD.p8ADnzIDi0FS1W8iQZBL3W', 'staff', 'wew@gmail.com', true, '2026-03-30T12:38:04.545Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (43, 'qwerty', '$2b$10$1HWHXniahikt27kc.4.rtuR5IyoiwCYZ52Hg7HD1WGyoIRVAcsZO6', 'customer', 'johnybravo@gmail.com', true, '2026-03-30T13:39:11.074Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (44, 'adawd', '$2b$10$2lDfXOi9gYTb5WU6WdWReecTjyfQmw2L8YbQYgHk7J.LdwPQsLmR2', 'customer', 'wqe@gmail.com', true, '2026-03-30T13:57:09.890Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (45, 'wewqe', '$2b$10$hreFt5zuFeZtNmgfRUQtQekKiVgBeVrVStfoGu3x94pzYVRyrRLhK', 'customer', 'qwe@gmail.com', true, '2026-03-30T14:02:24.717Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (48, 'adad', '$2b$10$9xzvZsWV/ib1y30WQePsPOTZwBQedbyiXK3aseoyAFToZi8xDFqn6', 'staff', 'adaskie@gmail.com', true, '2026-04-22T06:21:59.886Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (49, 'adaw', '$2b$10$9hADOtzx6OVqCotAwnDj9.5t5eJf3fIXs7pE4qQHynlQ6rwvD1hiy', 'staff', 'adaski@gmail.com', true, '2026-04-22T06:25:16.730Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (16, 'maria.s', '$2b$10$A12r.5G0cWPxzmji1GemOuUy21HlijNDNZxshs5w3HkgwJ7KUBACe', 'staff', 'maria@salon.com', true, '2025-11-27T03:23:12.160Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (3, 'vlad123', '12345', 'staff', 'vlad123@gmail.com', true, '2025-11-17T02:18:19.305Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (11, 'staff1', '$2b$10$SzrUyeXtorSyjfFRQftfK.nD.VInWvBZaDQ2ksjAGUIQdcW0p/XdG', 'staff', 'staff1@example.com', true, '2025-11-27T01:50:03.650Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (50, 'dada', '$2b$10$50hORoduAGD8uhORB3R1YOorvoYG7ZS9usoEqVGfBsdf51A/Jlvr.', 'staff', 'adaskie1@gmail.com', true, '2026-04-22T06:27:22.160Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (52, 'dwadaw', '$2b$10$f3HjswJA/rQzSBx/J0lkueun9plT3hr7v0VZor2NFBvl36g4SMXia', 'staff', 'qwerty@gmail.com', true, '2026-04-23T06:58:00.630Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (51, 'awda', '$2b$10$kjZhXuUuyBS.LC4eqhl78Of1e.QGd8jxh987MjTLWEeJX9bFx/6Ny', 'staff', 'wew1@gmail.com', true, '2026-04-23T05:32:12.470Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (53, 'Karen', '$2b$10$hAvKAu/EELhVtARDMcOJrOoGST9qbu5l0fFP1yD90VrE6C5soFqx6', 'staff', 'karen@example.com', true, '2026-04-29T10:09:40.544Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (54, 'dwa', '$2b$10$0IiimZo3/k7VeXhkUXQ3DubSQQfHgDXIK255V2iYwN8Wi0XeGcFq6', 'staff', 'andrei@gmail.com', true, '2026-05-03T22:54:40.190Z') ON CONFLICT DO NOTHING;
INSERT INTO users (userid, username, password, role, email, isactive, accountcreated) VALUES (56, 'specialist', '$2b$10$y4Fe6SisBmyta1SVYr1rUuYuwFROlSOidjjIDbjwrqtXi.uX7fA06', 'staff', 'andrei@example.com', true, '2026-05-10T11:43:07.996Z') ON CONFLICT DO NOTHING;
-- Data for reservation_settlements
INSERT INTO reservation_settlements (settlementid, reference_code, method, status, paymongo_id, checkout_url, paid_at, created_at, updated_at) VALUES (15, 'SET-155466', 'gcash', 'paid', 'cs_ea3eafd1a788d60061864152', 'https://checkout.paymongo.com/ea3eafd1a788d60061864152', '2026-05-08T15:43:21.921Z', '2026-05-08T15:42:57.124Z', '2026-05-08T15:43:21.921Z') ON CONFLICT DO NOTHING;
INSERT INTO reservation_settlements (settlementid, reference_code, method, status, paymongo_id, checkout_url, paid_at, created_at, updated_at) VALUES (16, 'SET-177240', 'cash', 'paid', NULL, NULL, '2026-05-08T16:04:10.967Z', '2026-05-08T16:04:10.930Z', '2026-05-08T16:04:10.967Z') ON CONFLICT DO NOTHING;
INSERT INTO reservation_settlements (settlementid, reference_code, method, status, paymongo_id, checkout_url, paid_at, created_at, updated_at) VALUES (17, 'SET-610058', 'cash', 'paid', NULL, NULL, '2026-05-08T16:19:37.250Z', '2026-05-08T16:19:37.191Z', '2026-05-08T16:19:37.250Z') ON CONFLICT DO NOTHING;
INSERT INTO reservation_settlements (settlementid, reference_code, method, status, paymongo_id, checkout_url, paid_at, created_at, updated_at) VALUES (18, 'SET-867451', 'gcash', 'paid', 'cs_dacaa86b65e8412049e8e9ec', 'https://checkout.paymongo.com/dacaa86b65e8412049e8e9ec', '2026-05-08T16:20:53.160Z', '2026-05-08T16:20:32.402Z', '2026-05-08T16:20:53.160Z') ON CONFLICT DO NOTHING;
INSERT INTO reservation_settlements (settlementid, reference_code, method, status, paymongo_id, checkout_url, paid_at, created_at, updated_at) VALUES (19, 'SET-806235', 'gcash', 'paid', 'cs_bc56164170b3f691d8690167', 'https://checkout.paymongo.com/bc56164170b3f691d8690167', '2026-05-08T16:22:55.608Z', '2026-05-08T16:22:07.350Z', '2026-05-08T16:22:55.608Z') ON CONFLICT DO NOTHING;
INSERT INTO reservation_settlements (settlementid, reference_code, method, status, paymongo_id, checkout_url, paid_at, created_at, updated_at) VALUES (20, 'SET-707449', 'gcash', 'paid', 'cs_09b9403311563506760da0de', 'https://checkout.paymongo.com/09b9403311563506760da0de', '2026-05-08T16:25:30.823Z', '2026-05-08T16:25:12.252Z', '2026-05-08T16:25:30.823Z') ON CONFLICT DO NOTHING;
-- Data for settlement_items
INSERT INTO settlement_items (itemid, settlementid, reservationpaymentid) VALUES (26, 15, 152) ON CONFLICT DO NOTHING;
INSERT INTO settlement_items (itemid, settlementid, reservationpaymentid) VALUES (27, 15, 153) ON CONFLICT DO NOTHING;
INSERT INTO settlement_items (itemid, settlementid, reservationpaymentid) VALUES (28, 16, 154) ON CONFLICT DO NOTHING;
INSERT INTO settlement_items (itemid, settlementid, reservationpaymentid) VALUES (29, 17, 155) ON CONFLICT DO NOTHING;
INSERT INTO settlement_items (itemid, settlementid, reservationpaymentid) VALUES (30, 18, 156) ON CONFLICT DO NOTHING;
INSERT INTO settlement_items (itemid, settlementid, reservationpaymentid) VALUES (31, 19, 157) ON CONFLICT DO NOTHING;
INSERT INTO settlement_items (itemid, settlementid, reservationpaymentid) VALUES (32, 20, 158) ON CONFLICT DO NOTHING;
INSERT INTO settlement_items (itemid, settlementid, reservationpaymentid) VALUES (33, 20, 159) ON CONFLICT DO NOTHING;
-- Data for supplierpayment
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (92, 90, '100', 'CASH', NULL, NULL, 'PAID', '2026-05-10T04:52:00.053Z', '2026-05-10T04:52:00.053Z', 'REF-1778388720053-B5Y9Y', 'PAYLATER', 30) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (93, 91, '100', 'CASH', NULL, NULL, 'PENDING', '2026-05-10T04:53:03.157Z', '2026-05-10T04:53:03.157Z', 'REF-1778388783156-YILHI', 'PAYLATER', 30) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (94, 91, '650', 'GCASH', 'cs_51a7088c0e03e9c2fc043668', 'https://checkout.paymongo.com/51a7088c0e03e9c2fc043668', 'PAID', '2026-05-10T04:56:33.210Z', '2026-05-10T04:56:33.210Z', 'REF-1778388993208-TGA8J', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (95, 92, '650', 'CASH', NULL, NULL, 'PENDING', '2026-05-10T04:57:38.405Z', '2026-05-10T04:57:38.405Z', 'REF-1778389058405-IE1VG', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (96, 93, '0', NULL, NULL, NULL, 'PENDING', '2026-05-10T04:59:14.303Z', '2026-05-10T04:59:14.303Z', 'REF-1778389154302-LYBD6', 'PAYLATER', 30) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (97, 94, '750', 'CASH', NULL, NULL, 'PENDING', '2026-05-10T05:00:38.332Z', '2026-05-10T05:00:38.332Z', 'REF-1778389238332-XG47N', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (98, 95, '0', NULL, NULL, NULL, 'PENDING', '2026-05-10T05:01:02.339Z', '2026-05-10T05:01:02.339Z', 'REF-1778389262339-9M3D5', 'PAYLATER', 30) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (99, 96, '100', 'CASH', NULL, NULL, 'PENDING', '2026-05-10T05:13:36.866Z', '2026-05-10T05:13:36.866Z', 'REF-1778390016865-RC7B5', 'PAYLATER', 30) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (100, 97, '0', NULL, NULL, NULL, 'PENDING', '2026-05-10T05:20:04.261Z', '2026-05-10T05:20:04.261Z', 'PO-1778390404261-9JKP1', 'PAYLATER', 30) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (80, 83, '0', NULL, NULL, NULL, 'PENDING', '2026-05-10T04:27:53.961Z', '2026-05-10T04:27:53.961Z', 'REF-1778387273960-5JTVX', 'PAYLATER', 30) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (81, 83, '940', 'GCASH', 'cs_0ba1e5ecda409d5f4d48ad32', 'https://checkout.paymongo.com/0ba1e5ecda409d5f4d48ad32', 'PAID', '2026-05-10T04:28:18.603Z', '2026-05-10T04:28:18.603Z', 'REF-1778387298531-YL9WS', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (82, 84, '0', NULL, NULL, NULL, 'PENDING', '2026-05-10T04:28:53.717Z', '2026-05-10T04:28:53.717Z', 'REF-1778387333717-5ZUKZ', 'PAYLATER', 30) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (83, 84, '2000', 'GCASH', 'cs_abae9cb35ad218c279c4d6a6', 'https://checkout.paymongo.com/abae9cb35ad218c279c4d6a6', 'PAID', '2026-05-10T04:31:21.029Z', '2026-05-10T04:31:21.029Z', 'REF-1778387481028-8PHVH', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (84, 84, '2130', 'GCASH', 'cs_52f717b522b41a71ed8f1986', 'https://checkout.paymongo.com/52f717b522b41a71ed8f1986', 'PAID', '2026-05-10T04:39:28.280Z', '2026-05-10T04:39:28.280Z', 'REF-1778387968279-9KOH4', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (85, 85, '1920', 'GCASH', 'cs_5b004e5847f6b2a1d3412ce0', 'https://checkout.paymongo.com/5b004e5847f6b2a1d3412ce0', 'PAID', '2026-05-10T04:41:01.933Z', '2026-05-10T04:41:01.933Z', 'REF-1778388061932-XB58H', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (86, 86, '2550', 'GCASH', 'cs_3a94cb48f5c5d1db2fac8a6f', 'https://checkout.paymongo.com/3a94cb48f5c5d1db2fac8a6f', 'PAID', '2026-05-10T04:41:40.456Z', '2026-05-10T04:41:40.456Z', 'REF-1778388100455-JEE51', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (87, 87, '100', 'GCASH', 'cs_0ca77db74306b85d65131d54', 'https://checkout.paymongo.com/0ca77db74306b85d65131d54', 'PAID', '2026-05-10T04:43:34.402Z', '2026-05-10T04:43:34.402Z', 'REF-1778388214401-VUQWP', 'PAYLATER', 15) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (88, 87, '1450', 'GCASH', 'cs_6fbff23305d69f3c9144787a', 'https://checkout.paymongo.com/6fbff23305d69f3c9144787a', 'PAID', '2026-05-10T04:45:18.611Z', '2026-05-10T04:45:18.611Z', 'REF-1778388318611-AVYYM', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (89, 88, '0', NULL, NULL, NULL, 'PENDING', '2026-05-10T04:50:13.842Z', '2026-05-10T04:50:13.842Z', 'REF-1778388613842-L1STP', 'PAYLATER', 30) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (90, 88, '650', 'GCASH', 'cs_a6618bf3cce95ac5d3e41a72', 'https://checkout.paymongo.com/a6618bf3cce95ac5d3e41a72', 'PAID', '2026-05-10T04:50:30.245Z', '2026-05-10T04:50:30.245Z', 'REF-1778388630243-OOC7A', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (91, 89, '750', 'CASH', NULL, NULL, 'PENDING', '2026-05-10T04:51:06.247Z', '2026-05-10T04:51:06.247Z', 'REF-1778388666246-GLDX5', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (101, 97, '750', 'GCASH', 'cs_7b59f98e9511e71bb3f14ea3', 'https://checkout.paymongo.com/7b59f98e9511e71bb3f14ea3', 'PAID', '2026-05-10T05:20:24.538Z', '2026-05-10T05:20:24.538Z', 'PO-1778390424369-FS95B', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (102, 98, '5500', 'CASH', NULL, NULL, 'PENDING', '2026-05-10T11:45:59.676Z', '2026-05-10T11:45:59.676Z', 'PO-1778413559675-45AL4', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
INSERT INTO supplierpayment (supplierpaymentid, purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, createdat, updatedat, reference_code, payment_type, payment_term_days) VALUES (103, 99, '2900', 'CASH', NULL, NULL, 'PAID', '2026-05-10T11:46:36.371Z', '2026-05-10T11:46:36.371Z', 'PO-1778413596370-NQ9T9', 'IMMEDIATE', 0) ON CONFLICT DO NOTHING;
-- Data for supplierpurchase
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (85, 6, 'COMPLETED', '2026-05-10T04:40:53.522Z', '2026-05-10T04:41:01.935Z', 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (87, 7, 'COMPLETED', '2026-05-10T04:43:25.258Z', '2026-05-10T04:45:18.626Z', 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (88, 7, 'COMPLETED', '2026-05-10T04:50:13.827Z', '2026-05-10T04:50:30.247Z', 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (89, 7, 'PENDING', '2026-05-10T04:51:06.239Z', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (90, 7, 'ARRIVED', '2026-05-10T04:52:00.047Z', '2026-05-10T04:52:22.209Z', 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (91, 6, 'COMPLETED', '2026-05-10T04:53:03.151Z', '2026-05-10T04:56:33.212Z', 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (92, 7, 'PENDING', '2026-05-10T04:57:38.399Z', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (93, 6, 'PENDING', '2026-05-10T04:59:14.284Z', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (94, 5, 'PENDING', '2026-05-10T05:00:38.326Z', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (95, 6, 'PENDING', '2026-05-10T05:01:02.332Z', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (96, 7, 'PENDING', '2026-05-10T05:13:36.852Z', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (97, 5, 'COMPLETED', '2026-05-10T05:20:04.244Z', '2026-05-10T05:20:24.543Z', 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (86, 6, 'ARRIVED', '2026-05-10T04:41:31.785Z', '2026-05-10T11:30:44.944Z', 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (98, 7, 'PENDING', '2026-05-10T11:45:59.647Z', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (99, 6, 'ARRIVED', '2026-05-10T11:46:36.361Z', '2026-05-10T11:46:44.384Z', 3) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (83, 7, 'COMPLETED', '2026-05-10T04:27:53.948Z', '2026-05-10T04:28:18.607Z', 2) ON CONFLICT DO NOTHING;
INSERT INTO supplierpurchase (purchaseid, supplierid, status, createdat, updatedat, branchid) VALUES (84, 7, 'COMPLETED', '2026-05-10T04:28:53.710Z', '2026-05-10T04:39:28.287Z', 2) ON CONFLICT DO NOTHING;

COMMIT;