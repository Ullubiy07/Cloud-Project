package main

import (
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"backend/internal/app"
	"backend/internal/config"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("Failed to load config", slog.Any("error", err))
		os.Exit(1)
	}

	application, err := app.New(cfg)
	if err != nil {
		slog.Error("Failed to initialize app", slog.Any("error", err))
		os.Exit(1)
	}

	go func() {
		if err := application.Run(); err != nil {
			slog.Error("Server error", slog.Any("error", err))
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	<-stop

	application.Stop()
	slog.Info("run-service stopped")
}
