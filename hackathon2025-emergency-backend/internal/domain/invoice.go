package domain

import "time"

const (
	InvoiceStatusDraft         = "DRAFT"
	InvoiceStatusSubmitted     = "SUBMITTED"
	InvoiceStatusApproved      = "APPROVED"
	InvoiceStatusTokenized     = "TOKENIZED"
	InvoiceStatusFunded        = "FUNDED"
	InvoiceStatusPartiallyPaid = "PARTIALLY_PAID"
	InvoiceStatusPaid          = "PAID"
	InvoiceStatusDefaulted     = "DEFAULTED"
	InvoiceStatusCanceled      = "CANCELED"
)

type Invoice struct {
	ID            string      `db:"id" json:"id"`
	IssuerID      string      `db:"issuer_id" json:"issuer_id"`
	Title         string      `db:"title" json:"title"`
	InvoiceNumber string      `db:"invoice_number" json:"invoice_number"`
	Amount        float64     `db:"amount" json:"amount"`
	Currency      string      `db:"currency" json:"currency"`
	TermMonths    int         `db:"term_months" json:"term_months"`
	DueDate       time.Time   `db:"due_date" json:"due_date"`
	RiskTier      *string     `db:"risk_tier" json:"risk_tier"`
	APRPercent    *float64    `db:"apr_percent" json:"apr_percent"`
	FundingTarget float64     `db:"funding_target" json:"funding_target"`
	FundedAmount  float64     `db:"funded_amount" json:"funded_amount"`
	Status        string      `db:"status" json:"status"`
	EmergencyLane bool        `db:"emergency_lane" json:"emergency_lane"`
	Tags          StringSlice `db:"tags" json:"tags"`
	CreatedAt     time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time   `db:"updated_at" json:"updated_at"`
}
