package services

import (
	"context"
	"errors"
	"time"

	"invoiceflow/internal/config"
	"invoiceflow/internal/domain"
	"invoiceflow/internal/repositories"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailExists        = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserSuspended      = errors.New("user suspended")
)

type AuthService struct {
	cfg  *config.Config
	repo *repositories.UserRepository
}

func NewAuthService(cfg *config.Config, repo *repositories.UserRepository) *AuthService {
	return &AuthService{cfg: cfg, repo: repo}
}

func (s *AuthService) Register(ctx context.Context, name string, email string, password string, role string) (*domain.User, error) {
	if role != domain.RoleInvestor && role != domain.RoleSME {
		return nil, errors.New("invalid role")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &domain.User{
		Role:         role,
		Name:         name,
		Email:        email,
		PasswordHash: string(hashed),
		Status:       domain.UserStatusActive,
	}

	created, err := s.repo.Create(ctx, user)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrEmailExists
		}
		return nil, err
	}

	return created, nil
}

func (s *AuthService) Login(ctx context.Context, email string, password string) (string, *domain.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return "", nil, ErrInvalidCredentials
	}

	if user.Status == domain.UserStatusSuspended {
		return "", nil, ErrUserSuspended
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", nil, ErrInvalidCredentials
	}

	token, err := s.signToken(user)
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
}

func (s *AuthService) GetUser(ctx context.Context, id string) (*domain.User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *AuthService) signToken(user *domain.User) (string, error) {
	ttl := time.Duration(s.cfg.JWTTTLMinutes) * time.Minute
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"role":  user.Role,
		"email": user.Email,
		"exp":   time.Now().Add(ttl).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}
