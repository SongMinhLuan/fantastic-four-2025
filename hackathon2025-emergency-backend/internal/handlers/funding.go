package handlers

import (
	"net/http"

	"invoiceflow/internal/middleware"
	"invoiceflow/internal/services"

	"github.com/gin-gonic/gin"
)

type FundingHandler struct {
	service *services.FundingService
}

func NewFundingHandler(service *services.FundingService) *FundingHandler {
	return &FundingHandler{service: service}
}

type fundInvoiceRequest struct {
	Amount     float64 `json:"amount" binding:"required,gt=0"`
	APRPercent float64 `json:"apr_percent" binding:"required,gt=0"`
	TermMonths int     `json:"term_months" binding:"required,gt=0"`
}

func (h *FundingHandler) FundInvoice(c *gin.Context) {
	invoiceID := c.Param("id")
	investorID := c.GetString(middleware.ContextUserID)

	var req fundInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "FUNDING.VALIDATION_FAILED", "invalid request", nil)
		return
	}

	funding, invoice, err := h.service.CreateFunding(c.Request.Context(), invoiceID, investorID, req.Amount, req.APRPercent, req.TermMonths)
	if err != nil {
		switch err {
		case services.ErrFundingExceedsTarget:
			RespondError(c, http.StatusUnprocessableEntity, "FUNDING.EXCEEDS_TARGET", "amount exceeds remaining target", nil)
		case services.ErrFundingAmountInvalid:
			RespondError(c, http.StatusBadRequest, "FUNDING.INVALID_AMOUNT", "invalid funding amount", nil)
		case services.ErrInvoiceInvalidStatus:
			RespondError(c, http.StatusConflict, "INVOICE.INVALID_STATUS", "invoice status invalid", nil)
		default:
			RespondError(c, http.StatusNotFound, "INVOICE.NOT_FOUND", "invoice not found", nil)
		}
		return
	}

	RespondData(c, http.StatusCreated, gin.H{
		"funding": funding,
		"invoice": invoice,
	}, nil)
}

func (h *FundingHandler) ListMyFundings(c *gin.Context) {
	investorID := c.GetString(middleware.ContextUserID)
	page := parseInt(c.Query("page"), 1)
	pageSize := parseInt(c.Query("page_size"), 20)

	fundings, total, err := h.service.ListInvestorFundings(c.Request.Context(), investorID, pageSize, (page-1)*pageSize)
	if err != nil {
		RespondError(c, http.StatusInternalServerError, "FUNDING.LIST_FAILED", "could not list fundings", nil)
		return
	}

	RespondData(c, http.StatusOK, fundings, gin.H{
		"page":      page,
		"page_size": pageSize,
		"total":     total,
	})
}
