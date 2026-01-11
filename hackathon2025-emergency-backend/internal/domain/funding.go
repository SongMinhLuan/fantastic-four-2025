package domain

import "time"

const (
	FundingStatusPending   = "PENDING"
	FundingStatusConfirmed = "CONFIRMED"
	FundingStatusCanceled  = "CANCELED"
	FundingStatusRefunded  = "REFUNDED"
	FundingStatusSettled   = "SETTLED"
)

type Funding struct {
	ID          string     `db:"id" json:"id"`
	InvoiceID   string     `db:"invoice_id" json:"invoice_id"`
	InvestorID  string     `db:"investor_id" json:"investor_id"`
	Amount      float64    `db:"amount" json:"amount"`
	APRPercent  float64    `db:"apr_percent" json:"apr_percent"`
	TermMonths  int        `db:"term_months" json:"term_months"`
	Status      string     `db:"status" json:"status"`
	TxHash      *string    `db:"tx_hash" json:"tx_hash"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	ConfirmedAt *time.Time `db:"confirmed_at" json:"confirmed_at"`
	SettledAt   *time.Time `db:"settled_at" json:"settled_at"`
}
