-- +goose Up
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  invoice_number text NOT NULL,
  amount numeric(18,2) NOT NULL,
  currency text NOT NULL,
  term_months integer NOT NULL,
  due_date date NOT NULL,
  risk_tier text,
  apr_percent numeric(6,2),
  funding_target numeric(18,2) NOT NULL,
  funded_amount numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'DRAFT',
  emergency_lane boolean NOT NULL DEFAULT false,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fundings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  investor_id uuid NOT NULL REFERENCES users(id),
  amount numeric(18,2) NOT NULL,
  apr_percent numeric(6,2) NOT NULL,
  term_months integer NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  settled_at timestamptz
);

CREATE TABLE chain_txs (
  tx_hash text PRIMARY KEY,
  type text NOT NULL,
  status text NOT NULL,
  error text,
  receipt_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

CREATE TABLE invoice_onchain (
  invoice_id uuid PRIMARY KEY REFERENCES invoices(id) ON DELETE CASCADE,
  contract_address text NOT NULL,
  token_id text,
  mint_tx_hash text,
  chain_status text NOT NULL,
  minted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issuer ON invoices(issuer_id);
CREATE INDEX idx_invoices_risk_tier ON invoices(risk_tier);
CREATE INDEX idx_fundings_invoice ON fundings(invoice_id);
CREATE INDEX idx_fundings_investor ON fundings(investor_id);
CREATE INDEX idx_fundings_status ON fundings(status);
CREATE INDEX idx_chain_txs_status ON chain_txs(status);
CREATE INDEX idx_chain_txs_type ON chain_txs(type);
CREATE INDEX idx_invoice_onchain_mint_tx ON invoice_onchain(mint_tx_hash);
CREATE INDEX idx_invoice_onchain_token ON invoice_onchain(token_id);

-- +goose Down
DROP TABLE IF EXISTS invoice_onchain;
DROP TABLE IF EXISTS chain_txs;
DROP TABLE IF EXISTS fundings;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS users;
