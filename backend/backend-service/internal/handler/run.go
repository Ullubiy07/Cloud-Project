package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"backend/internal/config"
	"backend/internal/model"
	"backend/internal/queue"
	"backend/internal/storage"
	"backend/internal/token"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type RunHandler struct {
	config       *config.Config
	storage      storage.Storage
	queue        *queue.Service
	tokenService *token.TokenService
}

func NewRunHandler(cfg *config.Config, store storage.Storage, qs *queue.Service, ts *token.TokenService) *RunHandler {
	return &RunHandler{
		config:       cfg,
		storage:      store,
		queue:        qs,
		tokenService: ts,
	}
}

type StandardResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func (h *RunHandler) respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "error",
		Message: message,
	})
}

func (h *RunHandler) extractUser(r *http.Request) (*token.Claims, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, http.ErrNoCookie
	}
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	return h.tokenService.ValidateToken(tokenString)
}

func (h *RunHandler) RunRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	claims, err := h.extractUser(r)
	if err != nil {
		h.respondWithError(w, http.StatusUnauthorized, "Invalid or missing token")
		return
	}

	var payload model.CreateRunRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	defer r.Body.Close()

	if payload.Language == "" || payload.EntryFile == "" || len(payload.Files) == 0 {
		h.respondWithError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	runReq := &model.RunRequest{
		UserID:    claims.UserID,
		Language:  payload.Language,
		EntryFile: payload.EntryFile,
		Files:     payload.Files,
		Stdin:     payload.Stdin,
		Status:    "queued",
	}

	if err := h.storage.CreateRunRequest(r.Context(), runReq); err != nil {
		slog.Error("failed to store run request", slog.Any("error", err))
		h.respondWithError(w, http.StatusInternalServerError, "Failed to process request")
		return
	}

	if err := h.queue.SendMessage(r.Context(), runReq.ID.String()); err != nil {
		slog.Error("failed to enqueue run request", slog.Any("error", err))

		errorMsg := "System error: failed to enqueue task"
		if updateErr := h.storage.UpdateRunRequestStatus(r.Context(), runReq.ID, model.UpdateExecutionStatusPayload{
			Status:       "failed",
			ErrorMessage: &errorMsg,
		}); updateErr != nil {
			slog.Error("failed to update status to failed after enqueue error", slog.Any("error", updateErr))
		}

		h.respondWithError(w, http.StatusInternalServerError, "Failed to enqueue request for execution")
		return
	}

	slog.Info("run request created", slog.String("id", runReq.ID.String()), slog.String("user", claims.UserID.String()))

	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "ok",
		Message: "Enqueued for execution",
		Data: map[string]interface{}{
			"id": runReq.ID,
		},
	})
}

func (h *RunHandler) GetRunRequests(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	claims, err := h.extractUser(r)
	if err != nil {
		h.respondWithError(w, http.StatusUnauthorized, "Invalid or missing token")
		return
	}

	requests, err := h.storage.GetRunRequestsByUser(r.Context(), claims.UserID)
	if err != nil {
		slog.Error("failed to fetch run requests: %v", err)
		h.respondWithError(w, http.StatusInternalServerError, "Failed to fetch requests")
		return
	}

	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "ok",
		Message: "success",
		Data:    requests,
	})
}

func (h *RunHandler) GetRunRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	claims, err := h.extractUser(r)
	if err != nil {
		h.respondWithError(w, http.StatusUnauthorized, "Invalid or missing token")
		return
	}

	idParam := chi.URLParam(r, "id")
	reqID, err := uuid.Parse(idParam)
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	request, err := h.storage.GetRunRequestByID(r.Context(), reqID, claims.UserID)
	if err != nil {
		slog.Error("failed to fetch single request %s: %v", idParam, err)
		h.respondWithError(w, http.StatusNotFound, "Request not found")
		return
	}

	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "ok",
		Message: "success",
		Data:    request,
	})
}

func (h *RunHandler) UpdateExecutionStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	idParam := chi.URLParam(r, "id")
	reqID, err := uuid.Parse(idParam)
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request ID")
		return
	}

	var payload model.UpdateExecutionStatusPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	defer r.Body.Close()

	if payload.Status == "" {
		h.respondWithError(w, http.StatusBadRequest, "Status is required")
		return
	}

	if err := h.storage.UpdateRunRequestStatus(r.Context(), reqID, payload); err != nil {
		slog.Error("failed to update run request status for %s: %v", idParam, err)
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update status")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "ok",
		Message: "Execution status updated successfully",
	})
}
