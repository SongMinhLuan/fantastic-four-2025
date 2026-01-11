package handlers

import (
	"net/http"

	"invoiceflow/internal/domain"
	"invoiceflow/internal/middleware"
	"invoiceflow/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service *services.AuthService
}

func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

type registerRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "AUTH.VALIDATION_FAILED", "invalid request", nil)
		return
	}

	if req.Role != domain.RoleInvestor && req.Role != domain.RoleSME {
		RespondError(c, http.StatusBadRequest, "AUTH.INVALID_ROLE", "invalid role", nil)
		return
	}

	user, err := h.service.Register(c.Request.Context(), req.Name, req.Email, req.Password, req.Role)
	if err != nil {
		switch err {
		case services.ErrEmailExists:
			RespondError(c, http.StatusConflict, "AUTH.EMAIL_EXISTS", "email already exists", nil)
		default:
			RespondError(c, http.StatusBadRequest, "AUTH.REGISTER_FAILED", "could not register", nil)
		}
		return
	}

	RespondData(c, http.StatusCreated, gin.H{"user": user}, nil)
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, http.StatusBadRequest, "AUTH.VALIDATION_FAILED", "invalid request", nil)
		return
	}

	token, user, err := h.service.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		switch err {
		case services.ErrInvalidCredentials:
			RespondError(c, http.StatusUnauthorized, "AUTH.INVALID_CREDENTIALS", "invalid credentials", nil)
		case services.ErrUserSuspended:
			RespondError(c, http.StatusForbidden, "AUTH.USER_SUSPENDED", "user suspended", nil)
		default:
			RespondError(c, http.StatusInternalServerError, "AUTH.LOGIN_FAILED", "could not login", nil)
		}
		return
	}

	RespondData(c, http.StatusOK, gin.H{
		"access_token": token,
		"token_type":   "Bearer",
		"user":         user,
	}, nil)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, ok := c.Get(middleware.ContextUserID)
	if !ok {
		RespondError(c, http.StatusUnauthorized, "AUTH.UNAUTHORIZED", "unauthorized", nil)
		return
	}

	user, err := h.service.GetUser(c.Request.Context(), userID.(string))
	if err != nil {
		RespondError(c, http.StatusInternalServerError, "AUTH.ME_FAILED", "could not fetch user", nil)
		return
	}

	RespondData(c, http.StatusOK, user, nil)
}
