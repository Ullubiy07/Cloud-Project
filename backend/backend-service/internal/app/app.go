package app

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"backend/internal/config"
	"backend/internal/gigachat"
	"backend/internal/handler"
	"backend/internal/queue"
	"backend/internal/storage/postgres"
	"backend/internal/token"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	server *http.Server
	dbPool *pgxpool.Pool
}

func New(cfg *config.Config) (*App, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	dbPool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}

	m, err := migrate.New("file://migrations", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("could not start migrations: %w", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return nil, fmt.Errorf("could not run migrations: %w", err)
	}

	queueService, err := queue.New(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize queue service: %w", err)
	}

	storageLayer := postgres.New(dbPool)
	tokenService := token.NewTokenService(cfg.JWTSecret, "auth-service", 24*time.Hour)
	gigaClient := gigachat.NewClient(cfg.GigaChatAuthKey)
	runHandler := handler.NewRunHandler(cfg, storageLayer, queueService, tokenService, gigaClient)
	explainHandler := handler.NewExplainHandler(gigaClient, tokenService)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Post("/api/run", runHandler.RunRequest)
	r.Get("/api/run/{id}", runHandler.GetRunRequest)
	r.Get("/api/run-requests", runHandler.GetRunRequests)

	r.Post("/api/explain", explainHandler.ExplainCode)

	r.Post("/api/internal/runs/{id}/status", runHandler.UpdateExecutionStatus)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return &App{
		server: srv,
		dbPool: dbPool,
	}, nil
}

func (a *App) Run() error {
	slog.Info("Starting backend-service", slog.String("addr", a.server.Addr))
	if err := a.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}

func (a *App) Stop() {
	slog.Info("Stopping backend-service...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := a.server.Shutdown(ctx); err != nil {
		slog.Error("server shutdown error", slog.Any("error", err))
	}

	if a.dbPool != nil {
		a.dbPool.Close()
	}
}
