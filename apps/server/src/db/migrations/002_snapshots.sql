ALTER TABLE plans ADD COLUMN IF NOT EXISTS input_snapshot jsonb;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS history_snapshot jsonb;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS allocations_scope ON allocations(workspace_id,receipt_id,invoice_id);
INSERT INTO migrations(version) VALUES(2) ON CONFLICT DO NOTHING;
