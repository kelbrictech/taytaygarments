-- 006: procurement capabilities for the Taytay IMS demonstration (additive migration).
CREATE TABLE IF NOT EXISTS ttc_suppliers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text NOT NULL UNIQUE,
 name text NOT NULL,
 region text NOT NULL DEFAULT 'Rizal',
 contact_email text NOT NULL DEFAULT '',
 demo boolean NOT NULL DEFAULT true,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ttc_purchase_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 po_no text NOT NULL UNIQUE,
 supplier_id uuid NOT NULL REFERENCES ttc_suppliers(id),
 created_by uuid REFERENCES ttc_users(id),
 status text NOT NULL DEFAULT 'draft'
 CHECK(status IN ('draft','issued','partial','received','cancelled')),
 expected_date date,
 notes text NOT NULL DEFAULT '',
 demo boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ttc_purchase_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 po_id uuid NOT NULL REFERENCES ttc_purchase_orders(id),
 stock_id uuid NOT NULL REFERENCES ttc_stock_items(id),
 ordered_qty integer NOT NULL CHECK(ordered_qty>0),
 received_qty integer NOT NULL DEFAULT 0 CHECK(received_qty>=0 AND received_qty<=ordered_qty),
 UNIQUE(po_id,stock_id)
);
CREATE INDEX IF NOT EXISTS ttc_purchase_orders_supplier_idx ON ttc_purchase_orders(supplier_id,created_at DESC);
CREATE INDEX IF NOT EXISTS ttc_purchase_lines_po_idx ON ttc_purchase_lines(po_id);
