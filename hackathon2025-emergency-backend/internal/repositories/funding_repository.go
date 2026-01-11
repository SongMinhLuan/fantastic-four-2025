package repositories

import (
	"context"

	"invoiceflow/internal/domain"

	"github.com/jmoiron/sqlx"
)

type FundingRepository struct {
	db *sqlx.DB
}

func NewFundingRepository(db *sqlx.DB) *FundingRepository {
	return &FundingRepository{db: db}
}

func (r *FundingRepository) Create(ctx context.Context, tx *sqlx.Tx, funding *domain.Funding) (*domain.Funding, error) {
	query := `
    INSERT INTO fundings (invoice_id, investor_id, amount, apr_percent, term_months, status, tx_hash)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id, invoice_id, investor_id, amount, apr_percent, term_months, status, tx_hash, created_at, confirmed_at, settled_at
  `

	var created domain.Funding
	if err := tx.GetContext(ctx, &created, query,
		funding.InvoiceID,
		funding.InvestorID,
		funding.Amount,
		funding.APRPercent,
		funding.TermMonths,
		funding.Status,
		funding.TxHash,
	); err != nil {
		return nil, err
	}

	return &created, nil
}

func (r *FundingRepository) ListByInvestor(ctx context.Context, investorID string, limit int, offset int) ([]domain.Funding, int, error) {
	if limit <= 0 {
		limit = 20
	}

	var total int
	if err := r.db.GetContext(ctx, &total, "SELECT count(*) FROM fundings WHERE investor_id = $1", investorID); err != nil {
		return nil, 0, err
	}

	query := `
    SELECT id, invoice_id, investor_id, amount, apr_percent, term_months, status, tx_hash,
      created_at, confirmed_at, settled_at
    FROM fundings
    WHERE investor_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `

	fundings := []domain.Funding{}
	if err := r.db.SelectContext(ctx, &fundings, query, investorID, limit, offset); err != nil {
		return nil, 0, err
	}

	return fundings, total, nil
}
