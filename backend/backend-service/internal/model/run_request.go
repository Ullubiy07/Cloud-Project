package model

import (
	"time"

	"github.com/google/uuid"
)

type File struct {
	Name    string `json:"name"`
	Content string `json:"content"`
}

type RunRequest struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	Language     string    `json:"language"`
	EntryFile    string    `json:"entry_file"`
	Files        []File    `json:"files"`
	Stdin        string    `json:"stdin"`
	Status       string    `json:"status"`
	Stdout       *string   `json:"stdout,omitempty"`
	Stderr       *string   `json:"stderr,omitempty"`
	ExitCode     *int      `json:"exit_code,omitempty"`
	ErrorMessage *string   `json:"error_message,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateRunRequestPayload struct {
	Language  string `json:"language"`
	EntryFile string `json:"entry_file"`
	Files     []File `json:"files"`
	Stdin     string `json:"stdin"`
}

type UpdateExecutionStatusPayload struct {
	Status       string  `json:"status"`
	Stdout       *string `json:"stdout,omitempty"`
	Stderr       *string `json:"stderr,omitempty"`
	ExitCode     *int    `json:"exit_code,omitempty"`
	ErrorMessage *string `json:"error_message,omitempty"`
}
