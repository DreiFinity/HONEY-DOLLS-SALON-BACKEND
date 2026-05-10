-- SUPABASE READY MIGRATION
-- This script uses SERIAL for primary keys to ensure compatibility

BEGIN;

-- Drop existing tables if you want a clean start (Optional)
-- DROP TABLE IF EXISTS announcement, customers, admin, branch, orders, orderdetails, products, product_adjustments, product_returns, product_transfers, services, staff, supplier, supplierpayment, supplierpurchase, supplierpurchasedetails, users, active_sessions CASCADE;

CREATE TABLE IF NOT EXISTS users (
  userid SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin (
  adminid SERIAL PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  contact TEXT,
  userid INTEGER REFERENCES users(userid),
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  image TEXT
);

CREATE TABLE IF NOT EXISTS branch (
  branchid SERIAL PRIMARY KEY,
  branchname TEXT NOT NULL,
  location TEXT,
  contact TEXT
);

CREATE TABLE IF NOT EXISTS staff (
  staffid SERIAL PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  contact TEXT,
  role TEXT,
  branchid INTEGER REFERENCES branch(branchid),
  userid INTEGER REFERENCES users(userid),
  image TEXT,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  customerid SERIAL PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  contact TEXT,
  userid INTEGER REFERENCES users(userid),
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  profileimage TEXT
);

CREATE TABLE IF NOT EXISTS products (
  productid SERIAL PRIMARY KEY,
  prodname TEXT NOT NULL,
  prodcat TEXT,
  price DECIMAL(10,2) NOT NULL,
  supplier_price DECIMAL(10,2) DEFAULT 0,
  prodimage TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  serviceid SERIAL PRIMARY KEY,
  servicename TEXT NOT NULL,
  servicetype TEXT,
  amount DECIMAL(10,2) NOT NULL,
  image TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_transfers (
  transferid SERIAL PRIMARY KEY,
  productid INTEGER REFERENCES products(productid),
  from_branchid INTEGER REFERENCES branch(branchid),
  to_branchid INTEGER REFERENCES branch(branchid),
  quantity INTEGER NOT NULL,
  transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'PENDING',
  remarks TEXT,
  reference_code TEXT
);

CREATE TABLE IF NOT EXISTS product_returns (
  returnid SERIAL PRIMARY KEY,
  orderid INTEGER,
  customerid INTEGER REFERENCES customers(customerid),
  productid INTEGER REFERENCES products(productid),
  quantity INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  reference_code TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcement (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  priority TEXT,
  audience TEXT,
  status TEXT,
  start_date DATE,
  start_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: Add other tables as needed based on your local schema
-- This script provides the core structure. 

COMMIT;
