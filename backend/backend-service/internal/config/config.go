package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	JWTSecret         string
	DatabaseURL       string
	GigaChatAuthKey   string
	InternalAPISecret string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable is required")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	gigaChatAuthKey := os.Getenv("GIGACHAT_AUTH_KEY")

	internalAPISecret := os.Getenv("INTERNAL_API_SECRET")
	if internalAPISecret == "" {
		return nil, fmt.Errorf("INTERNAL_API_SECRET environment variable is required")
	}

	return &Config{
		Port:              port,
		JWTSecret:         jwtSecret,
		DatabaseURL:       databaseURL,
		GigaChatAuthKey:   gigaChatAuthKey,
		InternalAPISecret: internalAPISecret,
	}, nil
}
