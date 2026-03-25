package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"backend/internal/gigachat"
	"backend/internal/token"
)

type ExplainHandler struct {
	client       *gigachat.Client
	tokenService *token.TokenService
}

func NewExplainHandler(client *gigachat.Client, tokenService *token.TokenService) *ExplainHandler {
	return &ExplainHandler{
		client:       client,
		tokenService: tokenService,
	}
}

type ExplainRequest struct {
	Code string `json:"code"`
}

func (h *ExplainHandler) extractUser(r *http.Request) (*token.Claims, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, http.ErrNoCookie
	}
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	return h.tokenService.ValidateToken(tokenString)
}

func (h *ExplainHandler) respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "error",
		Message: message,
	})
}

func (h *ExplainHandler) ExplainCode(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	_, err := h.extractUser(r)
	if err != nil {
		h.respondWithError(w, http.StatusUnauthorized, "Invalid or missing token")
		return
	}

	var req ExplainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}
	defer r.Body.Close()

	if strings.TrimSpace(req.Code) == "" {
		h.respondWithError(w, http.StatusBadRequest, "Code cannot be empty")
		return
	}

	explanation, err := h.client.ExplainCode(r.Context(), req.Code)
	if err != nil {
		slog.Error("failed to get explanation from gigachat", slog.Any("error", err))
		h.respondWithError(w, http.StatusInternalServerError, "Failed to analyze code")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "ok",
		Message: "Success",
		Data: map[string]string{
			"explanation": explanation,
		},
	})
}
