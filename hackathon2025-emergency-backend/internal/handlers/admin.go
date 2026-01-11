package handlers

import (
	"net/http"

	"invoiceflow/internal/services"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	service *services.AdminService
}

func NewAdminHandler(service *services.AdminService) *AdminHandler {
	return &AdminHandler{service: service}
}

type approveInvoiceRequest struct {
	RiskTier   string  `json:"risk_tier" binding:"required"`
	APRPercent float64 `json:"apr_percent" binding:"required,gt=0"`
}

func (h *AdminHandler) ApproveInvoice(c *gin.Context) {
	id := c.Param("id")
	var req approveInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "INVOICE.VALIDATION_FAILED", "invalid request", nil)
		return
	}

	invoice, err := h.service.ApproveInvoice(c.Request.Context(), id, req.RiskTier, req.APRPercent)
	if err != nil {
		switch err {
		case services.ErrInvoiceInvalidStatus:
			RespondError(c, http.StatusConflict, "INVOICE.INVALID_STATUS", "invoice status invalid", nil)
		default:
			RespondError(c, http.StatusNotFound, "INVOICE.NOT_FOUND", "invoice not found", nil)
		}
		return
	}

	RespondData(c, http.StatusOK, invoice, nil)
}

type markPaidRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

func (h *AdminHandler) MarkPaid(c *gin.Context) {
	id := c.Param("id")
	var req markPaidRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "PAYMENT.VALIDATION_FAILED", "invalid request", nil)
		return
	}

	invoice, err := h.service.MarkPaid(c.Request.Context(), id, req.Amount)
	if err != nil {
		switch err {
		case services.ErrInvoiceInvalidStatus:
			RespondError(c, http.StatusConflict, "INVOICE.INVALID_STATUS", "invoice status invalid", nil)
		default:
			RespondError(c, http.StatusNotFound, "INVOICE.NOT_FOUND", "invoice not found", nil)
		}
		return
	}

	RespondData(c, http.StatusOK, invoice, nil)
}

func (h *AdminHandler) DashboardMetrics(c *gin.Context) {
	metrics, err := h.service.GetDashboardMetrics(c.Request.Context())
	if err != nil {
		RespondError(c, http.StatusInternalServerError, "ADMIN.METRICS_FAILED", "could not fetch metrics", nil)
		return
	}

	RespondData(c, http.StatusOK, metrics, nil)
}
