package db

import (
	"context"
	"time"

	"invoiceflow/internal/config"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
)

func New(cfg *config.Config) (*sqlx.DB, error) {
	database, err := sqlx.Open("pgx", cfg.DBURL)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := database.PingContext(ctx); err != nil {
		_ = database.Close()
		return nil, err
	}

	return database, nil
}
