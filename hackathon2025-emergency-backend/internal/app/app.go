package app

import (
	"invoiceflow/internal/config"
	"invoiceflow/internal/middleware"
	"invoiceflow/internal/routes"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func New(cfg *config.Config, db *sqlx.DB) *gin.Engine {
	router := gin.New()
	router.Use(middleware.CORSMiddleware(cfg.CORSOrigins), gin.Logger(), gin.Recovery())

	routes.Register(router, cfg, db)

	return router
}
