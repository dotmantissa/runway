CREATE TABLE IF NOT EXISTS payment_events (
 id text PRIMARY KEY,
 workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
 invoice_id text NOT NULL,
 amount_atomic numeric(24,0) NOT NULL CHECK(amount_atomic>0),
 paid_date text NOT NULL,
 source text NOT NULL CHECK(source IN ('user_confirmed','tatum_verified')),
 receipt_id text REFERENCES receipts(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_events_invoice ON payment_events(workspace_id,invoice_id);
INSERT INTO migrations(version) VALUES(3) ON CONFLICT DO NOTHING;
