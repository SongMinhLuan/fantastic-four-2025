package services

import (
	"context"
	"database/sql"

	"invoiceflow/internal/domain"
	"invoiceflow/internal/repositories"

	"github.com/jmoiron/sqlx"
)

type AdminService struct {
	db          *sqlx.DB
	invoiceRepo *repositories.InvoiceRepository
}

func NewAdminService(db *sqlx.DB, invoiceRepo *repositories.InvoiceRepository) *AdminService {
	return &AdminService{db: db, invoiceRepo: invoiceRepo}
}

func (s *AdminService) ApproveInvoice(ctx context.Context, invoiceID string, riskTier string, aprPercent float64) (*domain.Invoice, error) {
	invoice, err := s.invoiceRepo.GetByID(ctx, invoiceID)
	if err != nil {
		return nil, err
	}

	if invoice.Status != domain.InvoiceStatusSubmitted {
		return nil, ErrInvoiceInvalidStatus
	}

	return s.invoiceRepo.Approve(ctx, invoiceID, riskTier, aprPercent)
}

func (s *AdminService) MarkPaid(ctx context.Context, invoiceID string, amount float64) (*domain.Invoice, error) {
	invoice, err := s.invoiceRepo.GetByID(ctx, invoiceID)
	if err != nil {
		return nil, err
	}

	if invoice.Status != domain.InvoiceStatusFunded && invoice.Status != domain.InvoiceStatusPartiallyPaid {
		return nil, ErrInvoiceInvalidStatus
	}

	status := domain.InvoiceStatusPartiallyPaid
	if amount >= invoice.Amount {
		status = domain.InvoiceStatusPaid
	}

	return s.invoiceRepo.MarkPaid(ctx, invoiceID, status)
}

type DashboardMetrics struct {
	Stats            []StatMetric         `json:"stats"`
	FundingVolume    FundingVolumeMetrics `json:"funding_volume"`
	RiskDistribution []RiskDistribution   `json:"risk_distribution"`
}

type StatMetric struct {
	Label string      `json:"label"`
	Value interface{} `json:"value"`
	Delta string      `json:"delta"`
	Icon  string      `json:"icon"`
	Tone  string      `json:"tone"`
}

type FundingVolumeMetrics struct {
	TotalAmount float64            `json:"total_amount"`
	ChangePct   float64            `json:"change_pct"`
	Series      []FundingDataPoint `json:"series"`
}

type FundingDataPoint struct {
	Label  string  `json:"label"`
	Amount float64 `json:"amount"`
}

type RiskDistribution struct {
	Tier  string  `json:"tier"`
	Ratio float64 `json:"ratio"`
}

func (s *AdminService) GetDashboardMetrics(ctx context.Context) (*DashboardMetrics, error) {
	var activeSMEs int
	if err := s.db.GetContext(ctx, &activeSMEs, "SELECT count(*) FROM users WHERE role = $1 AND status = $2", domain.RoleSME, domain.UserStatusActive); err != nil {
		return nil, err
	}

	var fundedInvoices int
	if err := s.db.GetContext(ctx, &fundedInvoices, "SELECT count(*) FROM invoices WHERE status IN ($1, $2)", domain.InvoiceStatusFunded, domain.InvoiceStatusPaid); err != nil {
		return nil, err
	}

	var avgAPR sql.NullFloat64
	if err := s.db.GetContext(ctx, &avgAPR, "SELECT avg(apr_percent) FROM invoices WHERE apr_percent IS NOT NULL"); err != nil {
		return nil, err
	}

	riskRows := []struct {
		Tier  sql.NullString `db:"risk_tier"`
		Count int            `db:"count"`
	}{}
	if err := s.db.SelectContext(ctx, &riskRows, "SELECT risk_tier, count(*) FROM invoices WHERE risk_tier IS NOT NULL GROUP BY risk_tier"); err != nil {
		return nil, err
	}

	totalRisk := 0
	for _, row := range riskRows {
		totalRisk += row.Count
	}

	distribution := []RiskDistribution{}
	if totalRisk > 0 {
		for _, row := range riskRows {
			if row.Tier.Valid {
				distribution = append(distribution, RiskDistribution{
					Tier:  row.Tier.String,
					Ratio: float64(row.Count) / float64(totalRisk),
				})
			}
		}
	}

	avgAprValue := 0.0
	if avgAPR.Valid {
		avgAprValue = avgAPR.Float64
	}

	metrics := &DashboardMetrics{
		Stats: []StatMetric{
			{
				Label: "Active SMEs",
				Value: activeSMEs,
				Delta: "",
				Icon:  "building",
				Tone:  "primary",
			},
			{
				Label: "Funded invoices",
				Value: fundedInvoices,
				Delta: "",
				Icon:  "coins",
				Tone:  "success",
			},
			{
				Label: "Avg. APR",
				Value: avgAprValue,
				Delta: "",
				Icon:  "trend",
				Tone:  "warning",
			},
			{
				Label: "At-risk",
				Value: 0,
				Delta: "",
				Icon:  "alert",
				Tone:  "danger",
			},
		},
		FundingVolume: FundingVolumeMetrics{
			TotalAmount: 0,
			ChangePct:   0,
			Series:      []FundingDataPoint{},
		},
		RiskDistribution: distribution,
	}

	return metrics, nil
}
