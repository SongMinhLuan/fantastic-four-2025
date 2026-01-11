package repositories

import (
	"context"

	"invoiceflow/internal/domain"

	"github.com/jmoiron/sqlx"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *domain.User) (*domain.User, error) {
	query := `
    INSERT INTO users (role, name, email, password_hash, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, role, name, email, password_hash, status, created_at, updated_at
  `

	var created domain.User
	err := r.db.GetContext(ctx, &created, query, user.Role, user.Name, user.Email, user.PasswordHash, user.Status)
	if err != nil {
		return nil, err
	}

	return &created, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
    SELECT id, role, name, email, password_hash, status, created_at, updated_at
    FROM users
    WHERE email = $1
  `

	var user domain.User
	if err := r.db.GetContext(ctx, &user, query, email); err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	query := `
    SELECT id, role, name, email, password_hash, status, created_at, updated_at
    FROM users
    WHERE id = $1
  `

	var user domain.User
	if err := r.db.GetContext(ctx, &user, query, id); err != nil {
		return nil, err
	}

	return &user, nil
}
