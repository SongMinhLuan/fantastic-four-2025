package config

import (
	"errors"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv                    string
	Port                      string
	DBURL                     string
	JWTSecret                 string
	JWTTTLMinutes             int
	CORSOrigins               []string
	EnableChain               bool
	ChainRPCURL               string
	ChainID                   int64
	ContractInvoiceNFTAddress string
	ChainPrivateKey           string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		AppEnv: getEnv("APP_ENV", "dev"),
		Port:   getEnv("PORT", "8080"),
		DBURL:  os.Getenv("DB_URL"),
	}

	if cfg.DBURL == "" {
		return nil, errors.New("DB_URL is required")
	}

	cfg.JWTSecret = os.Getenv("JWT_SECRET")
	if cfg.JWTSecret == "" {
		return nil, errors.New("JWT_SECRET is required")
	}

	ttlStr := getEnv("JWT_TTL_MINUTES", "60")
	ttlMinutes, err := strconv.Atoi(ttlStr)
	if err != nil || ttlMinutes <= 0 {
		return nil, errors.New("JWT_TTL_MINUTES must be a positive integer")
	}
	cfg.JWTTTLMinutes = ttlMinutes

	corsOrigins := getEnv("CORS_ORIGINS", "http://localhost:5173")
	cfg.CORSOrigins = parseCSV(corsOrigins)

	enableChain := getEnv("ENABLE_CHAIN", "false")
	parsedEnable, err := strconv.ParseBool(enableChain)
	if err != nil {
		return nil, errors.New("ENABLE_CHAIN must be true or false")
	}
	cfg.EnableChain = parsedEnable

	if cfg.EnableChain {
		cfg.ChainRPCURL = os.Getenv("CHAIN_RPC_URL")
		cfg.ContractInvoiceNFTAddress = os.Getenv("CONTRACT_INVOICE_NFT_ADDRESS")
		cfg.ChainPrivateKey = os.Getenv("CHAIN_PRIVATE_KEY")

		chainIDStr := os.Getenv("CHAIN_ID")
		if cfg.ChainRPCURL == "" || cfg.ContractInvoiceNFTAddress == "" || chainIDStr == "" {
			return nil, errors.New("CHAIN_RPC_URL, CHAIN_ID, and CONTRACT_INVOICE_NFT_ADDRESS are required when ENABLE_CHAIN=true")
		}

		chainID, err := strconv.ParseInt(chainIDStr, 10, 64)
		if err != nil {
			return nil, errors.New("CHAIN_ID must be an integer")
		}
		cfg.ChainID = chainID
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func parseCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}
		result = append(result, trimmed)
	}
	return result
}
