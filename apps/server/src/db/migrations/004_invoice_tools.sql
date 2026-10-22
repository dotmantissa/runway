CREATE TABLE tool_policies (
  workspace_id text PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  per_call_atomic numeric(24,0) NOT NULL CHECK(per_call_atomic BETWEEN 10000 AND 50000),
  daily_atomic numeric(24,0) NOT NULL CHECK(daily_atomic BETWEEN 10000 AND 200000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tool_wallets (address text PRIMARY KEY, active_order_id text);
CREATE TABLE tool_budget_days (
  wallet_address text NOT NULL,
  day text NOT NULL,
  reserved_atomic numeric(24,0) NOT NULL DEFAULT 0 CHECK(reserved_atomic>=0),
  spent_atomic numeric(24,0) NOT NULL DEFAULT 0 CHECK(spent_atomic>=0),
  reserved_gas numeric(24,0) NOT NULL DEFAULT 0 CHECK(reserved_gas>=0),
  spent_gas numeric(24,0) NOT NULL DEFAULT 0 CHECK(spent_gas>=0),
  PRIMARY KEY(wallet_address,day)
);
CREATE TABLE tool_orders (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'quoted',
  request_hash text NOT NULL,
  input_text text,
  input_expires_at timestamptz NOT NULL DEFAULT now()+interval '1 hour',
  challenge text NOT NULL,
  service_url text NOT NULL,
  recipient text NOT NULL,
  wallet_address text NOT NULL,
  amount_atomic numeric(24,0) NOT NULL,
  reservation_day text,
  budget_state text NOT NULL DEFAULT 'none',
  gas_budget numeric(24,0),
  lease_until timestamptz,
  result jsonb,
  receipt jsonb,
  invoice_id text,
  error text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id,idempotency_key)
);
CREATE TABLE tool_payment_attempts (
  order_id text PRIMARY KEY REFERENCES tool_orders(id) ON DELETE CASCADE,
  digest text NOT NULL UNIQUE,
  transaction_bytes text NOT NULL,
  signature text NOT NULL,
  credential text,
  broadcast_started_at timestamptz,
  settled_at timestamptz
);
CREATE TABLE parser_paid_jobs (
  digest text PRIMARY KEY,
  request_id text NOT NULL UNIQUE,
  request_hash text NOT NULL,
  challenge_id text NOT NULL,
  sender text NOT NULL,
  receipt jsonb NOT NULL,
  status text NOT NULL,
  result jsonb,
  error text,
  lease_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tool_orders_scope ON tool_orders(workspace_id,created_at DESC);
INSERT INTO migrations(version) VALUES(4);
