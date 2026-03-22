package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"auth/internal/config"
	"auth/internal/handler"
	"auth/internal/store/pgstore"
	"auth/internal/token"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	dbpool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer dbpool.Close()

	userStore := pgstore.New(dbpool)
	tokenService := token.NewTokenService(cfg.JWTSecret, "auth-service", 24*time.Hour)
	authHandler := handler.NewAuthHandler(userStore, tokenService)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Post("/auth/register", authHandler.Register)
	r.Post("/auth/login", authHandler.Login)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("Starting server on port %s", cfg.Port)
	if err := srv.ListenAndServe(); err != nil {
		log.Panic(err)
	}
}
