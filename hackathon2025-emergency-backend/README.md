# InvoiceFlow Backend

Scaffolded Go backend (Gin + Postgres + sqlx/pgx + goose).

## Requirements
- Go 1.21+
- Docker (for Postgres)

## Setup
1) Copy `.env.example` to `.env` and update values.
2) Start Postgres:
   - `docker-compose up -d`
3) Run migrations:
   - `goose -dir migrations postgres "$DB_URL" up`
4) Start the API:
   - `go run ./cmd/api`

## Health Check
- `GET /health` returns `{ "data": { "status": "ok" } }`

## Environment
- `DB_URL` is required.
- `JWT_SECRET` is required.
- Set `ENABLE_CHAIN=true` to enable on-chain features (requires CHAIN_* vars).

## Notes
- No business logic implemented yet.
