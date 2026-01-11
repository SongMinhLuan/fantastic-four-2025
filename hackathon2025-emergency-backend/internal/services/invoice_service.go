package services

import (
	"context"
	"errors"

	"invoiceflow/internal/domain"
	"invoiceflow/internal/repositories"
)

var (
	ErrInvoiceAccessDenied  = errors.New("invoice access denied")
	ErrInvoiceInvalidStatus = errors.New("invalid invoice status")
)

type InvoiceService struct {
	repo *repositories.InvoiceRepository
}

func NewInvoiceService(repo *repositories.InvoiceRepository) *InvoiceService {
	return &InvoiceService{repo: repo}
}

func (s *InvoiceService) Create(ctx context.Context, invoice *domain.Invoice) (*domain.Invoice, error) {
	return s.repo.Create(ctx, invoice)
}

func (s *InvoiceService) List(ctx context.Context, filters repositories.InvoiceFilters) ([]domain.Invoice, int, error) {
	return s.repo.List(ctx, filters)
}

func (s *InvoiceService) GetByID(ctx context.Context, id string) (*domain.Invoice, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *InvoiceService) Submit(ctx context.Context, invoiceID string, issuerID string) (*domain.Invoice, error) {
	invoice, err := s.repo.GetByID(ctx, invoiceID)
	if err != nil {
		return nil, err
	}

	if invoice.IssuerID != issuerID {
		return nil, ErrInvoiceAccessDenied
	}

	if invoice.Status != domain.InvoiceStatusDraft {
		return nil, ErrInvoiceInvalidStatus
	}

	return s.repo.UpdateStatus(ctx, invoiceID, domain.InvoiceStatusSubmitted)
}
