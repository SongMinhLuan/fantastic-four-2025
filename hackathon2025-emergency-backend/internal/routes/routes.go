package routes

import (
	"invoiceflow/internal/config"
	"invoiceflow/internal/domain"
	"invoiceflow/internal/handlers"
	"invoiceflow/internal/middleware"
	"invoiceflow/internal/repositories"
	"invoiceflow/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func Register(router *gin.Engine, cfg *config.Config, db *sqlx.DB) {
	userRepo := repositories.NewUserRepository(db)
	invoiceRepo := repositories.NewInvoiceRepository(db)
	fundingRepo := repositories.NewFundingRepository(db)
	chainRepo := repositories.NewChainRepository(db)

	authService := services.NewAuthService(cfg, userRepo)
	invoiceService := services.NewInvoiceService(invoiceRepo)
	fundingService := services.NewFundingService(db, fundingRepo, invoiceRepo)
	adminService := services.NewAdminService(db, invoiceRepo)

	chainService, _ := services.NewChainService(cfg, chainRepo, invoiceRepo)

	authHandler := handlers.NewAuthHandler(authService)
	invoiceHandler := handlers.NewInvoiceHandler(invoiceService)
	fundingHandler := handlers.NewFundingHandler(fundingService)
	adminHandler := handlers.NewAdminHandler(adminService)
	chainHandler := handlers.NewChainHandler(chainService, invoiceService)

	router.GET("/health", handlers.Health(db))

	auth := router.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.GET("/me", middleware.Auth(cfg), authHandler.Me)
	}

	api := router.Group("/")
	api.Use(middleware.Auth(cfg))
	{
		api.POST("/invoices", middleware.RequireRoles(domain.RoleSME), invoiceHandler.Create)
		api.GET("/invoices", invoiceHandler.List)
		api.GET("/invoices/:id", invoiceHandler.GetByID)
		api.POST("/invoices/:id/submit", middleware.RequireRoles(domain.RoleSME), invoiceHandler.Submit)

		api.POST("/invoices/:id/fund", middleware.RequireRoles(domain.RoleInvestor), fundingHandler.FundInvoice)
		api.GET("/me/fundings", middleware.RequireRoles(domain.RoleInvestor), fundingHandler.ListMyFundings)

		api.POST("/invoices/:id/tokenize", middleware.RequireRoles(domain.RoleAdmin, domain.RoleSME), chainHandler.Tokenize)
		api.GET("/invoices/:id/onchain", middleware.RequireRoles(domain.RoleAdmin, domain.RoleSME), chainHandler.GetOnchain)
		api.POST("/invoices/:id/onchain/refresh", middleware.RequireRoles(domain.RoleAdmin, domain.RoleSME), chainHandler.RefreshOnchain)

		admin := api.Group("/admin")
		admin.Use(middleware.RequireRoles(domain.RoleAdmin))
		{
			admin.POST("/invoices/:id/approve", adminHandler.ApproveInvoice)
			admin.POST("/invoices/:id/mark-paid", adminHandler.MarkPaid)
			admin.GET("/dashboard/metrics", adminHandler.DashboardMetrics)
		}
	}
}
