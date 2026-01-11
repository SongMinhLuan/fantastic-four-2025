package repositories

import (
	"context"
	"fmt"
	"strings"

	"invoiceflow/internal/domain"

	"github.com/jmoiron/sqlx"
)

type InvoiceRepository struct {
	db *sqlx.DB
}

func NewInvoiceRepository(db *sqlx.DB) *InvoiceRepository {
	return &InvoiceRepository{db: db}
}

func (r *InvoiceRepository) Create(ctx context.Context, invoice *domain.Invoice) (*domain.Invoice, error) {
	query := `
    INSERT INTO invoices (
      issuer_id, title, invoice_number, amount, currency, term_months, due_date,
      risk_tier, apr_percent, funding_target, funded_amount, status, emergency_lane, tags
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING id, issuer_id, title, invoice_number, amount, currency, term_months, due_date,
      risk_tier, apr_percent, funding_target, funded_amount, status, emergency_lane, tags,
      created_at, updated_at
  `

	var created domain.Invoice
	err := r.db.GetContext(ctx, &created, query,
		invoice.IssuerID,
		invoice.Title,
		invoice.InvoiceNumber,
		invoice.Amount,
		invoice.Currency,
		invoice.TermMonths,
		invoice.DueDate,
		invoice.RiskTier,
		invoice.APRPercent,
		invoice.FundingTarget,
		invoice.FundedAmount,
		invoice.Status,
		invoice.EmergencyLane,
		invoice.Tags,
	)
	if err != nil {
		return nil, err
	}

	return &created, nil
}

func (r *InvoiceRepository) GetByID(ctx context.Context, id string) (*domain.Invoice, error) {
	return getInvoice(ctx, r.db, id, false)
}

func (r *InvoiceRepository) GetByIDForUpdate(ctx context.Context, tx *sqlx.Tx, id string) (*domain.Invoice, error) {
	return getInvoice(ctx, tx, id, true)
}

func getInvoice(ctx context.Context, ext sqlx.ExtContext, id string, forUpdate bool) (*domain.Invoice, error) {
	suffix := ""
	if forUpdate {
		suffix = " FOR UPDATE"
	}

	query := fmt.Sprintf(`
    SELECT id, issuer_id, title, invoice_number, amount, currency, term_months, due_date,
      risk_tier, apr_percent, funding_target, funded_amount, status, emergency_lane, tags,
      created_at, updated_at
    FROM invoices
    WHERE id = $1%s
  `, suffix)

	var invoice domain.Invoice
	if err := sqlx.GetContext(ctx, ext, &invoice, query, id); err != nil {
		return nil, err
	}

	return &invoice, nil
}

func (r *InvoiceRepository) List(ctx context.Context, filters InvoiceFilters) ([]domain.Invoice, int, error) {
	conditions := []string{"1=1"}
	args := []any{}

	if filters.Status != "" {
		args = append(args, filters.Status)
		conditions = append(conditions, fmt.Sprintf("status = $%d", len(args)))
	}

	if filters.IssuerID != "" {
		args = append(args, filters.IssuerID)
		conditions = append(conditions, fmt.Sprintf("issuer_id = $%d", len(args)))
	}

	if filters.AllowedStatuses != nil && len(filters.AllowedStatuses) > 0 {
		placeholders := []string{}
		for _, status := range filters.AllowedStatuses {
			args = append(args, status)
			placeholders = append(placeholders, fmt.Sprintf("$%d", len(args)))
		}
		conditions = append(conditions, fmt.Sprintf("status IN (%s)", strings.Join(placeholders, ",")))
	}

	where := strings.Join(conditions, " AND ")

	countQuery := fmt.Sprintf("SELECT count(*) FROM invoices WHERE %s", where)
	var total int
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, err
	}

	limit := filters.Limit
	offset := filters.Offset
	if limit <= 0 {
		limit = 20
	}

	listQuery := fmt.Sprintf(`
    SELECT id, issuer_id, title, invoice_number, amount, currency, term_months, due_date,
      risk_tier, apr_percent, funding_target, funded_amount, status, emergency_lane, tags,
      created_at, updated_at
    FROM invoices
    WHERE %s
    ORDER BY created_at DESC
    LIMIT %d OFFSET %d
  `, where, limit, offset)

	invoices := []domain.Invoice{}
	if err := r.db.SelectContext(ctx, &invoices, listQuery, args...); err != nil {
		return nil, 0, err
	}

	return invoices, total, nil
}

type InvoiceFilters struct {
	Status          string
	IssuerID        string
	AllowedStatuses []string
	Limit           int
	Offset          int
}

func (r *InvoiceRepository) UpdateStatus(ctx context.Context, id string, status string) (*domain.Invoice, error) {
	query := `
    UPDATE invoices
    SET status = $2, updated_at = now()
    WHERE id = $1
    RETURNING id, issuer_id, title, invoice_number, amount, currency, term_months, due_date,
      risk_tier, apr_percent, funding_target, funded_amount, status, emergency_lane, tags,
      created_at, updated_at
  `

	var invoice domain.Invoice
	if err := r.db.GetContext(ctx, &invoice, query, id, status); err != nil {
		return nil, err
	}

	return &invoice, nil
}

func (r *InvoiceRepository) Approve(ctx context.Context, id string, riskTier string, aprPercent float64) (*domain.Invoice, error) {
	query := `
    UPDATE invoices
    SET status = $2, risk_tier = $3, apr_percent = $4, updated_at = now()
    WHERE id = $1
    RETURNING id, issuer_id, title, invoice_number, amount, currency, term_months, due_date,
      risk_tier, apr_percent, funding_target, funded_amount, status, emergency_lane, tags,
      created_at, updated_at
  `

	var invoice domain.Invoice
	if err := r.db.GetContext(ctx, &invoice, query, id, domain.InvoiceStatusApproved, riskTier, aprPercent); err != nil {
		return nil, err
	}

	return &invoice, nil
}

func (r *InvoiceRepository) UpdateFunding(ctx context.Context, tx *sqlx.Tx, id string, fundedAmount float64, status string) (*domain.Invoice, error) {
	query := `
    UPDATE invoices
    SET funded_amount = $2, status = $3, updated_at = now()
    WHERE id = $1
    RETURNING id, issuer_id, title, invoice_number, amount, currency, term_months, due_date,
      risk_tier, apr_percent, funding_target, funded_amount, status, emergency_lane, tags,
      created_at, updated_at
  `

	var invoice domain.Invoice
	if err := tx.GetContext(ctx, &invoice, query, id, fundedAmount, status); err != nil {
		return nil, err
	}

	return &invoice, nil
}

func (r *InvoiceRepository) MarkPaid(ctx context.Context, id string, status string) (*domain.Invoice, error) {
	query := `
    UPDATE invoices
    SET status = $2, updated_at = now()
    WHERE id = $1
    RETURNING id, issuer_id, title, invoice_number, amount, currency, term_months, due_date,
      risk_tier, apr_percent, funding_target, funded_amount, status, emergency_lane, tags,
      created_at, updated_at
  `

	var invoice domain.Invoice
	if err := r.db.GetContext(ctx, &invoice, query, id, status); err != nil {
		return nil, err
	}

	return &invoice, nil
}
