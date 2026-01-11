package handlers

import (
	"net/http"
	"strconv"
	"time"

	"invoiceflow/internal/domain"
	"invoiceflow/internal/middleware"
	"invoiceflow/internal/repositories"
	"invoiceflow/internal/services"

	"github.com/gin-gonic/gin"
)

type InvoiceHandler struct {
	service *services.InvoiceService
}

func NewInvoiceHandler(service *services.InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{service: service}
}

type createInvoiceRequest struct {
	Title         string   `json:"title" binding:"required"`
	InvoiceNumber string   `json:"invoice_number" binding:"required"`
	Amount        float64  `json:"amount" binding:"required,gt=0"`
	Currency      string   `json:"currency" binding:"required"`
	TermMonths    int      `json:"term_months" binding:"required,gt=0"`
	DueDate       string   `json:"due_date" binding:"required"`
	RiskTier      *string  `json:"risk_tier"`
	APRPercent    *float64 `json:"apr_percent"`
	FundingTarget float64  `json:"funding_target" binding:"required,gt=0"`
	EmergencyLane bool     `json:"emergency_lane"`
	Tags          []string `json:"tags"`
}

func (h *InvoiceHandler) Create(c *gin.Context) {
	role := c.GetString(middleware.ContextUserRole)
	if role != domain.RoleSME {
		RespondError(c, http.StatusForbidden, "AUTH.FORBIDDEN", "only SME can create invoices", nil)
		return
	}

	var req createInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "INVOICE.VALIDATION_FAILED", "invalid request", nil)
		return
	}

	issuerID := c.GetString(middleware.ContextUserID)
	dueDate, err := parseDate(req.DueDate)
	if err != nil {
		RespondError(c, http.StatusBadRequest, "INVOICE.VALIDATION_FAILED", "invalid due_date", nil)
		return
	}

	if req.FundingTarget < req.Amount {
		RespondError(c, http.StatusUnprocessableEntity, "INVOICE.INVALID_TARGET", "funding_target must be >= amount", nil)
		return
	}

	invoice := &domain.Invoice{
		IssuerID:      issuerID,
		Title:         req.Title,
		InvoiceNumber: req.InvoiceNumber,
		Amount:        req.Amount,
		Currency:      req.Currency,
		TermMonths:    req.TermMonths,
		DueDate:       dueDate,
		RiskTier:      req.RiskTier,
		APRPercent:    req.APRPercent,
		FundingTarget: req.FundingTarget,
		FundedAmount:  0,
		Status:        domain.InvoiceStatusDraft,
		EmergencyLane: req.EmergencyLane,
		Tags:          req.Tags,
	}

	created, err := h.service.Create(c.Request.Context(), invoice)
	if err != nil {
		RespondError(c, http.StatusInternalServerError, "INVOICE.CREATE_FAILED", "could not create invoice", nil)
		return
	}

	RespondData(c, http.StatusCreated, created, nil)
}

func (h *InvoiceHandler) List(c *gin.Context) {
	role := c.GetString(middleware.ContextUserRole)
	userID := c.GetString(middleware.ContextUserID)

	page := parseInt(c.Query("page"), 1)
	pageSize := parseInt(c.Query("page_size"), 20)
	status := c.Query("status")

	filters := repositories.InvoiceFilters{
		Status: status,
		Limit:  pageSize,
		Offset: (page - 1) * pageSize,
	}

	if role == domain.RoleSME {
		filters.IssuerID = userID
	}

	if role == domain.RoleInvestor {
		filters.AllowedStatuses = []string{domain.InvoiceStatusApproved, domain.InvoiceStatusTokenized, domain.InvoiceStatusFunded}
	}

	invoices, total, err := h.service.List(c.Request.Context(), filters)
	if err != nil {
		RespondError(c, http.StatusInternalServerError, "INVOICE.LIST_FAILED", "could not list invoices", nil)
		return
	}

	meta := gin.H{
		"page":      page,
		"page_size": pageSize,
		"total":     total,
	}

	RespondData(c, http.StatusOK, invoices, meta)
}

func (h *InvoiceHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	role := c.GetString(middleware.ContextUserRole)
	userID := c.GetString(middleware.ContextUserID)

	invoice, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		RespondError(c, http.StatusNotFound, "INVOICE.NOT_FOUND", "invoice not found", nil)
		return
	}

	if role == domain.RoleSME && invoice.IssuerID != userID {
		RespondError(c, http.StatusForbidden, "AUTH.FORBIDDEN", "invoice not accessible", nil)
		return
	}

	if role == domain.RoleInvestor && (invoice.Status == domain.InvoiceStatusDraft || invoice.Status == domain.InvoiceStatusSubmitted) {
		RespondError(c, http.StatusForbidden, "AUTH.FORBIDDEN", "invoice not accessible", nil)
		return
	}

	RespondData(c, http.StatusOK, invoice, nil)
}

func (h *InvoiceHandler) Submit(c *gin.Context) {
	id := c.Param("id")
	issuerID := c.GetString(middleware.ContextUserID)

	invoice, err := h.service.Submit(c.Request.Context(), id, issuerID)
	if err != nil {
		switch err {
		case services.ErrInvoiceAccessDenied:
			RespondError(c, http.StatusForbidden, "AUTH.FORBIDDEN", "invoice not accessible", nil)
		case services.ErrInvoiceInvalidStatus:
			RespondError(c, http.StatusConflict, "INVOICE.INVALID_STATUS", "invoice status invalid", nil)
		default:
			RespondError(c, http.StatusNotFound, "INVOICE.NOT_FOUND", "invoice not found", nil)
		}
		return
	}

	RespondData(c, http.StatusOK, invoice, nil)
}

func parseInt(value string, fallback int) int {
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func parseDate(value string) (time.Time, error) {
	return time.Parse("2006-01-02", value)
}
