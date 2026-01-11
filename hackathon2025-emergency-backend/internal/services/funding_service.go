package services

import (
	"context"
	"errors"

	"invoiceflow/internal/domain"
	"invoiceflow/internal/repositories"

	"github.com/jmoiron/sqlx"
)

var (
	ErrFundingAmountInvalid = errors.New("invalid funding amount")
	ErrFundingExceedsTarget = errors.New("funding exceeds remaining target")
)

type FundingService struct {
	db          *sqlx.DB
	fundingRepo *repositories.FundingRepository
	invoiceRepo *repositories.InvoiceRepository
}

func NewFundingService(db *sqlx.DB, fundingRepo *repositories.FundingRepository, invoiceRepo *repositories.InvoiceRepository) *FundingService {
	return &FundingService{db: db, fundingRepo: fundingRepo, invoiceRepo: invoiceRepo}
}

func (s *FundingService) CreateFunding(ctx context.Context, invoiceID string, investorID string, amount float64, aprPercent float64, termMonths int) (*domain.Funding, *domain.Invoice, error) {
	if amount <= 0 {
		return nil, nil, ErrFundingAmountInvalid
	}

	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, nil, err
	}
	defer tx.Rollback()

	invoice, err := s.invoiceRepo.GetByIDForUpdate(ctx, tx, invoiceID)
	if err != nil {
		return nil, nil, err
	}

	if invoice.Status != domain.InvoiceStatusApproved && invoice.Status != domain.InvoiceStatusTokenized && invoice.Status != domain.InvoiceStatusFunded {
		return nil, nil, ErrInvoiceInvalidStatus
	}

	remaining := invoice.FundingTarget - invoice.FundedAmount
	if amount > remaining {
		return nil, nil, ErrFundingExceedsTarget
	}

	funding := &domain.Funding{
		InvoiceID:  invoiceID,
		InvestorID: investorID,
		Amount:     amount,
		APRPercent: aprPercent,
		TermMonths: termMonths,
		Status:     domain.FundingStatusPending,
	}

	created, err := s.fundingRepo.Create(ctx, tx, funding)
	if err != nil {
		return nil, nil, err
	}

	newFunded := invoice.FundedAmount + amount
	newStatus := invoice.Status
	if newFunded >= invoice.FundingTarget {
		newStatus = domain.InvoiceStatusFunded
	}

	updatedInvoice, err := s.invoiceRepo.UpdateFunding(ctx, tx, invoiceID, newFunded, newStatus)
	if err != nil {
		return nil, nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, nil, err
	}

	return created, updatedInvoice, nil
}

func (s *FundingService) ListInvestorFundings(ctx context.Context, investorID string, limit int, offset int) ([]domain.Funding, int, error) {
	return s.fundingRepo.ListByInvestor(ctx, investorID, limit, offset)
}
