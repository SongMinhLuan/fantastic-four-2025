package handlers

import (
	"net/http"

	"invoiceflow/internal/domain"
	"invoiceflow/internal/middleware"
	"invoiceflow/internal/services"

	"github.com/gin-gonic/gin"
)

type ChainHandler struct {
	chainService   *services.ChainService
	invoiceService *services.InvoiceService
}

func NewChainHandler(chainService *services.ChainService, invoiceService *services.InvoiceService) *ChainHandler {
	return &ChainHandler{chainService: chainService, invoiceService: invoiceService}
}

func (h *ChainHandler) Tokenize(c *gin.Context) {
	if h.chainService == nil {
		RespondError(c, http.StatusInternalServerError, "CHAIN.NOT_READY", "chain service unavailable", nil)
		return
	}

	invoiceID := c.Param("id")
	role := c.GetString(middleware.ContextUserRole)
	userID := c.GetString(middleware.ContextUserID)

	invoice, err := h.invoiceService.GetByID(c.Request.Context(), invoiceID)
	if err != nil {
		RespondError(c, http.StatusNotFound, "INVOICE.NOT_FOUND", "invoice not found", nil)
		return
	}

	if role == domain.RoleSME && invoice.IssuerID != userID {
		RespondError(c, http.StatusForbidden, "AUTH.FORBIDDEN", "invoice not accessible", nil)
		return
	}

	onchain, chainTx, idempotent, err := h.chainService.TokenizeInvoice(c.Request.Context(), invoiceID)
	if err != nil {
		switch err {
		case services.ErrChainDisabled:
			RespondError(c, http.StatusNotImplemented, "CHAIN.DISABLED", "chain disabled", nil)
		case services.ErrInvoiceInvalidStatus:
			RespondError(c, http.StatusConflict, "INVOICE.INVALID_STATUS", "invoice status invalid", nil)
		default:
			RespondError(c, http.StatusInternalServerError, "CHAIN.MINT_FAILED", "mint failed", nil)
		}
		return
	}

	meta := gin.H{"idempotent": idempotent}
	RespondData(c, http.StatusOK, gin.H{
		"invoice": invoice,
		"onchain": onchain,
		"tx":      chainTx,
	}, meta)
}

func (h *ChainHandler) GetOnchain(c *gin.Context) {
	if h.chainService == nil {
		RespondError(c, http.StatusInternalServerError, "CHAIN.NOT_READY", "chain service unavailable", nil)
		return
	}

	invoiceID := c.Param("id")
	record, err := h.chainService.GetOnchain(c.Request.Context(), invoiceID)
	if err != nil {
		switch err {
		case services.ErrChainDisabled:
			RespondError(c, http.StatusNotImplemented, "CHAIN.DISABLED", "chain disabled", nil)
		default:
			RespondError(c, http.StatusNotFound, "CHAIN.NOT_FOUND", "onchain record not found", nil)
		}
		return
	}

	RespondData(c, http.StatusOK, record, nil)
}

func (h *ChainHandler) RefreshOnchain(c *gin.Context) {
	if h.chainService == nil {
		RespondError(c, http.StatusInternalServerError, "CHAIN.NOT_READY", "chain service unavailable", nil)
		return
	}

	invoiceID := c.Param("id")
	record, tx, err := h.chainService.RefreshOnchain(c.Request.Context(), invoiceID)
	if err != nil {
		switch err {
		case services.ErrChainDisabled:
			RespondError(c, http.StatusNotImplemented, "CHAIN.DISABLED", "chain disabled", nil)
		default:
			RespondError(c, http.StatusNotFound, "CHAIN.NOT_FOUND", "onchain record not found", nil)
		}
		return
	}

	RespondData(c, http.StatusOK, gin.H{
		"onchain": record,
		"tx":      tx,
	}, nil)
}
