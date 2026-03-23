package storage

import (
	"context"

	"backend/internal/model"

	"github.com/google/uuid"
)

type Storage interface {
	CreateRunRequest(ctx context.Context, req *model.RunRequest) error
	GetRunRequestsByUser(ctx context.Context, userID uuid.UUID) ([]model.RunRequest, error)
	GetRunRequestByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*model.RunRequest, error)
	UpdateRunRequestStatus(ctx context.Context, id uuid.UUID, payload model.UpdateExecutionStatusPayload) error
}
