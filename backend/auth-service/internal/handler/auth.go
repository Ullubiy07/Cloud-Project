package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/mail"
	"time"

	"auth/internal/model"
	"auth/internal/storage"
	"auth/internal/storage/postgres"
	"auth/internal/token"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	storage      storage.UserStorage
	tokenService *token.TokenService
}

func NewAuthHandler(storage storage.UserStorage, tokenService *token.TokenService) *AuthHandler {
	return &AuthHandler{
		storage:      storage,
		tokenService: tokenService,
	}
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type TokenResponse struct {
	Token string `json:"token"`
}

type StandardResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Username == "" || req.Email == "" || req.Password == "" {
		h.respondWithError(w, http.StatusBadRequest, "Username, email and password are required")
		return
	}

	if _, err := mail.ParseAddress(req.Email); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid email format")
		return
	}

	if len(req.Password) < 8 {
		h.respondWithError(w, http.StatusBadRequest, "Password must be at least 8 characters long")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	user := &model.User{
		ID:           uuid.New(),
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.storage.CreateUser(r.Context(), user); err != nil {
		if errors.Is(err, postgres.ErrDuplicateUser) {
			h.respondWithError(w, http.StatusConflict, err.Error())
		} else {
			h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "ok",
		Message: "User registered successfully",
	})
}

func (h *AuthHandler) respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "error",
		Message: message,
	})
}
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Username == "" || req.Password == "" {
		h.respondWithError(w, http.StatusBadRequest, "Username and password are required")
		return
	}

	user, err := h.storage.GetUserByUsername(r.Context(), req.Username)
	if err != nil {
		h.respondWithError(w, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		h.respondWithError(w, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	tokenStr, err := h.tokenService.GenerateToken(user.ID, user.Username, user.Email)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	json.NewEncoder(w).Encode(TokenResponse{Token: tokenStr})
}

type ResetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Token == "" || req.Password == "" {
		h.respondWithError(w, http.StatusBadRequest, "Token and password are required")
		return
	}

	if len(req.Password) < 8 {
		h.respondWithError(w, http.StatusBadRequest, "Password must be at least 8 characters long")
		return
	}

	claims, err := h.tokenService.ValidateToken(req.Token)
	if err != nil {
		h.respondWithError(w, http.StatusUnauthorized, "Invalid or expired token")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	if err := h.storage.UpdatePassword(r.Context(), claims.UserID, string(hashedPassword)); err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(StandardResponse{
		Status:  "ok",
		Message: "Password updated successfully",
	})
}

type InternalResetRequest struct {
	Email string `json:"email"`
}

func (h *AuthHandler) InternalReset(w http.ResponseWriter, r *http.Request) {
	var req InternalResetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Email == "" {
		h.respondWithError(w, http.StatusBadRequest, "Email is required")
		return
	}

	user, err := h.storage.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		h.respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	tokenStr, err := h.tokenService.GenerateToken(user.ID, user.Username, user.Email)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TokenResponse{Token: tokenStr})
}
