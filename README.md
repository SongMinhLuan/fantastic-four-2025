# Local Deploy (Dev)

This repo has 2 apps:
- Backend: Go + Postgres (Docker)
- Frontend: Vite + React

## Prerequisites
- Go 1.21+
- Node.js 18+
- Docker Desktop

## Backend (API)
1) Copy env:
```
cd d:\hackathon-emergency\hackathon2025-emergency-backend
copy .env.example .env
```
2) Update `.env`:
```
PORT=8881
DB_URL=postgres://invoiceflow:invoiceflow@localhost:5432/invoiceflow?sslmode=disable
JWT_SECRET=replace_me
```
3) Start Postgres:
```
docker-compose up -d
```
4) Run migrations (requires goose):
```
goose -dir migrations postgres "$env:DB_URL" up
```
5) Run API:
```
go run ./cmd/api
```
Health check: `GET http://localhost:8881/health`

## Frontend (Web)
1) Set API URL:
```
cd d:\hackathon-emergency\hackathon2025-emergency-frontend
echo VITE_API_URL=http://localhost:8881> .env
```
2) Install and run:
```
npm install
npm run dev
```
Open: `http://localhost:5173`

## Notes
- If `goose` is missing, install it:
```
go install github.com/pressly/goose/v3/cmd/goose@latest
```
- If DB auth fails, reset the volume:
```
docker-compose down -v
docker-compose up -d
```
