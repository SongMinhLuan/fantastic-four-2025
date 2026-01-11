package domain

import "time"

const (
	RoleAdmin    = "admin"
	RoleInvestor = "investor"
	RoleSME      = "sme"
)

const (
	UserStatusActive    = "ACTIVE"
	UserStatusPending   = "PENDING"
	UserStatusSuspended = "SUSPENDED"
)

type User struct {
	ID           string    `db:"id" json:"id"`
	Role         string    `db:"role" json:"role"`
	Name         string    `db:"name" json:"name"`
	Email        string    `db:"email" json:"email"`
	PasswordHash string    `db:"password_hash" json:"-"`
	Status       string    `db:"status" json:"status"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}
