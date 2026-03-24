package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"backend/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Storage struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Storage {
	return &Storage{db: db}
}

func (s *Storage) CreateRunRequest(ctx context.Context, req *model.RunRequest) error {
	query := `
		INSERT INTO run_requests (user_id, language, entry_file, files, stdin, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	filesJSON, err := json.Marshal(req.Files)
	if err != nil {
		return fmt.Errorf("failed to marshal files: %w", err)
	}

	err = s.db.QueryRow(ctx, query,
		req.UserID,
		req.Language,
		req.EntryFile,
		filesJSON,
		req.Stdin,
		req.Status,
	).Scan(&req.ID, &req.CreatedAt, &req.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to insert run request: %w", err)
	}

	return nil
}

func (s *Storage) GetRunRequestsByUser(ctx context.Context, userID uuid.UUID) ([]model.RunRequest, error) {
	query := `
		SELECT id, user_id, language, entry_file, files, stdin, status, stdout, stderr, exit_code, error_message, flags, metrics, created_at, updated_at
		FROM run_requests
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := s.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	var requests []model.RunRequest
	for rows.Next() {
		var req model.RunRequest
		var filesJSON []byte
		if err := rows.Scan(
			&req.ID, &req.UserID, &req.Language, &req.EntryFile,
			&filesJSON, &req.Stdin, &req.Status, &req.Stdout, &req.Stderr, &req.ExitCode, &req.ErrorMessage, &req.Flags, &req.Metrics, &req.CreatedAt, &req.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan failed: %w", err)
		}
		if err := json.Unmarshal(filesJSON, &req.Files); err != nil {
			return nil, fmt.Errorf("failed to parse files: %w", err)
		}
		requests = append(requests, req)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("row iteration error: %w", err)
	}

	if requests == nil {
		requests = []model.RunRequest{}
	}
	return requests, nil
}

func (s *Storage) GetRunRequestByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*model.RunRequest, error) {
	query := `
		SELECT id, user_id, language, entry_file, files, stdin, status, stdout, stderr, exit_code, error_message, flags, metrics, created_at, updated_at
		FROM run_requests
		WHERE id = $1 AND user_id = $2
	`
	var req model.RunRequest
	var filesJSON []byte
	err := s.db.QueryRow(ctx, query, id, userID).Scan(
		&req.ID, &req.UserID, &req.Language, &req.EntryFile,
		&filesJSON, &req.Stdin, &req.Status, &req.Stdout, &req.Stderr, &req.ExitCode, &req.ErrorMessage, &req.Flags, &req.Metrics, &req.CreatedAt, &req.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("query single failed: %w", err)
	}
	if err := json.Unmarshal(filesJSON, &req.Files); err != nil {
		return nil, fmt.Errorf("failed to parse files: %w", err)
	}
	return &req, nil
}

func (s *Storage) UpdateRunRequestStatus(ctx context.Context, id uuid.UUID, payload model.UpdateExecutionStatusPayload) error {
	query := `
		UPDATE run_requests
		SET status = $1, stdout = $2, stderr = $3, exit_code = $4, error_message = $5, flags = $6, metrics = $7, updated_at = CURRENT_TIMESTAMP
		WHERE id = $8
	`
	tag, err := s.db.Exec(ctx, query, payload.Status, payload.Stdout, payload.Stderr, payload.ExitCode, payload.ErrorMessage, payload.Flags, payload.Metrics, id)
	if err != nil {
		return fmt.Errorf("failed to update run request status: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("run request not found")
	}
	return nil
}
