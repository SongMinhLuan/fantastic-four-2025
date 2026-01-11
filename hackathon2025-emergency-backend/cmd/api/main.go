package main

import (
	"log"
	"os"

	"invoiceflow/internal/app"
	"invoiceflow/internal/config"
	"invoiceflow/internal/db"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Println("config error")
		os.Exit(1)
	}

	database, err := db.New(cfg)
	if err != nil {
		log.Println("database connection failed")
		os.Exit(1)
	}
	defer database.Close()

	router := app.New(cfg, database)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Println("server error")
		os.Exit(1)
	}
}
