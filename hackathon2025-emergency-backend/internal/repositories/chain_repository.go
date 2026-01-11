package repositories

import (
	"context"
	"time"

	"invoiceflow/internal/domain"

	"github.com/jmoiron/sqlx"
)

type ChainRepository struct {
	db *sqlx.DB
}

func NewChainRepository(db *sqlx.DB) *ChainRepository {
	return &ChainRepository{db: db}
}

func (r *ChainRepository) GetOnchainByInvoiceID(ctx context.Context, invoiceID string) (*domain.InvoiceOnChain, error) {
	query := `
    SELECT invoice_id, contract_address, token_id, mint_tx_hash, chain_status, minted_at, created_at, updated_at
    FROM invoice_onchain
    WHERE invoice_id = $1
  `

	var record domain.InvoiceOnChain
	if err := r.db.GetContext(ctx, &record, query, invoiceID); err != nil {
		return nil, err
	}

	return &record, nil
}

func (r *ChainRepository) CreateOnchain(ctx context.Context, record *domain.InvoiceOnChain) (*domain.InvoiceOnChain, error) {
	query := `
    INSERT INTO invoice_onchain (invoice_id, contract_address, token_id, mint_tx_hash, chain_status, minted_at)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING invoice_id, contract_address, token_id, mint_tx_hash, chain_status, minted_at, created_at, updated_at
  `

	var created domain.InvoiceOnChain
	if err := r.db.GetContext(ctx, &created, query,
		record.InvoiceID,
		record.ContractAddress,
		record.TokenID,
		record.MintTxHash,
		record.ChainStatus,
		record.MintedAt,
	); err != nil {
		return nil, err
	}

	return &created, nil
}

func (r *ChainRepository) UpdateOnchainStatus(ctx context.Context, invoiceID string, status string, mintedAt *time.Time) (*domain.InvoiceOnChain, error) {
	query := `
    UPDATE invoice_onchain
    SET chain_status = $2,
        minted_at = COALESCE($3, minted_at),
        updated_at = now()
    WHERE invoice_id = $1
    RETURNING invoice_id, contract_address, token_id, mint_tx_hash, chain_status, minted_at, created_at, updated_at
  `

	var record domain.InvoiceOnChain
	if err := r.db.GetContext(ctx, &record, query, invoiceID, status, mintedAt); err != nil {
		return nil, err
	}

	return &record, nil
}

func (r *ChainRepository) CreateChainTx(ctx context.Context, tx *domain.ChainTx) (*domain.ChainTx, error) {
	query := `
    INSERT INTO chain_txs (tx_hash, type, status, error, receipt_json)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING tx_hash, type, status, error, receipt_json, created_at, confirmed_at
  `

	var created domain.ChainTx
	if err := r.db.GetContext(ctx, &created, query, tx.TxHash, tx.Type, tx.Status, tx.Error, tx.ReceiptJSON); err != nil {
		return nil, err
	}

	return &created, nil
}

func (r *ChainRepository) GetChainTx(ctx context.Context, hash string) (*domain.ChainTx, error) {
	query := `
    SELECT tx_hash, type, status, error, receipt_json, created_at, confirmed_at
    FROM chain_txs
    WHERE tx_hash = $1
  `

	var record domain.ChainTx
	if err := r.db.GetContext(ctx, &record, query, hash); err != nil {
		return nil, err
	}

	return &record, nil
}

func (r *ChainRepository) UpdateChainTx(ctx context.Context, hash string, status string, errMsg *string, receipt []byte, confirmedAt *time.Time) (*domain.ChainTx, error) {
	query := `
    UPDATE chain_txs
    SET status = $2,
        error = $3,
        receipt_json = $4,
        confirmed_at = COALESCE($5, confirmed_at)
    WHERE tx_hash = $1
    RETURNING tx_hash, type, status, error, receipt_json, created_at, confirmed_at
  `

	var record domain.ChainTx
	if err := r.db.GetContext(ctx, &record, query, hash, status, errMsg, receipt, confirmedAt); err != nil {
		return nil, err
	}

	return &record, nil
}
