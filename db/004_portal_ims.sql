-- 004: multi-function site, demo operations and role-gated portal. Additive migration.
CREATE TABLE IF NOT EXISTS ttc_users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL UNIQUE, full_name text NOT NULL,
 role text NOT NULL CHECK(role IN('customer','staff','admin','webmaster')),
 approval_status text NOT NULL DEFAULT 'pending' CHECK(approval_status IN('approved','pending','rejected')),
 password_salt text NOT NULL CHECK(length(password_salt)=32),
 password_hash text NOT NULL CHECK(length(password_hash)=64),
 password_iterations integer NOT NULL DEFAULT 600000 CHECK(password_iterations>=600000),
 demo boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT ttc_user_email_lower CHECK(email=lower(email))
);
CREATE TABLE IF NOT EXISTS ttc_sessions (
 token_hash char(64) PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES ttc_users(id) ON DELETE CASCADE,
 csrf_token char(64) NOT NULL,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ttc_sessions_expiry_idx ON ttc_sessions(expires_at);
CREATE TABLE IF NOT EXISTS ttc_login_attempts (
 id bigserial PRIMARY KEY, email text NOT NULL, ip_hash char(64),
 success boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ttc_login_window_idx ON ttc_login_attempts(email,created_at DESC);
CREATE TABLE IF NOT EXISTS ttc_stock_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sku text NOT NULL UNIQUE, description text NOT NULL,
 category text NOT NULL, unit text NOT NULL DEFAULT 'pcs',
 location text NOT NULL DEFAULT 'Main',
 on_hand integer NOT NULL DEFAULT 0 CHECK(on_hand>=0),
 reorder_point integer NOT NULL DEFAULT 0 CHECK(reorder_point>=0),
 demo boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ttc_stock_movements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 stock_id uuid NOT NULL REFERENCES ttc_stock_items(id),
 actor_id uuid REFERENCES ttc_users(id),
 delta integer NOT NULL CHECK(delta <> 0),
 reason text NOT NULL CHECK(reason IN('receipt','issue','adjustment','return','demo_seed')),
 note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ttc_stock_ledger_idx ON ttc_stock_movements(stock_id,created_at DESC);
CREATE TABLE IF NOT EXISTS ttc_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_no text NOT NULL UNIQUE,
 customer_id uuid NOT NULL REFERENCES ttc_users(id),
 status text NOT NULL DEFAULT 'received' CHECK(status IN('received','sampling','approved','production','quality_check','dispatch','delivered','cancelled')),
 description text NOT NULL, quantity integer NOT NULL CHECK(quantity>0),
 delivery_target date, demo boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ttc_orders_customer_idx ON ttc_orders(customer_id,created_at DESC);
CREATE TABLE IF NOT EXISTS ttc_order_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id uuid NOT NULL REFERENCES ttc_orders(id),
 actor_id uuid REFERENCES ttc_users(id),
 status text NOT NULL, note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ttc_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text NOT NULL UNIQUE,
 title text NOT NULL,
 department text NOT NULL,location text NOT NULL DEFAULT 'Taytay, Rizal',
 arrangement text NOT NULL DEFAULT 'On-site',
 summary text NOT NULL,
 published boolean NOT NULL DEFAULT false,
 demo boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ttc_content_pages (
 slug text PRIMARY KEY CHECK(slug ~ '^[a-z0-9-]+$'),
 title text NOT NULL,
 body text NOT NULL,
 published boolean NOT NULL DEFAULT false,
 updated_by uuid REFERENCES ttc_users(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ttc_audit_log (
 id bigserial PRIMARY KEY,
 actor_id uuid REFERENCES ttc_users(id),
 action text NOT NULL, entity text NOT NULL, entity_key text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
