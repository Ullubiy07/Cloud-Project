package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"backend/internal/config"
	"backend/internal/model"
	"backend/internal/storage"
	"backend/internal/token"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type RunHandler struct {
	config       *config.Config
	storage      storage.Storage
	tokenService *token.TokenService
}

func NewRunHandler(cfg *config.Config, store storage.Storage, ts *token.TokenService) *RunHandler {
	return &RunHandler{
		config:       cfg,
		storage:      store,
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
		Status:    "pending",
	}

	// TODO: enqueue for execution

	if err := h.storage.CreateRunRequest(r.Context(), runReq); err != nil {
		log.Printf("failed to store run request: %v", err)
		h.respondWithError(w, http.StatusInternalServerError, "Failed to process request")
		return
	}

	log.Printf("run request created with ID: %s for User: %s", runReq.ID.String(), claims.UserID.String())

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
		log.Printf("failed to fetch run requests: %v", err)
		h.respondWithError(w, http.StatusInternalServerError, "Failed to fetch requests")
		return
	}

	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "ok",
		Message: "Success",
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
		log.Printf("failed to fetch single request %s: %v", idParam, err)
		h.respondWithError(w, http.StatusNotFound, "Request not found")
		return
	}

	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "ok",
		Message: "Success",
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
		log.Printf("failed to update run request status for %s: %v", idParam, err)
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update status")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "ok",
		Message: "Execution status updated successfully",
	})
}
