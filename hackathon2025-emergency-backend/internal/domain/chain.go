package domain

import "time"

const (
	ChainStatusPending   = "PENDING"
	ChainStatusConfirmed = "CONFIRMED"
	ChainStatusFailed    = "FAILED"
)

type InvoiceOnChain struct {
	InvoiceID       string     `db:"invoice_id" json:"invoice_id"`
	ContractAddress string     `db:"contract_address" json:"contract_address"`
	TokenID         *string    `db:"token_id" json:"token_id"`
	MintTxHash      *string    `db:"mint_tx_hash" json:"mint_tx_hash"`
	ChainStatus     string     `db:"chain_status" json:"chain_status"`
	MintedAt        *time.Time `db:"minted_at" json:"minted_at"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
}

type ChainTx struct {
	TxHash      string     `db:"tx_hash" json:"tx_hash"`
	Type        string     `db:"type" json:"type"`
	Status      string     `db:"status" json:"status"`
	Error       *string    `db:"error" json:"error"`
	ReceiptJSON []byte     `db:"receipt_json" json:"receipt_json"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	ConfirmedAt *time.Time `db:"confirmed_at" json:"confirmed_at"`
}
